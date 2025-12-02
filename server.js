//quick edit for commit purposes
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(path.join(__dirname, 'workouts.db'));

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    );
  `);
  
  
  db.run(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER DEFAULT 0,
      reps INTEGER DEFAULT 0,
      weight REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );
  `);
});



app.get('/api/workouts', (req, res) => {
  const sql = `
    SELECT 
      w.*,
      GROUP_CONCAT(e.id || '|' || e.name || '|' || e.sets || '|' || e.reps || '|' || e.weight || '|' || COALESCE(e.notes, '')) as exercises
    FROM workouts w
    LEFT JOIN exercises e ON w.id = e.workout_id
    GROUP BY w.id
    ORDER BY w.date DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    
    const workouts = rows.map(row => {
      const workout = {
        id: row.id,
        name: row.name,
        date: row.date,
        notes: row.notes,
        exercises: []
      };
      
      if (row.exercises) {
        workout.exercises = row.exercises.split(',').map(exerciseStr => {
          const [id, name, sets, reps, weight, notes] = exerciseStr.split('|');
          return {
            id: parseInt(id),
            name,
            sets: parseInt(sets),
            reps: parseInt(reps),
            weight: parseFloat(weight),
            notes: notes || ''
          };
        });
      }
      
      return workout;
    });
    
    res.json(workouts);
  });
});


app.get('/api/workouts/:id', (req, res) => {
  const workoutId = req.params.id;
  
  
  db.get('SELECT * FROM workouts WHERE id = ?', [workoutId], (err, workout) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    
    
    db.all('SELECT * FROM exercises WHERE workout_id = ? ORDER BY id', [workoutId], (err, exercises) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const result = {
        ...workout,
        exercises: exercises || []
      };
      
      res.json(result);
    });
  });
});


app.post('/api/workouts', (req, res) => {
  const { name, date, notes, exercises } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'name and date required' });

  db.run('INSERT INTO workouts (name, date, notes) VALUES (?, ?, ?)', 
    [name, date, notes || ''], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const workoutId = this.lastID;
      
      
      if (exercises && exercises.length > 0) {
        insertExercises(workoutId, exercises, (err) => {
          if (err) return res.status(500).json({ error: err.message });
          
          
          db.get('SELECT * FROM workouts WHERE id = ?', [workoutId], (err, workout) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.all('SELECT * FROM exercises WHERE workout_id = ?', [workoutId], (err, exs) => {
              if (err) return res.status(500).json({ error: err.message });
              
              res.status(201).json({
                ...workout,
                exercises: exs || []
              });
            });
          });
        });
      } else {
        
        db.get('SELECT * FROM workouts WHERE id = ?', [workoutId], (err, workout) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({
            ...workout,
            exercises: []
          });
        });
      }
  });
});


function insertExercises(workoutId, exercises, callback) {
  const stmt = db.prepare('INSERT INTO exercises (workout_id, name, sets, reps, weight, notes) VALUES (?, ?, ?, ?, ?, ?)');
  
  let completed = 0;
  const total = exercises.length;
  
  if (total === 0) return callback(null);
  
  exercises.forEach(exercise => {
    stmt.run(
      workoutId,
      exercise.name || '',
      exercise.sets || 0,
      exercise.reps || 0,
      exercise.weight || 0,
      exercise.notes || '',
      function(err) {
        if (err) return callback(err);
        completed++;
        if (completed === total) {
          stmt.finalize();
          callback(null);
        }
      }
    );
  });
}


app.put('/api/workouts/:id', (req, res) => {
  const workoutId = req.params.id;
  const { name, date, notes, exercises } = req.body;
  
  if (!name || !date) return res.status(400).json({ error: 'name and date required' });
  
  db.run('UPDATE workouts SET name = ?, date = ?, notes = ? WHERE id = ?',
    [name, date, notes || '', workoutId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      
      db.run('DELETE FROM exercises WHERE workout_id = ?', [workoutId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (exercises && exercises.length > 0) {
          insertExercises(workoutId, exercises, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            
            getCompleteWorkout(workoutId, res);
          });
        } else {
          getCompleteWorkout(workoutId, res);
        }
      });
    }
  );
});


function getCompleteWorkout(workoutId, res) {
  db.get('SELECT * FROM workouts WHERE id = ?', [workoutId], (err, workout) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all('SELECT * FROM exercises WHERE workout_id = ?', [workoutId], (err, exercises) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        ...workout,
        exercises: exercises || []
      });
    });
  });
}


app.delete('/api/workouts/:id', (req, res) => {
  db.run('DELETE FROM workouts WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: this.changes > 0 });
  });
});


app.get('/api/exercises', (req, res) => {
  db.all(`
    SELECT e.*, w.date as workout_date, w.name as workout_name 
    FROM exercises e
    JOIN workouts w ON e.workout_id = w.id
    ORDER BY w.date DESC, e.name
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


app.get('/api/exercises/history/:name', (req, res) => {
  const exerciseName = req.params.name;
  
  db.all(`
    SELECT e.*, w.date as workout_date, w.name as workout_name 
    FROM exercises e
    JOIN workouts w ON e.workout_id = w.id
    WHERE e.name LIKE ?
    ORDER BY w.date DESC
  `, [`%${exerciseName}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
