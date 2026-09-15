const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/news/health-alerts
 * Get health-related news and disease outbreak alerts
 */
router.get('/health-alerts', authMiddleware, async (req, res) => {
    try {
        const response = await axios.get(
            'https://newsapi.org/v2/everything',
            {
                params: {
                    q: 'disease outbreak India OR health alert India OR epidemic India',
                    apiKey: process.env.NEWS_API_KEY,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 20,
                    domains: 'timesofindia.indiatimes.com,ndtv.com,indianexpress.com,thehindu.com'
                }
            }
        );

        const articles = response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            source: article.source.name,
            url: article.url,
            publishedAt: article.publishedAt,
            image: article.urlToImage,
            author: article.author
        }));

        res.json({
            articles,
            totalResults: response.data.totalResults,
            count: articles.length
        });
    } catch (error) {
        console.error('News API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch health alerts' });
    }
});

/**
 * GET /api/news/search
 * Search health news by query
 */
router.get('/search', authMiddleware, async (req, res) => {
    const { q, pageSize = 10 } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        const response = await axios.get(
            'https://newsapi.org/v2/everything',
            {
                params: {
                    q: `${q} India health`,
                    apiKey: process.env.NEWS_API_KEY,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: parseInt(pageSize)
                }
            }
        );

        const articles = response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            source: article.source.name,
            url: article.url,
            publishedAt: article.publishedAt,
            image: article.urlToImage
        }));

        res.json({ articles, count: articles.length });
    } catch (error) {
        console.error('News search error:', error.message);
        res.status(500).json({ error: 'Failed to search news' });
    }
});

module.exports = router;

/* updated */
