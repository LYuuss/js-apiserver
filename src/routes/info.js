import express from 'express';
var router = express.Router();


router.get('/', function(req, res, next) {
  res.json(
    {
        "version": "js-apiserver-1.0.0",
        "team": "Les uniques LYuuss"
    });
});

export default router;

