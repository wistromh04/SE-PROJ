const form = document.getElementById('workoutForm');
const workoutsDiv = document.getElementById('workouts');

async function loadWorkouts() {
  const res = await fetch('/api/workouts');
  const workouts = await res.json();
  workoutsDiv.innerHTML = '';
  if (workouts.length === 0) {
    workoutsDiv.innerHTML = '<p>No workouts logged yet.</p>';
    return;
  }
  workouts.forEach(w => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <strong>${w.name}</strong> — <span class="muted">${w.date}</span><br/>
      ${w.notes ? `<p>${w.notes}</p>` : ''}
      <button onclick="deleteWorkout(${w.id})">Delete</button>
    `;
    workoutsDiv.appendChild(div);
  });
}

async function deleteWorkout(id) {
  await fetch('/api/workouts/' + id, { method: 'DELETE' });
  loadWorkouts();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('name').value,
    date: document.getElementById('date').value,
    notes: document.getElementById('notes').value
  };
  await fetch('/api/workouts', {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify(data)
  });
  form.reset();
  loadWorkouts();
});

loadWorkouts();
