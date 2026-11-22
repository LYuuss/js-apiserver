var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.json(
    {
        "version": "js-apiserver-1.0.0",
        "team": "Les uniques LYuuss"
    });
});

module.exports = router;

