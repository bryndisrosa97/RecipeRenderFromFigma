import dotenv from 'dotenv';
import fs from 'fs';
import util from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';

import { query } from '../src/db.js';
import { uploadImagesFromDisk } from './images.js';

const path = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const {
  DATABASE_URL: connectionString,
  CLOUDINARY_URL: cloudinaryUrl,
  IMAGE_FOLDER: imageFolder = join(path, '../data/img'),
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

const readFileAsync = util.promisify(fs.readFile);

async function importGenres(rows) {
  const genres = [];

  rows.forEach((row) => {
    const str = row.genres;
    const genreArray = str.split(',');
    for (let i = 0; i < genreArray.length; i += 1) {
      if (genres.indexOf(genreArray[i]) < 0) {
        genres.push(genreArray[i]);
      }
    }
  });

  const q = 'INSERT INTO GENRES (name) VALUES ($1) RETURNING *';
  const inserts = genres.map((c) => query(q, [c]));

  const results = await Promise.all(inserts);

  const mapped = {};

  results.forEach((r) => {
    const [{
      id,
      name,
    }] = r.rows;

    mapped[name] = id;
  });

  return mapped;
}

async function importSeries(row) {
  const q = `
    INSERT INTO
      SERIES
      (name, airDate, inProduction, tagline, image, description, language, network, homepage)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

  let { airDate } = row;

  if (airDate === '') {
    airDate = null;
  }

  const values = [
    row.name,
    airDate,
    row.inProduction,
    row.tagline,
    row.image,
    row.description,
    row.language,
    row.network,
    row.homepage,
  ];

  return query(q, values);
}

async function importEpisodes(row) {
  const q = `
    INSERT INTO
      EPISODES
      (name, no, airDate, overview, season, serie, serieId)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)`;

  const number = parseInt(row.number, 10);
  const airDate = null;
  const season = parseInt(row.season, 10);
  const serieId = parseInt(row.serieId, 10);

  const values = [
    row.name,
    number,
    airDate,
    row.overview,
    season,
    row.serie,
    serieId,
  ];

  return query(q, values);
}

async function importSeasons(row) {
  const q = `
    INSERT INTO
      SEASONS
      (name, no, airDate, overview, poster, serie, serieId)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)`;

  const number = parseInt(row.number, 10);
  let { airDate } = row;
  const serieId = parseInt(row.serieId, 10);

  if (airDate === '') {
    airDate = null;
  }

  const values = [
    row.name,
    number,
    airDate,
    row.overview,
    row.poster,
    row.serie,
    serieId,
  ];

  return query(q, values);
}

async function importSeriesGenres(row) {
  const str = row.genres;
  const genreArray = str.split(',');
  for (let i = 0; i < genreArray.length; i += 1) {
    const serieId = row.id;
    const genreName = genreArray[i];
    const q = 'INSERT INTO SERIES_GENRES (serieId, genreName) VALUES ($1, $2)';
    const values = [serieId, genreName];
    await query(q, values); // eslint-disable-line
  }
}

async function readCsv(filename) {
  return new Promise((resolve, reject) => {
    const all = [];
    fs.createReadStream(filename)
      .pipe(csvParser())
      .on('data', (data) => {
        all.push(data);
      })
      .on('end', () => {
        resolve(all);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function importData() {
  console.info('Starting import');

  const seriesRows = await readCsv(join(path, '../data/series.csv'));
  const seasonsRows = await readCsv(join(path, '../data/seasons.csv'));
  const episodesRows = await readCsv(join(path, '../data/episodes.csv'));

  await importGenres(seriesRows);

  for (let i = 0; i < seriesRows.length; i += 1) {
    await importSeries(seriesRows[i]); // eslint-disable-line
  }

  for (let i = 0; i < seasonsRows.length; i += 1) {
    await importSeasons(seasonsRows[i]); // eslint-disable-line
  }

  for (let i = 0; i < episodesRows.length; i += 1) {
    await importEpisodes(episodesRows[i]); // eslint-disable-line
  }

  for (let i = 0; i < seriesRows.length; i += 1) {
    importSeriesGenres(seriesRows[i]);
  }

  console.info('Finished!');
}

async function main() {
  console.info(`Set upp gagnagrunn á ${connectionString}`);
  console.info(`Set upp tengingu við Cloudinary á ${cloudinaryUrl}`);

  await query('DROP TABLE IF EXISTS SERIES_GENRES');
  await query('DROP TABLE IF EXISTS USERS_SERIES');
  await query('DROP TABLE IF EXISTS SEASONS cascade');
  await query('DROP TABLE IF EXISTS EPISODES');
  await query('DROP TABLE IF EXISTS USERS');
  await query('DROP TABLE IF EXISTS SERIES');
  await query('DROP TABLE IF EXISTS GENRES');

  console.info('Töflu eytt');

  try {
    const createTable = await readFileAsync('./scripts//sql/schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Tafla og admin búin til!');
  } catch (e) {
    console.error('Villa við að búa til töflu: ', e.message);
    return;
  }

  try {
    const images = await uploadImagesFromDisk(imageFolder);
    console.info(`Sendi ${images.length} myndir á Cloudinary`);
  } catch (e) {
    console.error('Villa við senda myndir á Cloudinary:', e.message);
  }

  importData().catch((err) => {
    console.error('Error importing', err);
  });
}

main().catch((err) => {
  console.error(err);
});
