// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const apiRouter = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);

app.use(errorHandler);

module.exports = app;
