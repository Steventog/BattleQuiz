const mongoose = require('mongoose');
const { EasyQuestion, MediumQuestion, HardQuestion } = require('./models/Question');

// Questions faciles
const easyQuestions = [
  {
    question: "Quelle est la capitale de la France ?",
    choix1: "Paris",
    choix2: "Londres",
    choix3: "Berlin",
    choix4: "Madrid",
    reponse: "Paris"
  },
  {
    question: "Combien font 2 + 2 ?",
    choix1: "3",
    choix2: "4",
    choix3: "5",
    choix4: "6",
    reponse: "4"
  },
  {
    question: "Quelle est la couleur du ciel par temps clair ?",
    choix1: "Rouge",
    choix2: "Vert",
    choix3: "Bleu",
    choix4: "Jaune",
    reponse: "Bleu"
  }
];

// Questions intermédiaires
const mediumQuestions = [
  {
    question: "Qui a peint la Joconde ?",
    choix1: "Van Gogh",
    choix2: "Leonard de Vinci",
    choix3: "Picasso",
    choix4: "Michel-Ange",
    reponse: "Leonard de Vinci"
  },
  {
    question: "En quelle année a eu lieu la Révolution française ?",
    choix1: "1789",
    choix2: "1799",
    choix3: "1769",
    choix4: "1779",
    reponse: "1789"
  },
  {
    question: "Quel est le plus grand océan du monde ?",
    choix1: "Atlantique",
    choix2: "Indien",
    choix3: "Pacifique",
    choix4: "Arctique",
    reponse: "Pacifique"
  }
];

// Questions difficiles
const hardQuestions = [
  {
    question: "Quelle est la formule de l'énergie selon Einstein ?",
    choix1: "E=mc²",
    choix2: "E=mv²",
    choix3: "E=mgh",
    choix4: "E=hf",
    reponse: "E=mc²"
  },
  {
    question: "Quel est l'élément chimique le plus abondant dans l'univers ?",
    choix1: "Oxygène",
    choix2: "Carbone",
    choix3: "Hydrogène",
    choix4: "Hélium",
    reponse: "Hydrogène"
  },
  {
    question: "Quelle est la plus grande planète du système solaire ?",
    choix1: "Mars",
    choix2: "Jupiter",
    choix3: "Saturne",
    choix4: "Neptune",
    reponse: "Jupiter"
  }
];

async function initDb() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/BattleQuiz');
    console.log('Connected to MongoDB');

    // Supprimer les anciennes questions
    await Promise.all([
      EasyQuestion.deleteMany({}),
      MediumQuestion.deleteMany({}),
      HardQuestion.deleteMany({})
    ]);
    console.log('Old questions deleted');

    // Insérer les nouvelles questions
    await Promise.all([
      EasyQuestion.insertMany(easyQuestions),
      MediumQuestion.insertMany(mediumQuestions),
      HardQuestion.insertMany(hardQuestions)
    ]);
    console.log('New questions inserted');

    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDb();
