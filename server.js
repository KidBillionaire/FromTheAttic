require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());

// Load SSL certificate
const sslCert = fs.readFileSync(path.join(__dirname, 'isrg-root-x1.pem'));

// Supabase client setup with proper SSL configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to fetch gallery items
app.get('/api/gallery', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching gallery items:', err);
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
});

// API endpoint to add gallery items
app.post('/api/gallery', async (req, res) => {
  const { title, description, image_url } = req.body;
  
  if (!title || !description || !image_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .insert([{ title, description, image_url }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating gallery item:', err);
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('gallery_items').select('count');
    if (error) throw error;
    res.status(200).json({ status: 'OK' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
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