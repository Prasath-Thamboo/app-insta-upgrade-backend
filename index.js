const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

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

app.listen(process.env.PORT || 5000, () => {
  console.log(`✅ Backend lancé sur le port ${process.env.PORT || 5000}`);
});
