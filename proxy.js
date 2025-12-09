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

const MAVPLUSZ_GRAPHQL = 'https://mavplusz.hu/otp2-backend/otp/routers/default/index/graphql';
const MAVPLUSZ_PLACES = 'https://mavplusz.hu/otp2-backend/otp/routers/default/geocode/stations';

app.get('/get-places', async (req, res) => {
  try {
    const mavResponse = await axios.get(MAVPLUSZ_PLACES, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      params: {
        q: req.query.q,
        limit: req.query.limit || 10
      }
    });

    res.json(mavResponse.data);
  } catch (err) {
    console.error('❌ API ERROR:', err.response?.data || err.message);
    res.status(500).json({
      error: 'GET places unsuccessful',
      detail: err.response?.data || err.message
    });
  }
});

const graphqlProxy = async (req, res, errorMessage) => {
  try {
    const mavResponse = await axios.post(
      MAVPLUSZ_GRAPHQL,
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
      error: errorMessage,
      detail: err.response?.data || err.message
    });
  }
};

// POST endpoints
app.post('/get-route', (req, res) => graphqlProxy(req, res, 'GET routes unsuccessful'));
app.post('/get-train', (req, res) => graphqlProxy(req, res, 'GET train unsuccessful'));
app.post('/get-trip', (req, res) => graphqlProxy(req, res, 'GET trip unsuccessful'));
app.post('/get-trip-path', (req, res) => graphqlProxy(req, res, 'GET trip path unsuccessful'));
app.post('/get-vehicle-position', (req, res) => graphqlProxy(req, res, 'GET vehicle location unsuccessful'));
app.post('/get-route-path', (req, res) => graphqlProxy(req, res, 'GET route path unsuccessful'));
app.post('/get-nearby-vehicles', (req, res) => graphqlProxy(req, res, 'GET nearby vehicles unsuccessful'));

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
