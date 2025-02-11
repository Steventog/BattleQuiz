const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const gameRoutes = require('./routes/game');
const Game = require('./models/Game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api', gameRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/BattleQuiz')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Créer une partie
  socket.on('createGame', async (data) => {
    try {
      const { username, maxPlayers, difficulty } = data;
      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const game = new Game({
        gameId,
        maxPlayers,
        difficulty,
        createdBy: socket.id,
        players: [{
          playerId: socket.id,
          username,
          character: '😊', // Character par défaut
          currentLevel: 0
        }]
      });

      await game.save();
      socket.join(gameId);
      io.to(gameId).emit('gameCreated', game);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Rejoindre une partie
  socket.on('joinGame', async (data) => {
    try {
      const { gameId, username } = data;
      const game = await Game.findOne({ gameId });

      if (!game) {
        socket.emit('error', 'Partie non trouvée');
        return;
      }

      if (game.status !== 'waiting') {
        socket.emit('error', 'La partie a déjà commencé');
        return;
      }

      if (game.players.length >= game.maxPlayers) {
        socket.emit('error', 'La partie est complète');
        return;
      }

      game.players.push({
        playerId: socket.id,
        username,
        character: '😊', // Character par défaut
        currentLevel: 0
      });

      await game.save();
      socket.join(gameId);
      io.to(gameId).emit('playerJoined', game);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Quitter le lobby
  socket.on('leaveLobby', async (data) => {
    try {
      const { gameId, playerId } = data;
      const game = await Game.findOne({ gameId });

      if (!game) return;

      if (game.createdBy === playerId) {
        // Si le créateur quitte, on annule la partie
        await Game.deleteOne({ gameId });
        io.to(gameId).emit('gameCancelled');
      } else {
        // Sinon on retire juste le joueur
        game.players = game.players.filter(p => p.playerId !== playerId);
        await game.save();
        io.to(gameId).emit('playerLeft', game);
      }

      socket.leave(gameId);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Démarrer la partie
  socket.on('startGame', async (gameId) => {
    try {
      const game = await Game.findOne({ gameId });

      if (!game) {
        socket.emit('error', 'Partie non trouvée');
        return;
      }

      if (game.createdBy !== socket.id) {
        socket.emit('error', 'Seul le créateur peut démarrer la partie');
        return;
      }

      if (game.players.length < 2) {
        socket.emit('error', 'Il faut au moins 2 joueurs pour démarrer');
        return;
      }

      game.status = 'playing';
      await game.save();
      io.to(gameId).emit('gameStarted', game);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  // Gérer la déconnexion
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    try {
      // Rechercher toutes les parties où le joueur est présent
      const games = await Game.find({
        'players.playerId': socket.id
      });

      for (const game of games) {
        if (game.createdBy === socket.id) {
          // Si c'était le créateur, annuler la partie
          await Game.deleteOne({ gameId: game.gameId });
          io.to(game.gameId).emit('gameCancelled');
        } else {
          // Sinon retirer le joueur
          game.players = game.players.filter(p => p.playerId !== socket.id);
          await game.save();
          io.to(game.gameId).emit('playerLeft', game);
        }
      }
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
