const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getVersion() {
  try {
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return sha;
  } catch (e) {
    return Date.now().toString();
  }
}

function appendQueryToFileRefs(buildDir, version) {
  const manifestPath = path.join(buildDir, 'manifest.json');
  const indexPath = path.join(buildDir, 'index.html');

  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.icons && Array.isArray(manifest.icons)) {
        manifest.icons = manifest.icons.map(icon => {
          if (icon.src && !icon.src.includes('?')) {
            icon.src = icon.src + '?v=' + version;
          }
          return icon;
        });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log('Updated manifest.json icons with version:', version);
      }
    } catch (e) {
      console.error('Failed to update manifest.json:', e);
    }
  } else {
    console.warn('manifest.json not found in build dir:', manifestPath);
  }

  if (fs.existsSync(indexPath)) {
    try {
      let index = fs.readFileSync(indexPath, 'utf8');
      // Replace favicon and apple-touch-icon references by adding version if not present
      index = index.replace(/href="(\/favicon.ico)"/g, `href="$1?v=${version}"`);
      index = index.replace(/href="(\/logo192.png)"/g, `href="$1?v=${version}"`);
      index = index.replace(/href="(\/logo512.png)"/g, `href="$1?v=${version}"`);
      // Replace manifest link
      index = index.replace(/href="(\/manifest.json)"/g, `href="$1?v=${version}"`);
      fs.writeFileSync(indexPath, index, 'utf8');
      console.log('Updated index.html references with version:', version);
    } catch (e) {
      console.error('Failed to update index.html:', e);
    }
  } else {
    console.warn('index.html not found in build dir:', indexPath);
  }
}

function main() {
  const buildDir = path.join(__dirname, '..', 'build');
  const version = getVersion();
  appendQueryToFileRefs(buildDir, version);
}

main();
