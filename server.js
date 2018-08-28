const express = require('express');
const app = express();

function redirectUnmatched(req, res) {
  if (req.method == "GET") {
    res.redirect(process.env.ES_HOST);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: 'ONLY_GET_REQUESTS_ALLOWED' }));
  }
}

app.use(express.static(__dirname + '/build'));
app.use(redirectUnmatched);
app.listen(process.env.PORT || 8080);