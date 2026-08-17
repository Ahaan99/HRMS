import { db } from "../../../config/db.js";

export const createLanguageService = async ({ name }) => {
  if (!name) throw new Error("Language required");

  const [res] = await db.query(
    `INSERT INTO languages (name) VALUES (?)`,
    [name]
  );

  return { id: res.insertId };
};

export const getLanguagesService = async () => {
  const [rows] = await db.query(`SELECT id, name FROM languages`);
  return rows;
};