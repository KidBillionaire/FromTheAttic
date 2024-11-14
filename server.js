require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const session = require('express-session');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Initialize Stripe if the key exists
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Add this near the top
const DOMAIN = process.env.NODE_ENV === 'production' 
    ? 'https://fromtheattic.vercel.app'
    : 'http://localhost:3000';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/products')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Add this before your routes
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Example login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Validate user credentials (this is just a placeholder)
    if (username === 'admin' && password === 'password') {
        req.session.user = { username };
        return res.redirect('/admin.html');
    }
    res.status(401).send('Unauthorized');
});

// Middleware to protect admin routes
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login.html'); // Redirect to login page
}

// Protect the admin route
app.get('/admin.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Handle root and index requests
app.get(['/', '/index.html', '/Index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle about page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Stripe checkout endpoint (only if Stripe is initialized)
app.post('/create-checkout-session', async (req, res) => {
    if (!stripe) {
        return res.status(500).send('Stripe is not configured');
    }

    const { cartItems } = req.body;

    try {
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    images: item.images,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${DOMAIN}/success.html`,
            cancel_url: `${DOMAIN}/cancel.html`,
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).send('Error creating checkout session');
    }
});

// Route to handle product uploads
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description } = req.body;
        const imageUrl = `/images/products/${req.file.filename}`;
        
        // Read existing products
        let products = [];
        try {
            const data = await fs.readFile('products.json', 'utf8');
            products = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet, that's ok
        }
        
        // Add new product
        const newProduct = {
            id: Date.now().toString(),
            name,
            price: parseFloat(price),
            description,
            imageUrl
        };
        
        products.push(newProduct);
        
        // Save updated products
        await fs.writeFile('products.json', JSON.stringify(products, null, 2));
        
        res.json(newProduct);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send('Error adding product');
    }
});

// Route to get all products
app.get('/api/products', async (req, res) => {
    try {
        const data = await fs.readFile('products.json', 'utf8');
        const products = JSON.parse(data);
        res.json(products);
    } catch (error) {
        res.json([]);
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const data = await fs.readFile('products.json', 'utf8');
        let products = JSON.parse(data);
        
        const product = products.find(p => p.id === req.params.id);
        if (product) {
            // Delete the image file
            try {
                await fs.unlink(path.join(__dirname, 'public', product.imageUrl));
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }
        
        products = products.filter(p => p.id !== req.params.id);
        await fs.writeFile('products.json', JSON.stringify(products, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Error deleting product');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
