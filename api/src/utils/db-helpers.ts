import { query as dbQuery } from '../config/database.js';

// Re-export query for direct use
export { query } from '../config/database.js';

/**
 * Execute a parameterized query safely
 */
export const executeQuery = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  const result = await dbQuery(sql, params);
  return result.rows;
};

/**
 * Execute a query and return a single row
 */
export const executeQueryOne = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> => {
  const result = await dbQuery(sql, params);
  return result.rows[0] || null;
};

/**
 * Insert a record and return the inserted row
 */
export const insertOne = async <T = any>(
  table: string,
  data: Record<string, any>
): Promise<T> => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const sql = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await dbQuery(sql, values);
  return result.rows[0];
};

/**
 * Update a record by ID and return the updated row
 */
export const updateById = async <T = any>(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<T | null> => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const sql = `
    UPDATE ${table}
    SET ${setClause}
    WHERE id = $${keys.length + 1}
    RETURNING *
  `;

  const result = await dbQuery(sql, [...values, id]);
  return result.rows[0] || null;
};

/**
 * Delete a record by ID
 */
export const deleteById = async (
  table: string,
  id: string
): Promise<boolean> => {
  const sql = `DELETE FROM ${table} WHERE id = $1`;
  const result = await dbQuery(sql, [id]);
  return result.rowCount > 0;
};

/**
 * Find a record by ID
 */
export const findById = async <T = any>(
  table: string,
  id: string
): Promise<T | null> => {
  const sql = `SELECT * FROM ${table} WHERE id = $1`;
  const result = await dbQuery(sql, [id]);
  return result.rows[0] || null;
};

/**
 * Find records with conditions
 */
export const findWhere = async <T = any>(
  table: string,
  conditions: Record<string, any>
): Promise<T[]> => {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const sql = `SELECT * FROM ${table} WHERE ${whereClause}`;
  const result = await dbQuery(sql, values);
  return result.rows;
};

/**
 * Count records with optional conditions
 */
export const count = async (
  table: string,
  conditions?: Record<string, any>
): Promise<number> => {
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  let values: any[] = [];

  if (conditions && Object.keys(conditions).length > 0) {
    const keys = Object.keys(conditions);
    values = Object.values(conditions);
    const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    sql += ` WHERE ${whereClause}`;
  }

  const result = await dbQuery(sql, values);
  return parseInt(result.rows[0].count, 10);
};

/**
 * Check if a record exists
 */
export const exists = async (
  table: string,
  conditions: Record<string, any>
): Promise<boolean> => {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const sql = `SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${whereClause}) as exists`;
  const result = await dbQuery(sql, values);
  return result.rows[0].exists;
};

/**
 * Paginate results
 */
export const paginate = async <T = any>(
  table: string,
  page: number = 1,
  limit: number = 50,
  conditions?: Record<string, any>,
  orderBy: string = 'created_at DESC'
): Promise<{ data: T[]; total: number; page: number; pages: number }> => {
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  let values: any[] = [];

  if (conditions && Object.keys(conditions).length > 0) {
    const keys = Object.keys(conditions);
    values = Object.values(conditions);
    whereClause = 'WHERE ' + keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
  }

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
  const countResult = await dbQuery(countSql, values);
  const total = parseInt(countResult.rows[0].count, 10);

  // Get paginated data
  const dataSql = `
    SELECT * FROM ${table}
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;
  const dataResult = await dbQuery(dataSql, [...values, limit, offset]);

  return {
    data: dataResult.rows,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};


/**
 * Update records with conditions and return updated rows
 */
export const updateWhere = async <T = any>(
  table: string,
  conditions: Record<string, any>,
  data: Record<string, any>
): Promise<T[]> => {
  const dataKeys = Object.keys(data);
  const dataValues = Object.values(data);
  const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const conditionKeys = Object.keys(conditions);
  const conditionValues = Object.values(conditions);
  const whereClause = conditionKeys.map((key, i) => `${key} = $${dataKeys.length + i + 1}`).join(' AND ');

  const sql = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING *
  `;

  const result = await dbQuery(sql, [...dataValues, ...conditionValues]);
  return result.rows;
};
