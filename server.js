const express = require('express');
const axios = require('axios');
const app = express();

if(process.env.ES_HOST === undefined) {
  console.log("FATAL ERROR: ES_HOST environment variable is not set.");
  process.exit(1);
}

function redirectUnmatched(req, res) {
  if (req.method == "GET") {
    const url = process.env.ES_HOST + req.originalUrl;
    axios.get(url).then((response) => {
      res.send(response.data);
    }).catch((error) => {
      console.log("ERROR:");
      console.log(error);
      res.send({'error': 'check output'});
    });
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: 'ONLY_GET_REQUESTS_ALLOWED' }));
  }
}

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.use(express.static(__dirname + '/build'));
app.use(redirectUnmatched);
app.listen(process.env.PORT || 8080);
console.log("Server.js started.");