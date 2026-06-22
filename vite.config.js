import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

const configWriterPlugin = () => ({
  name: 'config-writer',
  configureServer(server) {
    server.middlewares.use('/api/config', (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.VITE_LASTFM_API_KEY) {
              const envPath = path.resolve(process.cwd(), '.env');
              let envContent = '';
              if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf-8');
              }
              
              // Replace or append
              if (envContent.includes('VITE_LASTFM_API_KEY=')) {
                envContent = envContent.replace(/VITE_LASTFM_API_KEY=.*/g, `VITE_LASTFM_API_KEY=${data.VITE_LASTFM_API_KEY}`);
              } else {
                envContent += `\nVITE_LASTFM_API_KEY=${data.VITE_LASTFM_API_KEY}\n`;
              }
              
              fs.writeFileSync(envPath, envContent.trim() + '\n');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
              return;
            }
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        });
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api/metadata': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/api/tags': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(), 
    tailwindcss(), 
    configWriterPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            urlPattern: /.*\/rest\/(stream|download).*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pulsar-audio-cache',
              expiration: {
                maxEntries: 500, // cache up to 500 songs
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: { statuses: [200, 206] },
              rangeRequests: true,
            }
          },
          {
            urlPattern: /.*\/rest\/getCoverArt.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pulsar-image-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^https:\/\/ws\.audioscrobbler\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pulsar-lastfm-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      },
      manifest: {
        name: 'Pulsar Music Player',
        short_name: 'Pulsar',
        description: 'Modern Subsonic client with Last.fm integrations',
        theme_color: '#0d0e12',
        background_color: '#0d0e12',
        display: 'standalone',
        icons: [
          {
            src: 'https://ui-avatars.com/api/?name=Pulsar&background=f43f5e&color=fff&size=192',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://ui-avatars.com/api/?name=Pulsar&background=f43f5e&color=fff&size=512',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
