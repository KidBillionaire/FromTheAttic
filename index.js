require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Hello, Node.js!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 