const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: String,
  username: String,
  character: String,
  currentLevel: {
    type: Number,
    default: 0
  },
  bonuses: {
    type: [{
      type: String,
      enum: ['shield', 'attack']
    }],
    default: []
  }
});

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  createdBy: {
    type: String,
    required: true
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 2,
    max: 4
  },
  players: [playerSchema],
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  difficulty: {
    type: String,
    enum: ['facile', 'intermédiaire', 'difficile'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', gameSchema);
