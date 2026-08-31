const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const paperRoutes = require("./src/routes/paperRoutes");
const auditRoutes = require("./src/routes/auditRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/audit", auditRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "SecurExam Backend API is running."
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`SecurExam server running on port ${PORT}`);
});