const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/pollution/live/:city
 * Get real-time pollution data for a specific city
 */
router.get('/live/:city', authMiddleware, async (req, res) => {
    const { city } = req.params;

    try {
        const response = await axios.get(
            `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_KEY}`
        );

        if (response.data.status !== 'ok') {
            return res.status(404).json({ error: `Pollution data not available for ${city}` });
        }

        const rawData = response.data.data;

        // Clean and format response
        const data = {
            city: rawData.city.name,
            aqi: rawData.aqi,
            dominantPollutant: rawData.dominentpol,
            time: rawData.time.s,
            timezone: rawData.time.tz,
            pollutants: {
                pm25: rawData.iaqi.pm25?.v || null,
                pm10: rawData.iaqi.pm10?.v || null,
                o3: rawData.iaqi.o3?.v || null,
                no2: rawData.iaqi.no2?.v || null,
                so2: rawData.iaqi.so2?.v || null,
                co: rawData.iaqi.co?.v || null,
            },
            location: {
                lat: rawData.city.geo[0],
                lng: rawData.city.geo[1]
            }
        };

        res.json(data);
    } catch (error) {
        console.error('Pollution API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch pollution data' });
    }
});

/**
 * GET /api/pollution/cities
 * Get pollution data for major Indian cities
 */
router.get('/cities', authMiddleware, async (req, res) => {
    const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad', 'Ahmedabad'];

    try {
        const requests = cities.map(city =>
            axios.get(`https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_KEY}`)
                .catch(err => ({ data: { status: 'error', city } }))
        );

        const responses = await Promise.all(requests);

        const data = responses
            .filter(r => r.data.status === 'ok')
            .map(r => ({
                city: r.data.data.city.name,
                aqi: r.data.data.aqi,
                dominantPollutant: r.data.data.dominentpol,
                location: {
                    lat: r.data.data.city.geo[0],
                    lng: r.data.data.city.geo[1]
                }
            }));

        res.json({ cities: data, count: data.length });
    } catch (error) {
        console.error('Cities pollution error:', error.message);
        res.status(500).json({ error: 'Failed to fetch cities pollution data' });
    }
});

module.exports = router;

/* updated */
