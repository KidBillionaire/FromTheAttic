require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

// Initialize Express app
const app = express();

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// API endpoint for gallery
app.get('/api/gallery', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM gallery_items 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching gallery items:', err);
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
});

// Create a new gallery item
app.post('/api/gallery', async (req, res) => {
  const { title, description, image_url } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO gallery_items (title, description, image_url) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, description, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating gallery item:', err);
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to PostgreSQL database');
  release();
});

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 