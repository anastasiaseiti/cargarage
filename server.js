require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const Stripe = require('stripe');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT) || 3000;
const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');
const gamePath = '/anastasia-seiti';
const skins = {
  'prism-shift': { name: 'Prism Shift', description: 'Chroma double-stripe car skin' },
  abyssal: { name: 'Abyssal', description: 'Deep-sea circuit car skin' },
  'solar-flare': { name: 'Solar Flare', description: 'Ion slash-mark car skin' }
};
const checkoutLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
let stripe;

app.use(express.json({ limit: '10kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, paymentsConfigured: Boolean(process.env.STRIPE_SECRET_KEY) }));
app.get('/', (_req, res) => res.redirect(302, gamePath));
app.get(gamePath, (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/create-checkout-session', checkoutLimiter, async (req, res) => {
  const skin = skins[req.body?.skinId];
  if (!skin) return res.status(400).json({ error: 'Choose a valid skin.' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Store checkout is not configured yet.' });

  try {
    stripe ||= new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: 499,
          product_data: { name: skin.name, description: skin.description }
        },
        quantity: 1
      }],
      metadata: { skinId: req.body.skinId },
      success_url: `${baseUrl}${gamePath}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${gamePath}?purchase=cancelled`
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error.message);
    res.status(502).json({ error: 'Checkout could not be started. Please try again.' });
  }
});

app.get('/api/verify-session', checkoutLimiter, async (req, res) => {
  const sessionId = req.query.session_id;
  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'A valid checkout session is required.' });
  }
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Payment verification is not configured yet.' });

  try {
    stripe ||= new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const skinId = session.metadata?.skinId;
    if (session.mode !== 'payment' || session.payment_status !== 'paid' || !skins[skinId]) {
      return res.status(402).json({ error: 'Payment has not been completed.' });
    }
    res.json({ skinId });
  } catch (error) {
    console.error('Stripe checkout verification failed:', error.message);
    res.status(502).json({ error: 'Payment verification is temporarily unavailable.' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Apex Night Run listening on port ${port}`);
  if (!process.env.STRIPE_SECRET_KEY) console.log('Set STRIPE_SECRET_KEY to enable skin purchases.');
});
