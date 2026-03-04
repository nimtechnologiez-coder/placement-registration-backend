const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const db = require('./db');
const placementRoutes = require('./routes/placementRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files for resumes (protected in production, but accessible for now)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/placement-register', placementRoutes);

// Database Initialization
db.initDb();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
