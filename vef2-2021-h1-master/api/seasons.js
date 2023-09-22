import xss from 'xss';
import { paged, query } from '../src/db.js';

export async function listSeasons(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Serie not found' });
  }
  const { offset = 0, limit = 10 } = req.query;

  const q = `
    SELECT
      *
    FROM seasons
    WHERE seasons.serieId = ${id}
  `;

  const values = [];

  const seasons = await paged(q, { offset, limit, values });

  return res.json(seasons);
}

export async function createSeason(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  const serie = await query('SELECT name FROM series WHERE id = $1', [id]);

  if (serie.rows.length === 0) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  const q = `INSERT INTO seasons
      (name, no, airDate, overview, poster, serie, serieId)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;

  const data = [
    xss(req.body.name),
    xss(req.body.no),
    xss(req.body.airDate),
    xss(req.body.overview),
    xss(req.body.poster),
    serie.rows[0].name,
    id,
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

export async function listSeason(req, res) {
  const { id, season } = req.params;

  if (!Number.isInteger(Number(id)) || !Number.isInteger(Number(season))) {
    return res.status(404).json({ error: 'Season not found' });
  }

  const q = await query(`
    SELECT
      *
    FROM seasons
    WHERE serieId = $1
    AND no = $2
  `, [id, season]);

  if (q.rows.length === 0) {
    return res.status(404).json({ error: 'Season not found' });
  }

  return res.json(q.rows[0]);
}

export async function deleteSeason(req, res) {
  const { id, season } = req.params;

  if (!Number.isInteger(Number(id)) || !Number.isInteger(Number(season))) {
    return res.status(404).json({ error: 'Season not found' });
  }

  const seasonId = await query(`
  SELECT
  id
  FROM seasons
  WHERE serieId = $1
  AND no = $2
  `, [id, season]);

  if (seasonId.rows.length === 0) {
    return res.status(404).json({ error: 'Season not found' });
  }

  await query('DELETE FROM episodes WHERE season = $1 AND serieId = $2', [season, id]);
  const del = await query('DELETE FROM seasons WHERE id = $1', [seasonId.rows[0].id]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Season not found' });
}
