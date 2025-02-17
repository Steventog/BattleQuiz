const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Game = require('./models/Game');
const { EasyQuestion, MediumQuestion, HardQuestion } = require('./models/Question');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);

// Configuration de Socket.IO avec gestion des CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Map pour suivre les connexions socket <-> playerId
const playerConnections = new Map();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('=== Démarrage du serveur ===');
  console.log('Tentative de connexion à MongoDB...');
  console.log('Connecté à MongoDB avec succès');
  console.log('Base de données: BattleQuiz');
})
.catch((err) => {
  console.error('Erreur de connexion à MongoDB:', err);
  process.exit(1);
});

// Fonction pour obtenir le modèle de questions en fonction de la difficulté
async function getRandomQuestions(difficulty, count = 20) {
  console.log('=== Début de getRandomQuestions ===');
  console.log('Difficulté demandée:', difficulty);
  console.log('Nombre de questions demandées:', count);

  let QuestionModel;
  switch (difficulty.toLowerCase()) {
    case 'facile':
      QuestionModel = EasyQuestion;
      break;
    case 'intermédiaire':
      QuestionModel = MediumQuestion;
      break;
    case 'difficile':
      QuestionModel = HardQuestion;
      break;
    default:
      throw new Error('Difficulté invalide');
  }

  try {
    const totalQuestions = await QuestionModel.countDocuments();
    console.log('Nombre total de questions disponibles:', totalQuestions);

    const questions = await QuestionModel.aggregate([
      { $sample: { size: Math.min(count, totalQuestions) } }
    ]);

    console.log('Nombre de questions récupérées:', questions.length);
    if (questions.length > 0) {
      console.log('Exemple de question:', {
        question: questions[0].question,
        choix1: questions[0].choix1,
        choix2: questions[0].choix2,
        choix3: questions[0].choix3,
        choix4: questions[0].choix4,
        reponse: questions[0].reponse
      });
    }

    return questions;
  } catch (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    throw error;
  }
}

// Fonction pour obtenir la prochaine question
async function getNextQuestion(game) {
  const currentQuestionIndex = game.questions.findIndex(q => q._id.toString() === game.currentQuestion._id.toString());
  if (currentQuestionIndex === -1) {
    throw new Error('Question actuelle non trouvée');
  }

  const nextQuestionIndex = currentQuestionIndex + 1;
  if (nextQuestionIndex >= game.questions.length) {
    throw new Error('Pas de question suivante');
  }

  return game.questions[nextQuestionIndex];
}

// Gestion des connexions socket
io.on('connection', (socket) => {
  console.log('Nouveau client connecté:', socket.id);

  // Créer une nouvelle partie
  socket.on('createGame', async (data) => {
    try {
      console.log('Création de partie demandée:', data);
      
      const gameId = uuidv4().substring(0, 6).toUpperCase();
      const game = await Game.create({
        gameId,
        createdBy: socket.id,
        maxPlayers: data.maxPlayers,
        difficulty: data.difficulty,
        players: [{
          playerId: socket.id,
          username: data.username,
          score: 0
        }]
      });

      socket.join(gameId);
      io.to(gameId).emit('gameCreated', game);
      console.log('Partie créée:', game);
    } catch (error) {
      console.error('Erreur création partie:', error);
      socket.emit('error', 'Erreur lors de la création de la partie');
    }
  });

  // Rejoindre une partie
  socket.on('joinGame', async (data) => {
    try {
      console.log('Demande pour rejoindre la partie:', data);
      
      const game = await Game.findOne({ gameId: data.gameId });
      if (!game) {
        socket.emit('error', 'Partie non trouvée');
        return;
      }

      if (game.players.length >= game.maxPlayers) {
        socket.emit('error', 'La partie est complète');
        return;
      }

      const player = {
        playerId: socket.id,
        username: data.username,
        score: 0
      };

      game.players.push(player);
      await game.save();

      socket.join(game.gameId);
      io.to(game.gameId).emit('playerJoined', game);
      
      console.log('Joueur rejoint:', player);
    } catch (error) {
      console.error('Erreur joinGame:', error);
      socket.emit('error', 'Erreur lors de la connexion à la partie');
    }
  });

  // Démarrer la partie
  socket.on('startGame', async (gameId) => {
    try {
      console.log('Démarrage de partie demandé:', gameId);
      
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

      // Charger les questions
      const questions = await getRandomQuestions(game.difficulty);
      if (!questions || questions.length === 0) {
        socket.emit('error', 'Aucune question trouvée pour cette difficulté');
        return;
      }

      game.questions = questions;
      game.currentQuestionIndex = 0;
      game.status = 'playing';
      await game.save();

      io.to(game.gameId).emit('gameStarting', game);

      // Démarrer le compte à rebours
      let count = 3;
      const countdownInterval = setInterval(() => {
        if (count >= 0) {
          io.to(game.gameId).emit('countdown', count);
          count--;
        } else {
          clearInterval(countdownInterval);
          io.to(game.gameId).emit('gameState', {
            players: game.players,
            currentQuestion: questions[0]
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Erreur startGame:', error);
      socket.emit('error', 'Erreur lors du démarrage de la partie');
    }
  });

  // Rejoindre une room de jeu
  socket.on('joinGameRoom', async (data) => {
    try {
      console.log('Rejoindre game room:', data);
      
      const game = await Game.findOne({ gameId: data.gameId });
      if (!game) {
        socket.emit('error', 'Partie non trouvée');
        return;
      }

      const player = game.players.find(p => p.playerId === data.playerId);
      if (!player) {
        socket.emit('error', 'Joueur non trouvé dans la partie');
        return;
      }

      socket.join(data.gameId);
      
      io.to(data.gameId).emit('gameState', {
        players: game.players,
        currentQuestion: game.questions[game.currentQuestionIndex]
      });
    } catch (error) {
      console.error('Erreur joinGameRoom:', error);
      socket.emit('error', 'Erreur lors de la connexion à la room');
    }
  });

  // Soumettre une réponse
  socket.on('submitAnswer', async (data) => {
    try {
      console.log('Réponse soumise:', data);
      
      const game = await Game.findOne({ gameId: data.gameId });
      if (!game) {
        socket.emit('error', 'Partie non trouvée');
        return;
      }

      const currentQuestion = game.questions[game.currentQuestionIndex];
      const player = game.players.find(p => p.playerId === data.playerId);
      
      if (!player) {
        socket.emit('error', 'Joueur non trouvé');
        return;
      }

      const isCorrect = data.answer === currentQuestion.reponse;
      
      if (isCorrect) {
        player.score += 10;
        game.currentQuestionIndex++;
        await game.save();

        if (game.currentQuestionIndex >= game.questions.length) {
          // Fin de la partie
          const winner = game.players.reduce((prev, current) => {
            return (prev.score > current.score) ? prev : current;
          });

          io.to(game.gameId).emit('gameOver', { winner });
        } else {
          // Question suivante
          io.to(game.gameId).emit('correctAnswer', {
            players: game.players,
            nextQuestion: game.questions[game.currentQuestionIndex]
          });
        }
      } else {
        socket.emit('wrongAnswer');
      }
    } catch (error) {
      console.error('Erreur submitAnswer:', error);
      socket.emit('error', 'Erreur lors de la soumission de la réponse');
    }
  });

  // Quitter le lobby
  socket.on('leaveLobby', async (data) => {
    try {
      console.log('Quitter le lobby:', data);
      
      const game = await Game.findOne({ gameId: data.gameId });
      if (!game) return;

      game.players = game.players.filter(p => p.playerId !== data.playerId);
      await game.save();

      socket.leave(data.gameId);
      io.to(data.gameId).emit('playerJoined', game);
    } catch (error) {
      console.error('Erreur leaveLobby:', error);
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Serveur démarré sur le port', PORT);
});
