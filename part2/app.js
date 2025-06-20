const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session');

const app = express();

app.use(session ({
    secret: 'IBdsfuahsd1213',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}));


// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);


app.get('/api/dogs', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});


// Export the app instead of listening here
module.exports = app;