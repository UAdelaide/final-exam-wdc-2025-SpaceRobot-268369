var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();


const dbConfig = {
    database: 'DogWalkService',
    user: 'root',
    password: ''
};


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);



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


app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT
        wr.request_id,
        d.name AS dog_name,
        wr.requested_time,
        wr.duration_minutes,
        wr.location,
        u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    // console.error('Error in /api/walkrequests/open:', err);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});


app.get('/api/walkers/summary', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(r.rating_id) AS total_ratings,
        ROUND(AVG(r.rating), 1) AS average_rating,
        COUNT(DISTINCT wr.request_id) AS completed_walks
      FROM Users u
      LEFT JOIN WalkApplications wa ON u.user_id = wa.walker_id
      LEFT JOIN WalkRequests wr ON wa.request_id = wr.request_id AND wr.status = 'completed'
      LEFT JOIN Ratings r ON wr.request_id = r.request_id AND r.walker_id = u.user_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    // console.error('Error in /api/walkers/summary:', err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});


module.exports = app;
