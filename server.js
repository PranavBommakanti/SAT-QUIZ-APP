const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const csv = require("csv-parser");

const app = express();
const PORT = 4000;

// Always use absolute path for CSV file and log for debug
const csvFilePath = path.join(__dirname, "data", "dsat_540_questions.csv");
console.log("CSV file will be read from:", csvFilePath);

app.use(cors());
app.use(express.json());

app.get("/questions/:testNumber", (req, res) => {
  const testNumber = req.params.testNumber;
  const results = [];

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (data) => {
      if (String(data.exam).trim() === testNumber.trim()) {
        results.push(data);
      }
    })
    .on("end", () => {
      if (results.length === 0) {
        return res.status(404).json({ error: "Test number not found" });
      }
      res.json(results);
    })
    .on("error", (err) => {
      console.error("CSV parse error:", err);
      res.status(500).json({ error: "Failed to parse CSV" });
    });
});

// Listen on all network interfaces so devices on LAN can connect
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
