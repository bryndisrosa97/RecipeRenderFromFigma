import express from 'express';
import dotenv from 'dotenv';
import { router as indexRouter, router as genrerouter } from '../api/index.js';

import { authApp } from '../authentication/auth.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

const app = express();
app.use(express.json());
app.use('/', indexRouter);
app.use('/', genrerouter);
app.use(authApp);

// app.use(express.static(join(path, '../data')));

/**
 * Middleware sem sér um 404 villur.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
// eslint-disable-next-line no-unused-vars
function notFoundHandler(req, res, next) {
  const title = 'Síða fannst ekki';
  res.status(404).json({ title });
}

/**
 * Middleware sem sér um villumeðhöndlun.
 *
 * @param {object} err Villa sem kom upp
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const title = 'Villa kom upp';
  res.status(500).json({ title });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
