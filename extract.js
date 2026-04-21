const https = require('https');
const fs = require('fs');

https.get('https://coreluxreview.com/', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // We are looking for: <img ... src="(/uploads/files/[^"]+)" alt="([^"]+)">
    const regex = /<div class="carousel-cell">.*?<img.*?src="([^"]+)".*?alt="([^"]+)".*?<\/div>/gs;
    let match;
    const results = {};
    while ((match = regex.exec(data)) !== null) {
      results[match[2].trim()] = 'https://coreluxreview.com' + match[1];
    }
    fs.writeFileSync('extract.json', JSON.stringify(results, null, 2));
    console.log('Extraction complete. Saved to extract.json');
  });
});
