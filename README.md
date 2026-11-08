# cargarage
The best game for car lovers.

## Run the website

```sh
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000/anastasia-seiti`. The root address redirects there. Keyboard and touch controls are supported.

## Publish the game with GitHub Pages

GitHub Pages is configured to publish the root of the `main` branch at `https://anastasiaseiti.github.io/cargarage/`. Push `index.html` to `main` and wait for the Pages deployment to finish.

GitHub Pages hosts the game only; it cannot run the Node.js server, so skin checkout is unavailable there. Use the local server above or deploy `server.js` to a Node.js host for Stripe checkout.

## Skin purchases

The three aftermarket skins cost USD $4.99 each. Purchases use Stripe-hosted Checkout; the server sets the price and verifies the paid Checkout Session before unlocking a skin in that browser. To test checkout, add a Stripe test secret key to `.env` as `STRIPE_SECRET_KEY`. Never commit `.env` or paste secret keys into chat.

For live sales, complete Stripe account verification, connect your bank account privately in the Stripe dashboard, use a live secret key, and deploy this server over HTTPS with `BASE_URL` set to its public URL. Stripe pays out to the connected bank according to its payout schedule and fees; bank availability depends on your country and Stripe account. The game currently stores cosmetic ownership in browser storage, so purchases do not sync across devices or accounts.
