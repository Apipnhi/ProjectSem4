import mysql from "mysql2/promise"

// Database connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number.parseInt(process.env.MYSQL_PORT || "3306"),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Create a connection pool
const pool = mysql.createPool(dbConfig)

// Helper function to execute SQL queries
export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Example functions for common operations

// Get all items from a table
export async function getAll(table: string) {
  return query(`SELECT * FROM ${table}`)
}

// Get a single item by ID
export async function getById(table: string, id: number | string) {
  return query(`SELECT * FROM ${table} WHERE id = ?`, [id])
}

// Insert a new record
export async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map(() => "?").join(", ")

  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`
  const result = await query(sql, values)
  return result
}

// Update a record
export async function update(table: string, id: number | string, data: Record<string, any>) {
  const keys = Object.keys(data)
  const values = Object.values(data)
  const setClause = keys.map((key) => `${key} = ?`).join(", ")

  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`
  const result = await query(sql, [...values, id])
  return result
}

// Delete a record
export async function remove(table: string, id: number | string) {
  const result = await query(`DELETE FROM ${table} WHERE id = ?`, [id])
  return result
}
