const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
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
}, { collection: 'easy' }); // Spécifier explicitement le nom de la collection

// Créer les modèles en pointant vers les collections existantes
const EasyQuestion = mongoose.model('EasyQuestion', questionSchema, 'easy');
const MediumQuestion = mongoose.model('MediumQuestion', questionSchema, 'medium');
const HardQuestion = mongoose.model('HardQuestion', questionSchema, 'hard');

module.exports = {
  EasyQuestion,
  MediumQuestion,
  HardQuestion
};
