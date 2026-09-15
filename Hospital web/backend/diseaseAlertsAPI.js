/**
 * Disease Alert Aggregation Service (Backend)
 * 
 * Fetches real-time disease outbreak data from multiple RSS feeds:
 * - Google News RSS (disease outbreak searches)
 * - WHO Disease Outbreak News
 * - CDC Health Alerts
 * - Times of India Health RSS
 * 
 * Dependencies: npm install rss-parser node-fetch node-geocoder
 */

const Parser = require('rss-parser');
const fetch = require('node-fetch');
const NodeGeocoder = require('node-geocoder');

const parser = new Parser();
const geocoder = NodeGeocoder({
    provider: 'openstreetmap'
});

// Disease keywords for pattern matching
const DISEASE_PATTERNS = {
    dengue: /dengue/i,
    malaria: /malaria/i,
    typhoid: /typhoid/i,
    cholera: /cholera/i,
    covid: /covid|coronavirus|sars-cov-2/i,
    influenza: /influenza|flu/i,
    tuberculosis: /tuberculosis|tb\b/i,
    measles: /measles/i,
    chickenpox: /chickenpox|varicella/i,
    hepatitis: /hepatitis/i,
    zika: /zika/i,
    ebola: /ebola/i,
    chikungunya: /chikungunya/i,
};

// RSS Feed URLs
const FEED_URLS = {
    googleNews: 'https://news.google.com/rss/search?q=disease+outbreak+India&hl=en-IN&gl=IN&ceid=IN:en',
    who: 'https://www.who.int/feeds/entity/csr/don/en/rss.xml',
    cdc: 'https://tools.cdc.gov/api/v2/resources/media/132608.rss',
    timesOfIndia: 'https://timesofindia.indiatimes.com/rssfeeds/2886704.cms',
};

/**
 * Extract disease name from title/content
 */
function extractDisease(text) {
    for (const [disease, pattern] of Object.entries(DISEASE_PATTERNS)) {
        if (pattern.test(text)) {
            return disease.charAt(0).toUpperCase() + disease.slice(1);
        }
    }
    return 'Unknown';
}

/**
 * Extract case count from text
 */
function extractCases(text) {
    const patterns = [
        /(\d+)\s*(?:confirmed\s*)?cases?/i,
        /cases?:\s*(\d+)/i,
        /(\d+)\s*people?\s*(?:infected|affected)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return parseInt(match[1]);
    }
    return 0;
}

/**
 * Extract location from text
 */
function extractLocation(text) {
    // Indian states and cities
    const locations = [
        'Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad',
        'Pune', 'Ahmedabad', 'Sikkim', 'Odisha', 'Kerala', 'Tamil Nadu',
        'Karnataka', 'Maharashtra', 'West Bengal', 'Gujarat', 'Rajasthan',
        'Uttar Pradesh', 'Bihar', 'Chhattisgarh', 'Assam', 'Punjab'
    ];

    for (const location of locations) {
        if (new RegExp(location, 'i').test(text)) {
            return location;
        }
    }
    return 'India';
}

/**
 * Calculate days ago from date
 */
function getDaysAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Geocode location to get lat/lng
 */
async function getCoordinates(location) {
    try {
        const results = await geocoder.geocode(`${location}, India`);
        if (results && results.length > 0) {
            return {
                lat: results[0].latitude,
                lng: results[0].longitude
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }

    // Default to India center
    return { lat: 20.5937, lng: 78.9629 };
}

/**
 * Parse a single RSS feed
 */
async function parseFeed(url, sourceName) {
    try {
        const feed = await parser.parseURL(url);
        const alerts = [];

        for (const item of feed.items.slice(0, 10)) { // Limit to recent 10
            const fullText = `${item.title} ${item.contentSnippet || ''}`;

            const disease = extractDisease(fullText);
            if (disease === 'Unknown') continue; // Skip non-disease news

            const location = extractLocation(fullText);
            const cases = extractCases(fullText);
            const daysAgo = getDaysAgo(item.pubDate || item.isoDate);
            const coords = await getCoordinates(location);

            alerts.push({
                title: item.title,
                disease,
                cases,
                source: sourceName,
                location,
                lat: coords.lat,
                lng: coords.lng,
                daysAgo,
                link: item.link,
                pubDate: item.pubDate || item.isoDate
            });
        }

        return alerts;
    } catch (error) {
        console.error(`Error parsing ${sourceName}:`, error.message);
        return [];
    }
}

/**
 * Fetch all disease alerts from multiple sources
 */
async function fetchAllDiseaseAlerts() {
    console.log('🔍 Fetching disease alerts from multiple sources...');

    const results = await Promise.allSettled([
        parseFeed(FEED_URLS.googleNews, 'Google News'),
        parseFeed(FEED_URLS.who, 'WHO'),
        parseFeed(FEED_URLS.cdc, 'CDC'),
        parseFeed(FEED_URLS.timesOfIndia, 'Times of India'),
    ]);

    const allAlerts = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

    // Sort by recency
    allAlerts.sort((a, b) => a.daysAgo - b.daysAgo);

    console.log(`✅ Fetched ${allAlerts.length} disease alerts`);
    return allAlerts;
}

/**
 * Express API Endpoint
 */
const express = require('express');
const router = express.Router();

// Cache for 1 minute
let cache = { data: [], timestamp: 0 };
const CACHE_DURATION = 60 * 1000; // 1 minute

router.get('/api/disease-alerts', async (req, res) => {
    const now = Date.now();

    // Return cached data if valid
    if (cache.data.length > 0 && (now - cache.timestamp) < CACHE_DURATION) {
        return res.json({ alerts: cache.data, cached: true });
    }

    // Fetch fresh data
    const alerts = await fetchAllDiseaseAlerts();
    cache = { data: alerts, timestamp: now };

    res.json({ alerts, cached: false });
});

module.exports = router;

// For testing independently
if (require.main === module) {
    (async () => {
        const alerts = await fetchAllDiseaseAlerts();
        console.log(JSON.stringify(alerts.slice(0, 5), null, 2));
    })();
}

/* updated */
