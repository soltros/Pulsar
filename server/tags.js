import fs from 'fs';
import path from 'path';

export function injectTags(originalPath, tags, artUrl) {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        if (!fs.existsSync(originalPath)) {
          console.warn(`[ArtSync] ❌ Skipping, audio file not found on disk: ${originalPath}`);
          return reject(new Error('File not found: ' + originalPath));
        }

        if (artUrl) {
          const res = await fetch(artUrl);
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            const dirPath = path.dirname(originalPath);
            const coverPath = path.join(dirPath, 'cover.jpg');
            fs.writeFileSync(coverPath, Buffer.from(buffer));
            
            // Optionally, save a folder.jpg copy as well just to be thorough for some servers
            const folderPath = path.join(dirPath, 'folder.jpg');
            fs.writeFileSync(folderPath, Buffer.from(buffer));
            
            console.log(`[ArtSync] ✅ Successfully saved high-res cover art to: ${dirPath}`);
            return resolve(true);
          } else {
            console.error(`[ArtSync] ❌ Failed to download Last.fm artwork from URL: ${artUrl}`);
            return reject(new Error('Failed to download Last.fm artwork'));
          }
        }
        
        console.log(`[ArtSync] ⚠️ No artwork URL provided for: ${originalPath}`);
        resolve(true); // Nothing to do if no artwork
      } catch (err) {
        console.error(`[ArtSync] ❌ Critical error processing tags:`, err);
        reject(err);
      }
    })();
  });
}
