# Workout Tracker with Exercises

A full-featured workout tracking application with SQLite database that allows you to log workouts and detailed exercises within each workout.

## Features

- ✅ **Create, Read, Update, Delete workouts**
- ✅ **Log exercises within each workout**
- ✅ **Track sets, reps, and weights per exercise**
- ✅ **Add notes to workouts and exercises**
- ✅ **Clean, modern UI with gradient design**
- ✅ **Responsive layout for mobile devices**
- ✅ **Real-time updates without page refresh**
- ✅ **Exercise history tracking**

## Database Schema

### Workouts Table
id: INTEGER PRIMARY KEY AUTOINCREMENT
name: TEXT NOT NULL
date: TEXT NOT NULL
notes: TEXT

### Exercises Table
id: INTEGER PRIMARY KEY AUTOINCREMENT
workout_id: INTEGER NOT NULL (foreign key to workouts.id)
name: TEXT NOT NULL
sets: INTEGER DEFAULT 0
reps: INTEGER DEFAULT 0
weight: REAL DEFAULT 0
notes: TEXT

## Installation
1. Clone or download the project
2. Install dependencies:
    ......
   npm install
3. npm start in terminal 
4. go to http://localhost:3000

## Usage
### Adding a Workout
    Enter workout name and date
    Add optional notes
    Click "Add Exercise" to add exercises
    For each exercise, enter:
    Exercise name (e.g., "Bench Press")
    Number of sets
    Number of reps per set
    Weight used (in kg)
    Optional notes
    Click "Save Workout"