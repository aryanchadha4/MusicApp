require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/musicratingapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Basic test route
app.get('/', (req, res) => {
  res.send('Music Rating App Backend is running');
});

// Import and use the authentication routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Spotify proxy route
const spotifyRoutes = require('./routes/spotify');
app.use('/api/spotify', spotifyRoutes);

const diaryRoutes = require('./routes/diary');
app.use('/api/diary', diaryRoutes);

const listsRoutes = require('./routes/lists');
app.use('/api/lists', listsRoutes);

const networkRoutes = require('./routes/network');
app.use('/api/network', networkRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
