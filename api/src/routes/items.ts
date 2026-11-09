import { Router } from "express";
import { pool } from "../db/pool.js";

export const itemsRouter = Router();

itemsRouter.get("/items", async (_req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM items ORDER BY id");
    res.json(rows);
  } catch (err) { next(err); }
});

itemsRouter.post("/items", async (req, res, next) => {
  try {
    const { name } = req.body ?? {};
    if (typeof name !== "string" || name.trim() === "") {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const { rows } = await pool.query(
      "INSERT INTO items (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

itemsRouter.delete("/items/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM items WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "not found" });
    res.status(204).send();
  } catch (err) { next(err); }
});