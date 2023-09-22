import xss from 'xss';
import { query } from '../src/db.js';

export async function listEpisode(req, res) {
  // const { serieid, no } = req.params;
  const { id, season, episode } = req.params;

  if (!Number.isInteger(Number(id))
  || !Number.isInteger(Number(episode))
  || !Number.isInteger(Number(season))) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  const q = await query(`
    SELECT
      *
    FROM EPISODES
    WHERE serieId = $1
    AND season = $2
    AND no = $3
  `, [id, season, episode]);

  if (q.rows.length === 0) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  return res.json(q.rows[0]);
}

export async function createEpisode(req, res) {
  const { id, season } = req.params;

  const serie = await query('SELECT serie FROM seasons WHERE serieId = $1 AND no = $2', [id, season]);
  const q = `
    INSERT INTO episodes
      (name, no, airDate, overview, season, serie, serieId)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `;

  const data = [
    xss(req.body.name),
    xss(req.body.no),
    xss(req.body.airDate) || null,
    xss(req.body.overview) || null,
    season,
    serie.rows[0].serie,
    id,
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

export async function deleteEpisode(req, res) {
  const { id, season, episode } = req.params;

  if (!Number.isInteger(Number(id))
  || !Number.isInteger(Number(season))
  || !Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  const episodeId = await query(`
  SELECT
  id
  FROM episodes
  WHERE serieId = $1
  AND season = $2
  AND no = $3
  `, [id, season, episode]);

  if (episodeId.rows.length === 0) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  const del = await query('DELETE FROM episodes WHERE id = $1', [episodeId.rows[0].id]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Episode not found' });
}
