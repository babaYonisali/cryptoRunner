const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dino";
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

const scoreSchema = new mongoose.Schema({
    address: String,
    score: Number,
    timestamp: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// Routes
app.post('/api/scores', async (req, res) => {
    try {
        const { address, score } = req.body;
        const newScore = new Score({
            address,
            score: Math.floor(score)
        });
        await newScore.save();
        res.status(201).json(newScore);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/scores', async (req, res) => {
    try {
        const scores = await Score.find()
            .sort({ score: -1 })
            .limit(10);
        res.json(scores);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/verify-signature', async (req, res) => {
    try {
        const { message, signature, address } = req.body;
        // Verify the signature using ethers.js
        const signerAddr = ethers.verifyMessage(message, signature);
        // Check if the recovered address matches the provided address
        const isValid = signerAddr.toLowerCase() === address.toLowerCase();
        res.json({ verified: isValid });
    }
    catch (error) {
        console.error('Signature verification error:', error);
        res.status(400).json({ verified: false, error: 'Invalid signature' });
    }
});

// Update the catch-all route to serve index.html from public directory
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
