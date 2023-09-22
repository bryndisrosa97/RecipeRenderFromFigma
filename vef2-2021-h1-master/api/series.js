import xss from 'xss';
import { paged, query, conditionalUpdate } from '../src/db.js';

export async function listSeries(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const q = `
    SELECT
      *
    FROM series
    ORDER BY id ASC
  `;
  const values = [];

  const series = await paged(q, { offset, limit, values });

  return res.json(series);
}

export async function createSerie(req, res) {
  const q = `INSERT INTO series
    (name, airDate, inProduction, tagline, image, description, language, network, homepage)
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`;

  const data = [
    xss(req.body.name),
    xss(req.body.airDate),
    xss(req.body.inProduction),
    xss(req.body.tagline),
    xss(req.body.image),
    xss(req.body.description),
    xss(req.body.language),
    xss(req.body.network),
    xss(req.body.homepage),
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

export async function listSerie(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  const serie = await query(`
    SELECT
      *
    FROM series
    WHERE series.id = $1
  `, [id]);

  if (serie.rows.length === 0) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  return res.json(serie.rows[0]);
}

export async function updateSerie(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  const serie = await query('SELECT * FROM series WHERE id = $1', [id]);

  if (serie.rows.length === 0) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  const isset = (f) => typeof f === 'string' || typeof f === 'number';

  const fields = [
    isset(req.body.name) ? 'name' : null,
    isset(req.body.airDate) ? 'airDate' : null,
    isset(req.body.inProduction) ? 'inProduction' : null,
    isset(req.body.tagline) ? 'tagline' : null,
    isset(req.body.image) ? 'image' : null,
    isset(req.body.description) ? 'description' : null,
    isset(req.body.language) ? 'language' : null,
    isset(req.body.network) ? 'network' : null,
    isset(req.body.homepage) ? 'homepage' : null,
  ];

  const values = [
    isset(req.body.name) ? xss(req.body.name) : null,
    isset(req.body.airDate) ? xss(req.body.airDate) : null,
    isset(req.body.inProduction) ? xss(req.body.inProduction) : null,
    isset(req.body.tagline) ? xss(req.body.tagline) : null,
    isset(req.body.image) ? xss(req.body.image) : null,
    isset(req.body.description) ? xss(req.body.description) : null,
    isset(req.body.language) ? xss(req.body.language) : null,
    isset(req.body.network) ? xss(req.body.network) : null,
    isset(req.body.homepage) ? xss(req.body.homepage) : null,
  ];

  const result = await conditionalUpdate('series', id, fields, values);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

export async function deleteSerie(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  await query('DELETE FROM series_genres WHERE serieId = $1', [id]);
  await query('DELETE FROM users_series WHERE serieId = $1', [id]);
  await query('DELETE FROM episodes WHERE serieId = $1', [id]);
  await query('DELETE FROM seasons WHERE serieId = $1', [id]);
  const del = await query('DELETE FROM series WHERE id = $1', [id]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Serie not found' });
}
