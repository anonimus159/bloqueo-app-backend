import http from 'https';

const options = {
  hostname: 'bloqueo-api.onrender.com',
  port: 443,
  path: '/api/v1/devices',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test-token'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => {
    body += d;
  });
  res.on('end', () => {
    console.log('Devices in Render Database:');
    try {
      console.log(JSON.parse(body));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
