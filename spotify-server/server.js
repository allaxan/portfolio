require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 8888;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/spotify/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('Warning: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set in env. OAuth will not work until configured.');
}

// In-memory store (demo only)
const store = {};

app.get('/spotify/login', (req, res) => {
  const state = uuidv4();
  const scopes = [
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scopes,
    redirect_uri: REDIRECT_URI,
    state
  });

  // store state
  store[state] = { created: Date.now() };
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

app.get('/spotify/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (!code) return res.status(400).send('Missing code');

  // exchange code for tokens
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error('Token exchange failed', txt);
      return res.status(500).send('Token exchange failed');
    }

    const tokens = await tokenRes.json();
    const sid = uuidv4();
    store[sid] = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000)
    };

    // set cookie with session id (not httpOnly for demo convenience)
    res.cookie('spotify_sid', sid, { maxAge: 1000 * 60 * 60 * 24 });
    // redirect back to portfolio root
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal error');
  }
});

app.get('/spotify/token', (req, res) => {
  const sid = req.cookies.spotify_sid;
  if (!sid || !store[sid]) return res.status(401).json({ error: 'not_authenticated' });
  const data = store[sid];
  // refresh if expired
  if (Date.now() > data.expires_at - 60000) {
    return res.status(401).json({ error: 'expired' });
  }
  res.json({ access_token: data.access_token, expires_at: data.expires_at });
});

app.post('/spotify/refresh', async (req, res) => {
  const sid = req.cookies.spotify_sid;
  if (!sid || !store[sid]) return res.status(401).json({ error: 'not_authenticated' });
  const data = store[sid];
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', data.refresh_token);

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const tokens = await tokenRes.json();
    data.access_token = tokens.access_token;
    if (tokens.refresh_token) data.refresh_token = tokens.refresh_token;
    data.expires_at = Date.now() + (tokens.expires_in * 1000);
    res.json({ access_token: data.access_token, expires_at: data.expires_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'refresh_failed' });
  }
});

app.listen(PORT, () => console.log(`Spotify helper server running on http://localhost:${PORT}`));
