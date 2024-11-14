require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
