import fs from 'fs';
import { execSync } from 'child_process';

// Use sharp or npx
try {
  console.log('Trimming logo PNG...');
  // We can also install sharp locally or use npx
  execSync('npx -y sharp-cli --input public/logo.png --output public/logo.png trim', { stdio: 'inherit' });
  console.log('Successfully trimmed logo.png!');
} catch (e) {
  console.error('Error trimming image:', e.message);
}
