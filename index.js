const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./src/db");

dotenv.config();

const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());

// Serve static UI from public/
app.use(express.static(path.join(__dirname, "public")));

// Fallback to index.html for unmatched routes (SPA)
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

// GET all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, datetime, description, cost FROM expenses ORDER BY datetime DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// CREATE expense
app.post("/api/expenses", async (req, res) => {
  const { datetime, description, cost } = req.body;
  // simple validation
  if (!description || String(description).trim().length === 0)
    return res.status(400).json({ error: "Description is required" });
  const costNum = Number(cost);
  if (Number.isNaN(costNum) || costNum < 0)
    return res
      .status(400)
      .json({ error: "Cost must be a non-negative number" });
  try {
    const result = await db.query(
      "INSERT INTO expenses(datetime, description, cost) VALUES($1, $2, $3) RETURNING id, datetime, description, cost",
      [datetime, description, cost]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// UPDATE expense
app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  // Accept partial body: { description, cost }
  const { description, cost } = req.body;
  if (!description || String(description).trim().length === 0)
    return res.status(400).json({ error: "Description is required" });
  const costNum = Number(cost);
  if (Number.isNaN(costNum) || costNum < 0)
    return res
      .status(400)
      .json({ error: "Cost must be a non-negative number" });
  try {
    // Update only description and cost, keeping original datetime unchanged
    const result = await db.query(
      "UPDATE expenses SET description = $1, cost = $2 WHERE id = $3 RETURNING id, datetime, description, cost",
      [description, cost, id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Expense not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// DELETE expense
app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("DELETE FROM expenses WHERE id = $1", [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Expense not found" });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
