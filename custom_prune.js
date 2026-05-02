const fs = require('fs');
const JSZip = require('jszip');

async function prune() {
  const distPath = './dist';
  const files = fs.readdirSync(distPath).filter(f => f.endsWith('.zab'));
  if (files.length === 0) return console.log('No zab file found');
  
  const zabFile = distPath + '/' + files[0];
  console.log('Processing:', zabFile);
  console.log('Original size:', (fs.statSync(zabFile).size / 1024 / 1024).toFixed(2), 'MB');
  
  const data = fs.readFileSync(zabFile);
  const zip = await JSZip.loadAsync(data);
  
  // List all files
  const allFiles = Object.keys(zip.files);
  console.log('Files in zab:');
  for (const f of allFiles) {
    const content = await zip.files[f].async('nodebuffer');
    console.log(' ', f, '-', (content.length / 1024 / 1024).toFixed(2), 'MB');
  }
  
  // Remove intermediate products (.sc and .ip-package)
  const ipFiles = allFiles.filter(f => f.endsWith('.sc') || f.endsWith('.ip-package') || f === '.ip-package');
  if (ipFiles.length === 0) {
    console.log('No intermediate product files found');
    return;
  }
  
  for (const ipFile of ipFiles) {
    console.log('Removing:', ipFile);
    zip.remove(ipFile);
  }
  
  const modifiedData = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.writeFileSync(zabFile, modifiedData);
  console.log('Pruned size:', (modifiedData.length / 1024 / 1024).toFixed(2), 'MB');
}

prune().catch(console.error);
