require ('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const customer = require('./models/Customer');

const app = express();
app.use(bodyParser.json());

const{
    PORT = 3000,
    CLOVER_CLIENT_ID,
    CLOVER_CLIENT_SECRET,
    CLOVER_REDIRECT_URI,
    CLOVER_ENV='sandbox',
    MAILCHIMP_API_KEY,
    MAILCHIMP_SERVER_PREFIX,
    MAILCHIMP_AUDIENCE_ID,
    MONGO_URI,
    CLOVER_WEBHOOK_SECRET
}= process.env;

const CLOVER_BASE = CLOVER_ENV ==='production' ? 'https://api.clover.com' : 'https://sandbox.dev.clover.com';

mongoose.connect(MONGO_URI, {  useNewUrlParser: true, useUnifiedTopology: true}).
then(() => console.log('mongo connected'))
.catch(err => {console.error('mongo not connectedd:', err); process.exit(1);}); 

app.get('/', (req, res) => res.send('Clover ⇢ Mailchimp bridge running'));

// Redirect merchant to Clover to install/authorize the app
app.get('/auth/clover', (req, res) => {
  const scopes = encodeURIComponent('MERCHANT_READ CUSTOMERS_READ');
  const url = `https://www.clover.com/oauth/authorize?client_id=${CLOVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(CLOVER_REDIRECT_URI)}&scope=${scopes}&response_type=code`;
  res.redirect(url);
});


// OAuth callback: exchange code for tokens
app.get('/auth/clover/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code from Clover');
  try {
    const tokenUrl = `${CLOVER_BASE}/oauth/token`;
    const payload = new URLSearchParams({
      client_id: CLOVER_CLIENT_ID,
      client_secret: CLOVER_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: CLOVER_REDIRECT_URI
    });


      const tokenRes = await axios.post(tokenUrl, payload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // tokenRes.data contains access_token, refresh_token, merchant id, etc.
    // TODO: save tokens in DB per merchant in a real app.
    return res.json(tokenRes.data);
  } catch (err) {
    console.error('OAuth token error', err.response?.data || err.message);
    return res.status(500).send('Token exchange failed');
  }
});


function verifyCloverSignature(req) {
  if (!CLOVER_WEBHOOK_SECRET) return true;
  const signature = req.headers['x-clover-signature'] || req.headers['x-clover-signature-sha256'];
  if (!signature) return false;
  // Proper verification depends on how Clover signs webhooks.
  return true;
}

app.post('/webhook/clover', async (req, res) => {
  try {
    if (!verifyCloverSignature(req)) return res.status(403).send('Invalid signature');

    const event = req.body;
    const cloverCustomer = event.object || event.data || event;
    if (!cloverCustomer || !cloverCustomer.id) {
      console.log('Webhook: no customer object', event);
      return res.sendStatus(200);
    }

    const cloverId = cloverCustomer.id;
    const firstName = cloverCustomer.firstName || cloverCustomer.givenName || '';
    const lastName = cloverCustomer.lastName || cloverCustomer.familyName || '';
    const email = cloverCustomer.email || null;

    let phone = null;
    if (cloverCustomer.phones && cloverCustomer.phones.length) {
      phone = cloverCustomer.phones[0].number;
    } else if (cloverCustomer.phone) {
      phone = cloverCustomer.phone;
    }

    const smsOptIn = !!cloverCustomer.smsOptIn || false;

    const updated = await Customer.findOneAndUpdate(
      { cloverId },
      { cloverId, firstName, lastName, email, phone, smsOptIn, raw: cloverCustomer },
      { upsert: true, new: true }
    );

    if (smsOptIn && phone) {
      try {
        await syncContactToMailchimp(updated);
        updated.lastSyncedToMailchimp = new Date();
        await updated.save();
      } catch (mErr) {
        console.error('Mailchimp sync failed', mErr.response?.data || mErr.message);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handler error', err);
    res.status(500).send('Server error');
  }
});

async function syncContactToMailchimp(customer) {
  const base = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;
  const listId = MAILCHIMP_AUDIENCE_ID;

  const email = customer.email || `${(customer.phone || 'unknown').replace(/\D/g,'')}@phoneonly.local`;
  const md5 = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

  const payload = {
    email_address: email,
    status_if_new: 'subscribed',
    status: 'subscribed',
    merge_fields: {
      PHONE: customer.phone || ''
    }
  };

  const url = `${base}/lists/${listId}/members/${md5}`;
  const auth = { username: 'anystring', password: MAILCHIMP_API_KEY };

  const r = await axios.put(url, payload, { auth });
  return r.data;
}

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));