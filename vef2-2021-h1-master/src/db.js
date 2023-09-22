import pg from 'pg';
import dotenv from 'dotenv';
import { toPositiveNumberOrDefault } from '../utils/validation.js';
import { debug } from '../utils/debug.js';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(_query, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(_query, values);
    return result;
  } finally {
    client.release();
  }
}

export async function paged(sqlQuery, { offset = 0, limit = 10, values = [] }) {
  const sqlLimit = values.length + 1;
  const sqlOffset = values.length + 2;
  const pagedQuery = `${sqlQuery} LIMIT $${sqlLimit} OFFSET $${sqlOffset}`;

  const limitAsNumber = Number(limit);
  const offsetAsNumber = Number(offset);

  const cleanLimit = Number.isInteger(limitAsNumber) && limitAsNumber > 0 ? limitAsNumber : 10;
  const cleanOffset = Number.isInteger(offsetAsNumber) && offsetAsNumber > 0 ? offsetAsNumber : 0;

  const combinedValues = values.concat([cleanLimit, cleanOffset]);

  const result = await query(pagedQuery, combinedValues);

  return {
    limit: cleanLimit,
    offset: cleanOffset,
    items: result.rows,
  };
}

export async function paged1(
  sqlQuery,
  values = [],
  { offset = 0, limit = 10 } = {},
) {
  const sqlLimit = values.length + 1;
  const sqlOffset = values.length + 2;
  const q = `${sqlQuery} LIMIT $${sqlLimit} OFFSET $${sqlOffset}`;

  const limitAsNumber = toPositiveNumberOrDefault(limit, 10);
  const offsetAsNumber = toPositiveNumberOrDefault(offset, 0);

  const combinedValues = values.concat([limitAsNumber, offsetAsNumber]);

  const result = await query(q, combinedValues);

  return {
    limit: limitAsNumber,
    offset: offsetAsNumber,
    items: result.rows,
  };
}

export async function conditionalUpdate(table, id, fields, values) {
  const filteredFields = fields.filter((i) => typeof i === 'string');
  const filteredValues = values.filter((i) => typeof i === 'string' || typeof i === 'number');

  if (filteredFields.length === 0) {
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('fields and values must be of equal length');
  }

  // id is field = 1
  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table}
      SET ${updates.join(', ')}
    WHERE
      id = $1
    RETURNING *
    `;

  const result = await query(q, [id].concat(filteredValues));

  return result;
}

export async function conditionalUpdate1(table, id, fields, values) {
  const filteredFields = fields.filter((i) => typeof i === 'string');
  const filteredValues = values
    .filter(
      (i) => typeof i === 'string'
      || typeof i === 'number'
      || i instanceof Date,
    );

  if (filteredFields.length === 0) {
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('fields and values must be of equal length');
  }

  // id is field = 1
  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table}
      SET ${updates.join(', ')}
    WHERE
      id = $1
    RETURNING *
    `;

  const queryValues = [id].concat(filteredValues);

  debug('Conditional update', q, queryValues);

  const result = await query(q, queryValues);

  return result;
}

// Helper to remove pg from the event loop
export async function end() {
  await pool.end();
}
