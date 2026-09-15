const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/weather/current/:city
 * Get current weather for a specific city
 */
router.get('/current/:city', authMiddleware, async (req, res) => {
    const { city } = req.params;

    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather`,
            {
                params: {
                    q: city,
                    appid: process.env.OPENWEATHER_API_KEY,
                    units: 'metric'
                }
            }
        );

        const data = {
            city: response.data.name,
            country: response.data.sys.country,
            temperature: Math.round(response.data.main.temp),
            feelsLike: Math.round(response.data.main.feels_like),
            humidity: response.data.main.humidity,
            pressure: response.data.main.pressure,
            description: response.data.weather[0].description,
            main: response.data.weather[0].main,
            icon: response.data.weather[0].icon,
            windSpeed: response.data.wind.speed,
            cloudiness: response.data.clouds.all,
            sunrise: new Date(response.data.sys.sunrise * 1000).toISOString(),
            sunset: new Date(response.data.sys.sunset * 1000).toISOString(),
            location: {
                lat: response.data.coord.lat,
                lng: response.data.coord.lon
            }
        };

        res.json(data);
    } catch (error) {
        console.error('Weather API error:', error.message);
        if (error.response?.status === 404) {
            return res.status(404).json({ error: `Weather data not available for ${city}` });
        }
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

/**
 * GET /api/weather/forecast/:city
 * Get 5-day weather forecast
 */
router.get('/forecast/:city', authMiddleware, async (req, res) => {
    const { city } = req.params;

    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast`,
            {
                params: {
                    q: city,
                    appid: process.env.OPENWEATHER_API_KEY,
                    units: 'metric'
                }
            }
        );

        const forecast = response.data.list
            .filter((_, index) => index % 8 === 0) // Get one per day
            .slice(0, 5)
            .map(day => ({
                date: day.dt_txt,
                temperature: Math.round(day.main.temp),
                description: day.weather[0].description,
                humidity: day.main.humidity,
                windSpeed: day.wind.speed
            }));

        res.json({
            city: response.data.city.name,
            country: response.data.city.country,
            forecast
        });
    } catch (error) {
        console.error('Weather forecast error:', error.message);
        res.status(500).json({ error: 'Failed to fetch weather forecast' });
    }
});

module.exports = router;

/* updated */
