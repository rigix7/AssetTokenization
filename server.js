const express = require('express');
const path = require('path');

const app = express();
const port = 5000;

// Serve static files from the root directory
app.use(express.static('.'));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Agricultural Asset Tokenization Platform running at http://0.0.0.0:${port}`);
});