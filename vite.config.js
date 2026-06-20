import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
  plugins: [react(), tailwindcss(), configWriterPlugin()],
})
