const https = require('https');

const options = {
  hostname: 'api.resend.com',
  path: '/emails',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer re_heeUBCZA_KxhUaf3TZyzFoB94Di3iyK4c'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { 
      const json = JSON.parse(data);
      console.log(JSON.stringify(json.data.slice(0, 10), null, 2));
  });
});

req.on('error', (e) => { console.error(e); });
req.end();
