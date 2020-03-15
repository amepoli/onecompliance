const fs = require('fs');
const f = 'node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.js';

fs.readFile(f, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/node: false/g, 'node: {crypto: true, stream: true}');

  fs.writeFile(f, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });

  console.log('Crypto patch applied');
});


// ----------------------------------------------
// SweetAlert2 fix

const sweetalert2File = 'node_modules/sweetalert2/sweetalert2.d.ts';

fs.readFile(sweetalert2File, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace('[string?, string?, SweetAlertIcon?]', '[string, string, SweetAlertIcon]');

  fs.writeFile(sweetalert2File, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });

  console.log('Sweetalert2 patch applied');
});