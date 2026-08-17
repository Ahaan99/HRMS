import { db } from "../../../config/db.js";

export const createLocationService = async ({ name }) => {
  if (!name) throw new Error("Location required");

  const [res] = await db.query(
    `INSERT INTO locations (name) VALUES (?)`,
    [name]
  );

  return { id: res.insertId };
};

export const getLocationsService = async () => {
  const [rows] = await db.query(`SELECT id, name FROM locations`);
  return rows;
};