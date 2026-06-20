import Dexie from 'dexie';

export const db = new Dexie('PulsarDatabase');

// Define the database schema
// We index fields we will frequently query against locally
db.version(1).stores({
  albums: 'id, name, artist, year, genre, created, playCount',
  artists: 'id, name',
  songs: 'id, albumId, artistId, title, duration',
});
