import xss from 'xss';
import { query, conditionalUpdate } from '../src/db.js';

const statetypes = ['langar að horfa', 'er að horfa', 'hef horft'];

function validate(state) {
  return statetypes.indexOf(state.toLowerCase()) >= 0;
}

export async function createState(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const { state } = req.body;

  console.log(validate(state));

  if (!validate(state)) {
    return res.status(400).json({
      error: [
        {
          field: 'state',
        },
        {
          error:
            `State ${state} is not legal. `
            + `Only states: ${statetypes.join(', ')} are accepted`,
        },
      ],
    });
  }

  const q = `
  INSERT INTO users_series
    (userId, serieId, state)
  VALUES
    ($1, $2, $3)
  RETURNING *
  `;

  const data = [
    userId,
    id,
    state,
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

export async function updateState(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const state = req.body.state;

  if (!validate(state)) {
    return res.status(400).json({
      error: [
        {
          field: 'state',
        },
        {
          error:
            `State ${state} is not legal. `
            + `Only states: ${statetypes.join(', ')} are accepted`,
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
    isset(state) ? 'state' : null,
  ];

  const values = [
    isset(userId) ? xss(userId) : null,
    isset(id) ? xss(id) : null,
    isset(state) ? xss(state) : null,
  ];

  const result = await conditionalUpdate('users_series', id, fields, values);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

export async function deleteState(req, res) {
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
