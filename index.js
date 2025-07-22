require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');


const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME; 
const SECRET = process.env.JWT_SECRET;

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ user: username }, SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }

  res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
});


app.listen(PORT, () => {
  console.log(`✅ Backend en écoute sur http://localhost:${PORT}`);
});

app.get('/followers', async (req, res) => {
  try {
    const response = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'username,followers_count',
        access_token: process.env.INSTAGRAM_TOKEN,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erreur Instagram API :', error.response?.data || error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des followers' });
  }
});