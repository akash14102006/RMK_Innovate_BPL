const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/festivals/upcoming
 * Get upcoming festivals in India
 */
router.get('/upcoming', authMiddleware, async (req, res) => {
    const year = new Date().getFullYear();

    try {
        const response = await axios.get(
            `https://calendarific.com/api/v2/holidays`,
            {
                params: {
                    api_key: process.env.CALENDARIFIC_API_KEY,
                    country: 'IN',
                    year: year,
                    type: 'national,religious'
                }
            }
        );

        const now = new Date();
        const festivals = response.data.response.holidays
            .filter(holiday => new Date(holiday.date.iso) >= now)
            .slice(0, 10)
            .map(holiday => ({
                name: holiday.name,
                date: holiday.date.iso,
                day: holiday.date.datetime.day,
                month: holiday.date.datetime.month,
                year: holiday.date.datetime.year,
                description: holiday.description,
                type: holiday.type,
                locations: holiday.locations
            }));

        res.json({
            festivals,
            count: festivals.length,
            year
        });
    } catch (error) {
        console.error('Festival API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch festivals' });
    }
});

/**
 * GET /api/festivals/all/:year
 * Get all festivals for a specific year
 */
router.get('/all/:year', authMiddleware, async (req, res) => {
    const { year } = req.params;

    try {
        const response = await axios.get(
            `https://calendarific.com/api/v2/holidays`,
            {
                params: {
                    api_key: process.env.CALENDARIFIC_API_KEY,
                    country: 'IN',
                    year: year,
                    type: 'national,religious'
                }
            }
        );

        const festivals = response.data.response.holidays.map(holiday => ({
            name: holiday.name,
            date: holiday.date.iso,
            description: holiday.description,
            type: holiday.type
        }));

        res.json({
            festivals,
            count: festivals.length,
            year
        });
    } catch (error) {
        console.error('Festival API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch festivals' });
    }
});

module.exports = router;

/* updated */
