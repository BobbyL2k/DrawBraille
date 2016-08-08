/* jshint node: true, esversion: 6*/
const express = require('express');
var app = express();

app.use(express.static('public'));

app.listen(3000);