const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors({
  origin: 'http://localhost:5000',    // allowed only for the Angular frontend
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

app.use((req, res, next) => {   // preflight OPTIONS response for all routes
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());    // JSON body parse

app.get('/get-places', async (req, res) => {
  try {
    const mavResponse = await axios.get(
      'https://emma.mav.hu/otp2-backend/otp/routers/default/geocode/stations',
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        params: {
          q: req.query.q,
          limit: req.query.limit || 10
        }
      }
    );

    res.json(mavResponse.data);
  } catch (err) {
    console.error('❌ API ERROR:', err.response?.data || err.message);
    res.status(500).json({
      error: 'GET places unsuccessful',
      detail: err.response?.data || err.message
    });
  }
});

app.post('/get-route', async (req, res) => {
  try {
    const mavResponse = await axios.post(
      'https://emma.mav.hu/otp2-backend/otp/routers/default/index/graphql',
      {
        query: req.body.query,
        variables: req.body.variables
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    res.json(mavResponse.data);
  } catch (err) {
    console.error('❌ API ERROR:', err.response?.data || err.message);
    res.status(500).json({
      error: 'GET routes unsuccessful',
      detail: err.response?.data || err.message
    });
  }
});

app.post('/get-train', async (req, res) => {
  try {
    const mavResponse = await axios.post(
      'https://emma.mav.hu/otp2-backend/otp/routers/default/index/graphql',
      {
        query: req.body.query,
        variables: req.body.variables
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    res.json(mavResponse.data);
  } catch (err) {
    console.error('❌ API ERROR:', err.response?.data || err.message);
    res.status(500).json({
      error: 'GET train unsuccessful',
      detail: err.response?.data || err.message
    });
  }
});

app.post('/get-trip', async (req, res) => {
  try {
    const mavResponse = await axios.post(
      'https://emma.mav.hu/otp2-backend/otp/routers/default/index/graphql',
      {
        query: req.body.query,
        variables: req.body.variables
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    res.json(mavResponse.data);
  } catch (err) {
    console.error('❌ API ERROR:', err.response?.data || err.message);
    res.status(500).json({
      error: 'GET trip unsuccessful',
      detail: err.response?.data || err.message
    });
  }
});

app.get('/get-location', async (req, res) => {
  try {
    const mavResponse = await axios.get(
      'https://nominatim.openstreetmap.org/reverse',
      {
        params: {
          lat: req.query.lat,
          lon: req.query.lon,
          format: req.query.format || 'json'
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    res.json(mavResponse.data);
  } catch (err) {
    console.error('❌ API ERROR:', err.response?.data || err.message);
    res.status(500).json({
      error: 'GET location unsuccessful',
      detail: err.response?.data || err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Axios proxy szerver is running: http://localhost:${PORT}`);
});
