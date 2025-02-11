const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: [
      array => array.length === 4,
      'Les questions doivent avoir exactement 4 options'
    ]
  },
  correctAnswer: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['facile', 'intermédiaire', 'difficile'],
    required: true
  },
  category: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Question', questionSchema);
