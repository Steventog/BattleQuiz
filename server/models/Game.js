const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  }
});

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  choix1: {
    type: String,
    required: true
  },
  choix2: {
    type: String,
    required: true
  },
  choix3: {
    type: String,
    required: true
  },
  choix4: {
    type: String,
    required: true
  },
  reponse: {
    type: String,
    required: true
  }
});

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
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
  difficulty: {
    type: String,
    required: true,
    enum: ['facile', 'intermédiaire', 'difficile']
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  players: [playerSchema],
  questions: [questionSchema]
}, {
  timestamps: true
});

// Méthode pour mettre à jour le jeu de manière sûre
gameSchema.statics.findAndModify = async function(gameId, update) {
  let retries = 3;
  while (retries > 0) {
    try {
      const game = await this.findOne({ gameId });
      if (!game) return null;

      Object.assign(game, update);
      await game.save();
      return game;
    } catch (error) {
      if (error.name === 'VersionError' && retries > 1) {
        retries--;
        continue;
      }
      throw error;
    }
  }
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
