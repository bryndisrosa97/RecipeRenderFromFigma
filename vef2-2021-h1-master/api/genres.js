import xss from 'xss';
import { paged, query } from '../src/db.js';

export async function listGenres(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const q = `
  SELECT
    *
  FROM genres
  ORDER BY id ASC
`;
  const values = [];

  const genres = await paged(q, { offset, limit, values });
  return res.json(genres);
}

export async function createGenre(req, res) {
  const q = `INSERT INTO genres
    (name)
    VALUES
    ($1)
    RETURNING *`;

  const data = [
    xss(req.body.name),
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}
