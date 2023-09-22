import xss from 'xss';
import { query, conditionalUpdate } from '../src/db.js';

export async function rateSerie(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const rate = req.body.rating;

  if (rate < 0 || rate > 5) {
    return res.status(400).json({
      error: [
        {
          field: 'rating',
        },
        {
          error:
            `Rating ${rate} is not legal. `
            + 'Only states between 0 and 5 are accepted',
        },
      ],
    });
  }

  const uSerie = await query('SELECT * FROM users_series WHERE userId = $1 AND serieId = $2', [userId, id]);

  if (uSerie.rows.length === 1) {
    const isset = f => typeof f === 'string' || typeof f === 'number';

    const fields = [
      isset(userId) ? 'userId' : null,
      isset(id) ? 'serieId' : null,
      isset(rate) ? 'rating' : null,
    ];

    const values = [
      isset(userId) ? xss(userId) : null,
      isset(id) ? xss(id) : null,
      isset(rate) ?  xss(rate) : null,
    ];

    const result = await conditionalUpdate('users_series', id, fields, values);
    return res.status(201).json(result.rows[0]);
  }

  const q = `
  INSERT INTO users_series
    (userId, serieId, rating)
  VALUES
    ($1, $2, $3)
  RETURNING *
  `;

  const data = [
    userId,
    id,
    rate,
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

export async function updateRate(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const rate = req.body.rating;

  if (rate < 0 || rate > 5) {
    return res.status(400).json({
      error: [
        {
          field: 'rating',
        },
        {
          error:
            `Rating ${rate} is not legal. `
            + 'Only states between 0 and 5 are accepted',
        },
      ],
    });
  }

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  const serie = await query('SELECT * FROM series WHERE id = $1', [id]);

  if (serie.rows.length === 0) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  const isset = f => typeof f === 'string' || typeof f === 'number';

  const fields = [
    isset(userId) ? 'userId' : null,
    isset(id) ? 'serieId' : null,
    isset(rate) ? 'rating' : null,
  ];

  const values = [
    isset(userId) ? xss(userId) : null,
    isset(id) ? xss(id) : null,
    isset(rate) ? xss(rate) : null,
  ];

  const result = await conditionalUpdate('users_series', id, fields, values);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

export async function deleteRate(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Serie not found' });
  }

  const del = await query('DELETE FROM users_series WHERE userId = $1 AND serieId = $2', [userId, id]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Serie not found' });
}
