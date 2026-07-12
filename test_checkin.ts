import http from 'https';

const data = JSON.stringify({});

const options = {
  hostname: 'bloqueo-api.onrender.com',
  port: 443,
  path: '/api/v1/devices/check-in',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-device-token': 'TOKEN_DE_HARDWARE_GENERADO',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
