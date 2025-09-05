import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { pool, initializeDatabase } from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT middleware for protected routes
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    const [profiles] = await pool.execute('SELECT is_admin FROM profiles WHERE id = ?', [req.user.id]);
    
    if (profiles.length === 0 || !profiles[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error checking admin status' });
  }
};

// Initialize database and run migrations
const runMigrations = async () => {
  try {
    const migrationPath = path.join(__dirname, 'migrations', '001_create_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.execute(statement);
        } catch (error) {
          // Skip errors for indexes and constraints that might already exist
          if (error.code === 'ER_DUP_KEYNAME' || 
              error.code === 'ER_DUP_ENTRY' || 
              error.code === 'ER_FK_DUP_NAME') {
            console.log(`⚠️  Skipping: ${error.message}`);
          } else {
            console.error(`❌ Migration error: ${error.message}`);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    
    console.log('✅ Database migrations completed successfully!');
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
  }
};

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get profile
    const [profiles] = await pool.execute('SELECT * FROM profiles WHERE id = ?', [user.id]);
    const profile = profiles[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );
    
    const userId = result.insertId;
    
    // Create profile
    await pool.execute(
      'INSERT INTO profiles (id, email, first_name, last_name) VALUES (?, ?, ?, ?)',
      [userId, email, firstName, lastName]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: userId, email: email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        email: email,
        profile: {
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          is_admin: false
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile Routes
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const [profiles] = await pool.execute(
      `SELECT p.*, b.name as batch_name 
       FROM profiles p 
       LEFT JOIN batches b ON p.batch_id = b.id 
       WHERE p.id = ?`, 
      [req.user.id]
    );
    
    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batches Routes
app.get('/api/batches', authenticateToken, async (req, res) => {
  try {
    const [batches] = await pool.execute(
      'SELECT * FROM batches ORDER BY name ASC'
    );
    
    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/batches', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO batches (name) VALUES (?)',
      [name]
    );
    
    // Get the created batch by name since we can't use insertId with UUIDs
    const [newBatch] = await pool.execute(
      'SELECT * FROM batches WHERE name = ? ORDER BY created_at DESC LIMIT 1',
      [name]
    );
    
    res.status(201).json(newBatch[0]);
  } catch (error) {
    console.error('Create batch error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Batch with this name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/batches/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    await pool.execute(
      'UPDATE batches SET name = ? WHERE id = ?',
      [name, id]
    );
    
    const [updatedBatch] = await pool.execute(
      'SELECT * FROM batches WHERE id = ?',
      [id]
    );
    
    if (updatedBatch.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(updatedBatch[0]);
  } catch (error) {
    console.error('Update batch error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Batch with this name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.delete('/api/batches/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM batches WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard Stats Route
app.get('/api/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Count students (non-admin profiles)
    const [students] = await pool.execute(
      'SELECT COUNT(*) as count FROM profiles WHERE is_admin = FALSE'
    );
    
    // Count subjects
    const [subjects] = await pool.execute(
      'SELECT COUNT(*) as count FROM subjects'
    );
    
    // Count total feedback
    const [totalFeedback] = await pool.execute(
      'SELECT COUNT(*) as count FROM feedback'
    );
    
    // Count today's feedback
    const [todayFeedback] = await pool.execute(
      'SELECT COUNT(*) as count FROM feedback WHERE created_at >= ? AND created_at < ?',
      [today, tomorrow]
    );
    
    res.json({
      studentCount: students[0].count,
      subjectCount: subjects[0].count,
      totalFeedbackCount: totalFeedback[0].count,
      feedbackTodayCount: todayFeedback[0].count
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Recent Feedback Route
app.get('/api/feedback/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [feedback] = await pool.execute(
      `SELECT f.*, 
              s.name as subject_name, 
              p.first_name, p.last_name, p.avatar_url
       FROM feedback f
       LEFT JOIN subjects s ON f.class_id = s.id
       LEFT JOIN profiles p ON f.student_id = p.id
       ORDER BY f.created_at DESC
       LIMIT 5`
    );
    
    res.json(feedback);
  } catch (error) {
    console.error('Recent feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Subject Performance Stats Route
app.get('/api/subjects/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT s.id as subject_id,
              s.name as subject_name,
              COUNT(f.id) as feedback_count,
              COALESCE(AVG(f.rating), 0) as average_rating
       FROM subjects s
       LEFT JOIN feedback f ON s.id = f.class_id
       GROUP BY s.id, s.name
       HAVING COUNT(f.id) > 0
       ORDER BY average_rating DESC`
    );
    
    res.json(stats);
  } catch (error) {
    console.error('Subject stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Students Routes (Profiles with is_admin = false)
app.get('/api/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [students] = await pool.execute(
      `SELECT p.*, b.name as batch_name 
       FROM profiles p 
       LEFT JOIN batches b ON p.batch_id = b.id 
       WHERE p.is_admin = FALSE 
       ORDER BY p.first_name ASC, p.last_name ASC`
    );
    
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, batchId, semesterNumber } = req.body;
    
    // Check if user exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user - let MySQL generate the UUID
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );
    
    // Get the created user to retrieve the generated UUID
    const [createdUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    const userId = createdUser[0].id;
    
    // Create student profile
    await pool.execute(
      'INSERT INTO profiles (id, email, first_name, last_name, is_admin, batch_id, semester_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, firstName, lastName, false, batchId, semesterNumber]
    );
    
    // Get the created student with batch info
    const [newStudent] = await pool.execute(
      `SELECT p.*, b.name as batch_name 
       FROM profiles p 
       LEFT JOIN batches b ON p.batch_id = b.id 
       WHERE p.id = ?`,
      [userId]
    );
    
    res.status(201).json(newStudent[0]);
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'User with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/students/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, batchId, semesterNumber } = req.body;
    
    await pool.execute(
      'UPDATE profiles SET first_name = ?, last_name = ?, batch_id = ?, semester_number = ? WHERE id = ?',
      [firstName, lastName, batchId, semesterNumber, id]
    );
    
    const [updatedStudent] = await pool.execute(
      `SELECT p.*, b.name as batch_name 
       FROM profiles p 
       LEFT JOIN batches b ON p.batch_id = b.id 
       WHERE p.id = ?`,
      [id]
    );
    
    if (updatedStudent.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(updatedStudent[0]);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/students/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user (will cascade delete profile)
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Subjects Routes
app.get('/api/subjects', authenticateToken, async (req, res) => {
  try {
    const [subjects] = await pool.execute(
      `SELECT s.*, b.name as batch_name 
       FROM subjects s 
       LEFT JOIN batches b ON s.batch_id = b.id 
       ORDER BY s.name ASC`
    );
    
    res.json(subjects);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/subjects', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, period, batchId, semesterNumber } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO subjects (name, period, batch_id, semester_number) VALUES (?, ?, ?, ?)',
      [name, period, batchId, semesterNumber]
    );
    
    // Get the created subject by name, batch_id and semester_number since we can't use insertId with UUIDs
    const [newSubject] = await pool.execute(
      `SELECT s.*, b.name as batch_name 
       FROM subjects s 
       LEFT JOIN batches b ON s.batch_id = b.id 
       WHERE s.name = ? AND s.batch_id = ? AND s.semester_number = ?
       ORDER BY s.created_at DESC LIMIT 1`,
      [name, batchId, semesterNumber]
    );
    
    res.status(201).json(newSubject[0]);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/subjects/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, period, batchId, semesterNumber } = req.body;
    
    await pool.execute(
      'UPDATE subjects SET name = ?, period = ?, batch_id = ?, semester_number = ? WHERE id = ?',
      [name, period, batchId, semesterNumber, id]
    );
    
    const [updatedSubject] = await pool.execute(
      `SELECT s.*, b.name as batch_name 
       FROM subjects s 
       LEFT JOIN batches b ON s.batch_id = b.id 
       WHERE s.id = ?`,
      [id]
    );
    
    if (updatedSubject.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json(updatedSubject[0]);
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/subjects/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM subjects WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Timetables Routes
app.get('/api/timetables', authenticateToken, async (req, res) => {
  try {
    const [timetables] = await pool.execute(
      `SELECT t.*, s.name as subject_name, b.name as batch_name 
       FROM timetables t 
       LEFT JOIN subjects s ON t.class_id = s.id 
       LEFT JOIN batches b ON t.batch_id = b.id 
       ORDER BY t.day_of_week ASC`
    );
    
    res.json(timetables);
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/timetables', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { dayOfWeek, classId, batchId, semesterNumber, startTime, endTime } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO timetables (day_of_week, class_id, batch_id, semester_number, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [dayOfWeek, classId, batchId, semesterNumber, startTime, endTime]
    );
    
    // Get the created timetable by combination of unique fields since we can't use insertId with UUIDs
    const [newTimetable] = await pool.execute(
      `SELECT t.*, s.name as subject_name, b.name as batch_name 
       FROM timetables t 
       LEFT JOIN subjects s ON t.class_id = s.id 
       LEFT JOIN batches b ON t.batch_id = b.id 
       WHERE t.day_of_week = ? AND t.class_id = ?
       ORDER BY t.created_at DESC LIMIT 1`,
      [dayOfWeek, classId]
    );
    
    res.status(201).json(newTimetable[0]);
  } catch (error) {
    console.error('Create timetable error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Timetable entry for this class and day already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/timetables/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, classId, batchId, semesterNumber, startTime, endTime } = req.body;
    
    await pool.execute(
      'UPDATE timetables SET day_of_week = ?, class_id = ?, batch_id = ?, semester_number = ?, start_time = ?, end_time = ? WHERE id = ?',
      [dayOfWeek, classId, batchId, semesterNumber, startTime, endTime, id]
    );
    
    const [updatedTimetable] = await pool.execute(
      `SELECT t.*, s.name as subject_name, b.name as batch_name 
       FROM timetables t 
       LEFT JOIN subjects s ON t.class_id = s.id 
       LEFT JOIN batches b ON t.batch_id = b.id 
       WHERE t.id = ?`,
      [id]
    );
    
    if (updatedTimetable.length === 0) {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }
    
    res.json(updatedTimetable[0]);
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/timetables/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM timetables WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Timetable entry not found' });
    }
    
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Feedback Routes
app.get('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const [feedback] = await pool.execute(
      `SELECT f.*, s.name as subject_name, p.first_name, p.last_name, b.name as batch_name 
       FROM feedback f 
       LEFT JOIN subjects s ON f.class_id = s.id 
       LEFT JOIN profiles p ON f.student_id = p.id 
       LEFT JOIN batches b ON f.batch_id = b.id 
       ORDER BY f.created_at DESC`
    );
    
    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const { classId, batchId, semesterNumber, rating, comment, additionalFeedback } = req.body;
    const studentId = req.user.id;
    
    const [result] = await pool.execute(
      'INSERT INTO feedback (student_id, class_id, batch_id, semester_number, rating, comment, additional_feedback) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, classId, batchId, semesterNumber, rating, comment, JSON.stringify(additionalFeedback)]
    );
    
    // Get the created feedback by student, class, and timestamp since we can't use insertId with UUIDs
    const [newFeedback] = await pool.execute(
      `SELECT f.*, s.name as subject_name, p.first_name, p.last_name, b.name as batch_name 
       FROM feedback f 
       LEFT JOIN subjects s ON f.class_id = s.id 
       LEFT JOIN profiles p ON f.student_id = p.id 
       LEFT JOIN batches b ON f.batch_id = b.id 
       WHERE f.student_id = ? AND f.class_id = ?
       ORDER BY f.created_at DESC LIMIT 1`,
      [studentId, classId]
    );
    
    res.status(201).json(newFeedback[0]);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/feedback/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse, isResponseSeenByStudent } = req.body;
    
    await pool.execute(
      'UPDATE feedback SET admin_response = ?, is_response_seen_by_student = ? WHERE id = ?',
      [adminResponse, isResponseSeenByStudent || false, id]
    );
    
    const [updatedFeedback] = await pool.execute(
      `SELECT f.*, s.name as subject_name, p.first_name, p.last_name, b.name as batch_name 
       FROM feedback f 
       LEFT JOIN subjects s ON f.class_id = s.id 
       LEFT JOIN profiles p ON f.student_id = p.id 
       LEFT JOIN batches b ON f.batch_id = b.id 
       WHERE f.id = ?`,
      [id]
    );
    
    if (updatedFeedback.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json(updatedFeedback[0]);
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Feedback Analytics Routes
app.get('/api/feedback/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { timeframe_days = 30, batch_id, semester_number } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe_days));
    
    let whereClause = 'WHERE f.created_at >= ? AND f.created_at <= ?';
    let queryParams = [startDate, endDate];
    
    if (batch_id) {
      whereClause += ' AND f.batch_id = ?';
      queryParams.push(batch_id);
    }
    
    if (semester_number) {
      whereClause += ' AND f.semester_number = ?';
      queryParams.push(semester_number);
    }
    
    const [trends] = await pool.execute(
      `SELECT 
         DATE(f.created_at) as date,
         COUNT(*) as submission_count,
         AVG(f.rating) as average_rating
       FROM feedback f
       ${whereClause}
       GROUP BY DATE(f.created_at)
       ORDER BY date ASC`,
      queryParams
    );
    
    res.json(trends);
  } catch (error) {
    console.error('Get feedback trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/feedback/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { batch_id, semester_number } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let queryParams = [];
    
    if (batch_id) {
      whereClause += ' AND f.batch_id = ?';
      queryParams.push(batch_id);
    }
    
    if (semester_number) {
      whereClause += ' AND f.semester_number = ?';
      queryParams.push(semester_number);
    }
    
    const [analytics] = await pool.execute(
      `SELECT 
         s.id as subject_id,
         s.name as subject_name,
         COUNT(f.id) as feedback_count,
         AVG(f.rating) as average_rating,
         MIN(f.rating) as min_rating,
         MAX(f.rating) as max_rating
       FROM subjects s
       LEFT JOIN feedback f ON s.id = f.class_id
       ${whereClause}
       GROUP BY s.id, s.name
       HAVING COUNT(f.id) > 0
       ORDER BY average_rating DESC`,
      queryParams
    );
    
    res.json(analytics);
  } catch (error) {
    console.error('Get feedback analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Run migrations
    await runMigrations();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
      console.log('🔐 Default admin login: admin@feedback.com / admin123');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();
