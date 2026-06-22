import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 3001);
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

// Use /app/data for docker volume if in production, else local ./data
const DB_PATH = process.env.NODE_ENV === 'production' ? '/app/data/pulsar.db' : path.join(__dirname, '..', 'data', 'pulsar.db');

import fs from 'fs';
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    lastFmArtUrl TEXT,
    lastUpdated INTEGER
  );
  
  CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    artist TEXT,
    description TEXT,
    lastFmArtUrl TEXT,
    lastUpdated INTEGER
  );
  
  CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    lastFmArtUrl TEXT,
    lastUpdated INTEGER
  );
`);

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/metadata/artist', async (req, res) => {
  const { name, id } = req.query;
  if (!name || !id) return res.status(400).json({ error: 'Missing name or id' });
  
  console.log(`[Metadata] 🔍 Artist request: ${name} (ID: ${id})`);

  try {
    const stmt = db.prepare('SELECT * FROM artists WHERE id = ?');
    const row = stmt.get(id);

    if (row && Date.now() - row.lastUpdated < 7 * 24 * 60 * 60 * 1000) {
      return res.json(row);
    }

    // Need to fetch from Last.fm
    if (!LASTFM_API_KEY) return res.json(row || {}); // Return what we have if no API key

    console.log(`[Last.fm] 🌐 Fetching missing artist data for: ${name}`);
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(name)}&api_key=${LASTFM_API_KEY}&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.artist) {
      let bio = data.artist.bio?.content || '';
      // Clean up Last.fm link at the end of bio
      bio = bio.replace(/<a href="https:\/\/www\.last\.fm.*$/s, '').trim();

      const newRow = {
        id,
        name,
        bio,
        lastFmArtUrl: null, // Last.fm artist art is often empty or star now, but we can store it if we had a way
        lastUpdated: Date.now()
      };

      const insert = db.prepare('INSERT OR REPLACE INTO artists (id, name, bio, lastFmArtUrl, lastUpdated) VALUES (?, ?, ?, ?, ?)');
      insert.run(newRow.id, newRow.name, newRow.bio, newRow.lastFmArtUrl, newRow.lastUpdated);

      return res.json(newRow);
    }
    
    return res.json(row || {});
  } catch (error) {
    console.error(`[Metadata Error] ❌ Failed to fetch artist metadata for ${name || id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/metadata/track', async (req, res) => {
  const { title, artist, id } = req.query;
  if (!title || !id) return res.status(400).json({ error: 'Missing title or id' });

  console.log(`[Metadata] 🎵 Track request: ${title} by ${artist || 'Unknown'} (ID: ${id})`);

  try {
    const stmt = db.prepare('SELECT * FROM tracks WHERE id = ?');
    const row = stmt.get(id);

    if (row && Date.now() - row.lastUpdated < 7 * 24 * 60 * 60 * 1000) {
      return res.json(row);
    }

    if (!LASTFM_API_KEY) return res.json(row || {});

    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getinfo&artist=${encodeURIComponent(artist || '')}&track=${encodeURIComponent(title)}&api_key=${LASTFM_API_KEY}&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.track) {
      const img = data.track.album?.image?.find(i => i.size === 'extralarge' || i.size === 'mega')?.['#text'] || null;

      const newRow = {
        id,
        title,
        artist,
        lastFmArtUrl: img,
        lastUpdated: Date.now()
      };

      const insert = db.prepare('INSERT OR REPLACE INTO tracks (id, title, artist, lastFmArtUrl, lastUpdated) VALUES (?, ?, ?, ?, ?)');
      insert.run(newRow.id, newRow.title, newRow.artist, newRow.lastFmArtUrl, newRow.lastUpdated);

      return res.json(newRow);
    }
    return res.json(row || {});
  } catch (error) {
    console.error(`[Metadata Error] ❌ Failed to fetch track metadata for ${title || id}:`, error);
    res.status(500).json({ error: 'Failed to fetch track metadata' });
  }
});



app.post('/api/metadata/refresh', (req, res) => {
  // Clear the database or force a refresh. For now, let's just delete all rows.
  try {
    db.exec('DELETE FROM artists; DELETE FROM albums; DELETE FROM tracks;');
    res.json({ success: true, message: 'Metadata cache cleared successfully' });
  } catch (err) {
    console.error(`[Database Error] ❌ Failed to clear cache:`, err);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.get('/api/metadata/all', (req, res) => {
  console.log(`[Database] 📦 Dumping full metadata cache to client`);
  try {
    const artists = db.prepare('SELECT * FROM artists').all();
    const albums = db.prepare('SELECT * FROM albums').all();
    const tracks = db.prepare('SELECT * FROM tracks').all();
    res.json({ artists, albums, tracks });
  } catch (error) {
    console.error(`[Database Error] ❌ Failed to fetch all metadata cache:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Pulsar Server running on port ${PORT}`);
});
