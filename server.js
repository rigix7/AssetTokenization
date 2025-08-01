const express = require('express');
const path = require('path');

const app = express();
const port = 5000;

// Parse JSON bodies FIRST
app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Proxy blockchain requests to avoid CORS issues
app.post('/blockchain', async (req, res) => {
    try {
        console.log('Proxying blockchain request:', req.body);
        
        const response = await fetch('http://localhost:8545', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        console.log('Blockchain response:', data);
        res.json(data);
    } catch (error) {
        console.error('Blockchain proxy error:', error);
        res.status(500).json({ error: 'Blockchain connection failed', details: error.message });
    }
});

// Serve static files from the root directory
app.use(express.static('.'));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Agricultural Asset Tokenization Platform running at http://0.0.0.0:${port}`);
    console.log(`Blockchain proxy available at http://0.0.0.0:${port}/blockchain`);
});