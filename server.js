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

// Redeploy contracts endpoint
app.post('/api/redeploy', async (req, res) => {
    try {
        console.log('Triggering contract redeploy...');
        
        const { spawn } = require('child_process');
        
        // Trigger the Clean Deploy workflow
        const deployment = spawn('npx', ['hardhat', 'run', 'scripts/deploy-clean.ts', '--network', 'localhost'], {
            cwd: __dirname,
            detached: false
        });
        
        let deployOutput = '';
        let deployError = '';
        
        deployment.stdout.on('data', (data) => {
            deployOutput += data.toString();
            console.log('Deploy output:', data.toString());
        });
        
        deployment.stderr.on('data', (data) => {
            deployError += data.toString();
            console.error('Deploy error:', data.toString());
        });
        
        deployment.on('close', (code) => {
            if (code === 0) {
                console.log('Deployment completed successfully');
            } else {
                console.error(`Deployment failed with exit code ${code}`);
            }
        });
        
        // Don't wait for completion, just acknowledge the trigger
        res.json({ 
            success: true, 
            message: 'Contract redeploy triggered successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Redeploy trigger error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to trigger redeploy', 
            details: error.message 
        });
    }
});

// Serve contract addresses if available
app.get('/contract-addresses.json', (req, res) => {
    const fs = require('fs');
    const addressFile = path.join(__dirname, 'contract-addresses.json');
    
    if (fs.existsSync(addressFile)) {
        res.sendFile(addressFile);
    } else {
        res.status(404).json({ error: 'Contract addresses not found. Please deploy contracts first.' });
    }
});

// Serve static files from the root directory
app.use(express.static('.'));
app.use('/artifacts', express.static('artifacts'));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Agricultural Asset Tokenization Platform running at http://0.0.0.0:${port}`);
    console.log(`Blockchain proxy available at http://0.0.0.0:${port}/blockchain`);
});