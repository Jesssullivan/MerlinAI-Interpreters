const fs = require('fs');
const request = require('request');

// Event handler executed when a file is selected
const formData = {
  name: 'file1',
  file: {
    value:  fs.createReadStream("./tone_4_800.wav"),
    options: {
      filename: 'Logo_flame.png',
      contentType: 'image/png'
    }
  }
};

request.post({url:'http://localhost/uploads', formData},
  function cb(err: any, httpResponse: any, body: any) {
    if (err) {
      return console.error('upload failed:', err);
    }
    console.log('Upload successful!  Server responded with:', body);
  }
);