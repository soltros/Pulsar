# Pulsar

Pulsar is a mobile-first, cross-platform Progressive Web Application (PWA) client tailored explicitly for Navidrome and OpenSubsonic backends. 

It aims to bridge desktop environments and mobile experiences from a single codebase while providing an advanced feature set including multi-queue tracking, offline-first execution, declarative smart filtering, and isolated Last.fm metadata abstraction.

## Tech Stack

- **Frontend Framework:** React (bootstrapped with Vite)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Local Database / Sync:** Dexie.js (IndexedDB)
- **Desktop Wrapper (Planned):** Tauri (Rust)
- **Deployment:** Nginx Alpine (Docker)

## Features

- **Advanced Multi-Queue Tracking Engine:** Retains multiple independent queue contexts (e.g., switching between an audiobook and a music playlist) maintaining exact progress offsets and state matrices locally.
- **Smart Filtering Engine:** Evaluates declarative criteria locally against IndexedDB, executing complex relational searches without slamming the backend server.
- **Offline-First Caching Architecture:** Stores target streams natively via Service Worker `CacheStorage` mechanisms based on background cellular vs. Wi-Fi network lifecycles.
- **Native Metadata Integration:** Fully leverages OpenSubsonic API endpoints for native album metadata alongside a zero-auth MusicBrainz integration for dynamic, chronologically accurate artist news and releases.

## Development Setup

Requirements: Node.js 22+ 

```bash
# Clone the repository
git clone https://github.com/soltros/Pulsar.git
cd Pulsar

# Install dependencies
npm install

# Start the local development server
npm run dev
```

## Deployment

Pulsar uses a streamlined, containerized deployment using pre-built images from the GitHub Container Registry (GHCR) so you never have to compile code on your host machine.

1. **Configure Environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to configure your specific settings (e.g., `PULSAR_PORT`, `MUSIC_DIR`).*

2. **Start the container stack:**
   ```bash
   docker-compose up -d
   ```

By default, the UI service binds to the host's port `80`. You can easily change this via `PULSAR_PORT` in your `.env` file. If placing the application behind an external reverse proxy (like Nginx Proxy Manager, Traefik, or Caddy), map your upstream configurations directly to the host IP and your configured port.

### Updating Pulsar

To update to the latest version of Pulsar, simply run the included update script:

```bash
./update.sh
```

This script will gracefully pull the latest git configurations, seamlessly pull the latest pre-compiled image from GHCR, and restart your containers in the background without any git conflicts.
