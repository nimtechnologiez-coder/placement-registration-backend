const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { stringify } = require('csv-stringify');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/resumes');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const studentName = req.body.name ? req.body.name.replace(/\s+/g, '_').toLowerCase() : 'student';
        const department = req.body.department ? req.body.department.replace(/\s+/g, '_').toLowerCase() : 'dept';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${studentName}_${department}_${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'));
        }
    }
});

// Registration Endpoint
router.post('/register', upload.single('resume'), async (req, res) => {
    try {
        const { name, email, phone, college_name, college_type, department, year_of_passing, skills } = req.body;
        const resume_path = req.file ? req.file.path : null;

        if (!resume_path) {
            return res.status(400).json({ message: 'Resume upload is required' });
        }

        const query = `
      INSERT INTO placement_students (name, email, phone, college_name, college_type, department, year_of_passing, skills, resume_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
        const values = [name, email, phone, college_name, college_type, department, year_of_passing, skills, resume_path];

        await db.query(query, values);
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Admin: List Students
router.get('/students', async (req, res) => {
    try {
        const { name, department, college_type, college_name } = req.query;
        let query = 'SELECT * FROM placement_students WHERE 1=1';
        const values = [];
        let counter = 1;

        if (name) {
            query += ` AND name ILIKE $${counter}`;
            values.push(`%${name}%`);
            counter++;
        }
        if (department) {
            query += ` AND department = $${counter}`;
            values.push(department);
            counter++;
        }
        if (college_type) {
            query += ` AND college_type = $${counter}`;
            values.push(college_type);
            counter++;
        }
        if (college_name) {
            query += ` AND college_name ILIKE $${counter}`;
            values.push(`%${college_name}%`);
            counter++;
        }

        query += ' ORDER BY created_at DESC';
        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch students error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Admin: Export CSV
router.get('/export-csv', async (req, res) => {
    try {
        const query = 'SELECT name, email, phone, college_name, college_type, department, year_of_passing, skills, created_at FROM placement_students ORDER BY created_at DESC';
        const result = await db.query(query);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=\"students_registration.csv\"');

        stringify(result.rows, { header: true }).pipe(res);
    } catch (err) {
        console.error('Export CSV error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Admin: Download Resume
router.get('/resume/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT resume_path FROM placement_students WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const filePath = result.rows[0].resume_path;
        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).json({ message: 'Resume file not found' });
        }
    } catch (err) {
        console.error('Download resume error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
