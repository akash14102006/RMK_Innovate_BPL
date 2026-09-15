const express = require('express');
const axios = require('axios');
const router = express.Router();

const CITIES = ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'pune', 'hyderabad', 'ahmedabad'];

router.get('/models', async (req, res) => {
    try {
        const response = await fetch('http://127.0.0.1:11434/api/tags');
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const models = data.models.map(m => m.name);
        res.json({ models });
    } catch (error) {
        console.error('[Ollama API Error]:', error);
        res.status(500).json({ error: 'Failed to fetch models from local offline model', details: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { message, model } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        let liveContext = '';
        const lowerMsg = message.toLowerCase();

        // Check if the user is asking about pollution/AQI
        if (lowerMsg.includes('pollution') || lowerMsg.includes('aqi') || lowerMsg.includes('air quality')) {
            // Check for city match
            for (const city of CITIES) {
                if (lowerMsg.includes(city)) {
                    try {
                        const waqiRes = await axios.get(`https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_KEY || 'demo'}`);
                        if (waqiRes.data && waqiRes.data.status === 'ok') {
                            const aqi = waqiRes.data.data.aqi;
                            const dominant = waqiRes.data.data.dominentpol;
                            liveContext += `\n[LIVE DATA INJECTED: The current real-time AQI in ${city} is ${aqi}. The dominant pollutant is ${dominant}. Please use this real live data to answer the user explicitly.]\n`;
                        }
                    } catch (err) {
                        console.error('Quietly failed to get live WAQI data:', err.message);
                    }
                    break;
                }
            }
        }

        const prompt = `System: You are Bharat PulseLink Assistant, an intelligent healthcare prediction assistant. Answer the following user query concisely and clearly. ${liveContext}

User: ${message}

Assistant:`;

        const targetModel = model || 'gpt-oss-safeguard';

        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: targetModel,
                prompt: prompt,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Read and forward the streamed response
        for await (const chunk of response.body) {
            const decoded = Buffer.from(chunk).toString('utf8');
            const lines = decoded.split('\n').filter(Boolean);
            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.response) {
                        res.write(parsed.response);
                    }
                } catch (e) {
                    // ignore JSON parse errors for incomplete chunks
                }
            }
        }
        res.end();

    } catch (error) {
        console.error('[Ollama Chat Server Error]:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to connect to local offline model', details: error.message });
        } else {
            res.end();
        }
    }
});

module.exports = router;
