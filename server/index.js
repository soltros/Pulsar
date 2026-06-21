import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { injectTags } from './tags.js';

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

  try {
    const stmt = db.prepare('SELECT * FROM artists WHERE id = ?');
    const row = stmt.get(id);

    if (row && Date.now() - row.lastUpdated < 7 * 24 * 60 * 60 * 1000) {
      return res.json(row);
    }

    // Need to fetch from Last.fm
    if (!LASTFM_API_KEY) return res.json(row || {}); // Return what we have if no API key

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
    console.error('Error fetching artist metadata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/metadata/album', async (req, res) => {
  const { name, artist, id } = req.query;
  if (!name || !id) return res.status(400).json({ error: 'Missing name or id' });

  try {
    const stmt = db.prepare('SELECT * FROM albums WHERE id = ?');
    const row = stmt.get(id);

    if (row && Date.now() - row.lastUpdated < 7 * 24 * 60 * 60 * 1000) {
      return res.json(row);
    }

    if (!LASTFM_API_KEY) return res.json(row || {});

    const url = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(artist || '')}&album=${encodeURIComponent(name)}&api_key=${LASTFM_API_KEY}&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.album) {
      const img = data.album.image?.find(i => i.size === 'extralarge' || i.size === 'mega')?.['#text'] || null;
      let desc = data.album.wiki?.content || '';
      desc = desc.replace(/<a href="https:\/\/www\.last\.fm.*$/s, '').trim();

      const newRow = {
        id,
        name,
        artist,
        description: desc,
        lastFmArtUrl: img,
        lastUpdated: Date.now()
      };

      const insert = db.prepare('INSERT OR REPLACE INTO albums (id, name, artist, description, lastFmArtUrl, lastUpdated) VALUES (?, ?, ?, ?, ?, ?)');
      insert.run(newRow.id, newRow.name, newRow.artist, newRow.description, newRow.lastFmArtUrl, newRow.lastUpdated);

      return res.json(newRow);
    }
    return res.json(row || {});
  } catch (error) {
    console.error('Error fetching album metadata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/metadata/track', async (req, res) => {
  const { title, artist, id } = req.query;
  if (!title || !id) return res.status(400).json({ error: 'Missing title or id' });

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
    console.error('Track metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch track metadata' });
  }
});

app.post('/api/tags/inject', async (req, res) => {
  const { filePath, mountPath, tags, artUrl, enableWrite } = req.body;
  if (!enableWrite) {
    return res.status(403).json({ error: 'Filesystem write access is disabled in admin settings.' });
  }
  if (!filePath || !mountPath || !tags) {
    return res.status(400).json({ error: 'Missing parameters for tag injection.' });
  }

  try {
    // Construct absolute path safely
    // The filePath comes from Subsonic API usually as something like 'Music/Artist/Album/Song.mp3'
    // The mountPath is the user's admin configuration like '/app/media/music'
    // Prevent directory traversal
    const safeFilePath = path.normalize(filePath).replace(/^(\.\.[/\\\\])+/, '');
    const absolutePath = path.join(mountPath, safeFilePath);

    if (!absolutePath.startsWith(mountPath)) {
      return res.status(403).json({ error: 'Invalid path resolution.' });
    }

    await injectTags(absolutePath, tags, artUrl);
    res.json({ success: true, message: 'Tags written successfully.' });
  } catch (err) {
    console.error('Tag injection error:', err);
    res.status(500).json({ error: err.message || 'Failed to inject tags' });
  }
});

app.post('/api/metadata/refresh', (req, res) => {
  // Clear the database or force a refresh. For now, let's just delete all rows.
  try {
    db.exec('DELETE FROM artists; DELETE FROM albums; DELETE FROM tracks;');
    res.json({ success: true, message: 'Metadata cache cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.get('/api/metadata/all', (req, res) => {
  try {
    const artists = db.prepare('SELECT * FROM artists').all();
    const albums = db.prepare('SELECT * FROM albums').all();
    const tracks = db.prepare('SELECT * FROM tracks').all();
    res.json({ artists, albums, tracks });
  } catch (error) {
    console.error('Error fetching all metadata:', error);
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
