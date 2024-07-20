require("dotenv").config(); // Load environment variables

const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("pg");

const app = express();
const port = 3000;

const cors = require("cors");
app.use(cors());
app.use((req, res, next) => {
  // Allow access from every, eliminate CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.removeHeader("x-powered-by");
  // Set the allowed HTTP methods to be requested
  res.setHeader("Access-Control-Allow-Methods", "POST");
  // Headers clients can use in their requests
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Allow request to continue and be handled by routes
  next();
});

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// PostgreSQL client configuration from environment variables
const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

app.get("/", async (req, res) => {
  try {
    // Query to select all data from the table
    const query = "SELECT * FROM pg_customers;";
    const result = await client.query(query);

    // Send the result rows as JSON
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/test", async (req, res) => {
  res.json({ message: "hello world" });
});

// POST request to add a customer
app.post("/add-customer", async (req, res) => {
  const { quality, service, money_value, phone_no } = req.body;

  if (
    quality == null ||
    service == null ||
    money_value == null ||
    phone_no == null
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const query = `
    INSERT INTO pg_customers (quality, service, money_value, phone)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  try {
    const values = [quality, service, money_value, phone_no];

    const result = await client.query(query, values);

    res.status(201).json({
      message: "Customer added successfully",
      customer: result.rows[0], // Including the added customer in the response
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
