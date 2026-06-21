import ffmetadata from 'ffmetadata';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export function injectTags(originalPath, tags, artUrl) {
  return new Promise((resolve, reject) => {
    (async () => {
      if (!fs.existsSync(originalPath)) {
        return reject(new Error('File not found: ' + originalPath));
      }

    const tempPath = originalPath + '.' + randomUUID() + '.tmp';
    let coverTempPath = null;
    
    try {
      fs.copyFileSync(originalPath, tempPath);

      const options = {};
      
      if (artUrl) {
        // Download artwork to temp file
        const res = await fetch(artUrl);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          coverTempPath = path.join(path.dirname(tempPath), 'cover_' + randomUUID() + '.jpg');
          fs.writeFileSync(coverTempPath, Buffer.from(buffer));
          options.attachments = [coverTempPath];
        }
      }

      ffmetadata.write(tempPath, tags, options, (err) => {
        if (coverTempPath && fs.existsSync(coverTempPath)) fs.unlinkSync(coverTempPath);

        if (err) {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          return reject(err);
        }

        const stat = fs.statSync(tempPath);
        if (stat.size > 100) { // arbitrary small size to ensure not 0
          fs.renameSync(tempPath, originalPath);
          resolve(true);
        } else {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          reject(new Error('Output file was suspiciously small or empty. Aborting.'));
        }
      });
      } catch (err) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        if (coverTempPath && fs.existsSync(coverTempPath)) fs.unlinkSync(coverTempPath);
        reject(err);
      }
    })();
  });
}
