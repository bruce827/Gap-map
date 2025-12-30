const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

// Load env vars from root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Database Connection
const dbPath = path.resolve(__dirname, '../data/gapmap.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database:', dbPath);
    }
});

// Serve static files
app.use(express.static(__dirname));

// API Endpoint to get AMap Config
app.get('/api/config', (req, res) => {
    res.json({
        amapKey: process.env.AMAP_KEY || '',
        amapSecurityCode: process.env.AMAP_SECURITY_CODE || process.env.AMAP_SECRET || ''
    });
});

// API Endpoint to get cities data
app.get('/api/cities', (req, res) => {
    const query = `SELECT * FROM v_tangping_cities`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
            return;
        }

        // Map Chinese columns to English JSON keys
        const cities = rows.map(row => ({
            name: row['城市'],
            province: row['省份'],
            rank: row['排名'],
            lat: Number.isFinite(Number(row['纬度'])) ? Number(row['纬度']) : null,
            lng: Number.isFinite(Number(row['经度'])) ? Number(row['经度']) : null,
            district: row['区县'],
            price: row['二手房价格_元'] ?? row['套房价格_元'] ?? null,
            comfort_days: row['舒适天数'],
            green_rate: row['绿化覆盖率'],
            raw: row // Include full raw data for details view
        }));

        res.json(cities);
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`To access from other devices, use http://<YOUR_IP_ADDRESS>:${PORT}`);
    console.log(`Example: http://192.168.100.65:${PORT}`);
});
