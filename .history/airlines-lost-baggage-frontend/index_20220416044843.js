var express = require('express');
var app = express();
app.use(express.static('src'));
app.use(express.static('../airlines-lost-baggage-contract/build/contracts'));
app.use(express.static('../airlines-lost-baggage-frontend/build/contracts'));
app.get('/', function (req, res) {
  res.render('index.html');
});
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});