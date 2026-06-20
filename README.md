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
- **Last.fm Artwork Abstraction:** Bypasses standard Navidrome cover art endpoints to extract and stream high-quality assets strictly from the Last.fm REST API.

## Development Setup

Requirements: Node.js 22+ 

```bash
# Clone the repository
git clone https://github.com/your-username/Pulsar.git
cd Pulsar

# Install dependencies
npm install

# Start the local development server
npm run dev
```

## Deployment

Pulsar is designed for containerized deployment, ensuring proxy-agnostic topologies and environmental consistency. The included `docker-compose.yml` mounts both a Navidrome backend (port 4533) and the Pulsar PWA (port 8080).

```bash
# Build and run the entire stack locally
docker compose up -d --build
```

### Proxy Integration

By default, the services bind to the host's ports. If placing the stack behind an external reverse proxy (like Nginx Proxy Manager, Traefik, or Caddy), map your upstream configurations directly to the host IP and the exposed ports (8080 for the UI, 4533 for the API).
