const https = require('https');
https.get('https://srans-smart-regional-alert-and-navi.vercel.app', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Find the main js bundle
    const match = data.match(/<script type="module" crossorigin src="(.*?)">/);
    if (match) {
      console.log('Main JS:', match[1]);
      https.get('https://srans-smart-regional-alert-and-navi.vercel.app' + match[1], (jsRes) => {
        let jsData = '';
        jsRes.on('data', chunk => jsData += chunk);
        jsRes.on('end', () => {
           // Find the baseURL configuration
           const apiMatch = jsData.match(/baseURL:"(.*?)"/);
           console.log('Deployed VITE_API_URL:', apiMatch ? apiMatch[1] : 'Not Found');
        });
      });
    } else {
      console.log('Script not found');
    }
  });
}).on('error', console.error);
