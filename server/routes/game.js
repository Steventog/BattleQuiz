const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Question = require('../models/Question');

// Récupérer la liste des parties disponibles
router.get('/games', async (req, res) => {
  try {
    const games = await Game.find({ status: 'waiting' });
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Créer une nouvelle partie
router.post('/games', async (req, res) => {
  try {
    const { maxPlayers, difficulty, createdBy } = req.body;
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const game = new Game({
      gameId,
      maxPlayers,
      difficulty,
      createdBy,
      status: 'waiting'
    });

    const savedGame = await game.save();
    res.status(201).json(savedGame);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Récupérer une partie par son ID
router.get('/games/:id', async (req, res) => {
  try {
    const game = await Game.findOne({ gameId: req.params.id });
    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mettre à jour le statut d'une partie
router.patch('/games/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const game = await Game.findOneAndUpdate(
      { gameId: req.params.id },
      { status },
      { new: true }
    );
    if (!game) {
      return res.status(404).json({ message: 'Partie non trouvée' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
