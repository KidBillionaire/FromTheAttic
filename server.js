require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.json());

// Serve index.html from public directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fonts', 'index.html'));
});

// Stripe checkout endpoint
app.post('/create-checkout-session', async (req, res) => {
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
            success_url: 'http://localhost:3000/success.html',
            cancel_url: 'http://localhost:3000/cancel.html',
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
