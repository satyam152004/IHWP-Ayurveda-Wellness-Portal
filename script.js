// === UTILITY FUNCTIONS ===
function showNotification(message, type = 'success') {
  const notif = document.getElementById('notification');
  notif.textContent = message;
  notif.style.background = type === 'error' ? '#f44336' : '#4caf50';
  notif.style.display = 'block';
  setTimeout(() => notif.style.display = 'none', 3000);
}

function getCurrentUser() {
  const email = localStorage.getItem('loggedInUser');
  const users = JSON.parse(localStorage.getItem('users')) || [];
  return users.find(u => u.email === email);
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function generateWellnessTip() {
  const tips = [
    "Stay hydrated!",
    "Practice deep breathing daily.",
    "Eat seasonal fruits.",
    "Get 7-8 hours of sleep.",
    "Meditate for 10 minutes."
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

// === PAGE SWITCHING ===
function showPage(id) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// === NAVIGATION ===
document.getElementById('goLogin').addEventListener('click', () => showPage('loginPage'));
document.getElementById('goRegister').addEventListener('click', () => showPage('registerPage'));

// === PASSWORD STRENGTH ===
document.getElementById('regPassword').addEventListener('input', (e) => {
  const pass = e.target.value;
  const strength = document.getElementById('passwordStrength');
  if (pass.length < 6) {
    strength.textContent = 'Weak';
    strength.className = 'password-strength weak';
  } else if (pass.length < 10) {
    strength.textContent = 'Medium';
    strength.className = 'password-strength medium';
  } else {
    strength.textContent = 'Strong';
    strength.className = 'password-strength strong';
  }
});

// === REGISTER ===
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPassword').value;
  const users = JSON.parse(localStorage.getItem('users') || '[]');

  if (users.find(u => u.email === email)) {
    document.getElementById('registerMsg').innerText = '⚠️ Email already exists!';
    showNotification('Email already exists!', 'error');
    return;
  }
  if (pass.length < 6) {
    showNotification('Password too weak!', 'error');
    return;
  }

  users.push({ name, email, pass, profile: {}, prakriti: '', followups: [], isAdmin: false });
  saveUsers(users);
  document.getElementById('registerMsg').innerText = '✅ Registered successfully!';
  showNotification('Registered successfully!');
});

// === LOGIN ===
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email && u.pass === pass);

  if (user) {
    localStorage.setItem('loggedInUser', email);
    localStorage.setItem('sessionStart', Date.now());
    document.getElementById('loginMsg').innerText = '✅ Login successful!';
    showPage('portal');
    loadUserData();
  } else {
    document.getElementById('loginMsg').innerText = '❌ Invalid credentials!';
    showNotification('Invalid credentials!', 'error');
  }
});

// === LOGOUT ===
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('sessionStart');
    showPage('loginPage');
  }
});

// === SESSION TIMEOUT (30 minutes) ===
setInterval(() => {
  const sessionStart = localStorage.getItem('sessionStart');
  if (sessionStart && Date.now() - sessionStart > 30 * 60 * 1000) {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('sessionStart');
    showPage('loginPage');
    showNotification('Session expired. Please login again.', 'error');
  }
}, 60000); // Check every minute

// === LOAD USER DATA ===
function loadUserData() {
  const user = getCurrentUser();
  if (!user) return;

  // Welcome message
  document.getElementById('welcomeMsg').textContent = `Welcome, ${user.name || user.profile.name || 'User'}!`;

  // Profile
  if (user.profile.name) {
    document.getElementById('name').value = user.profile.name;
    document.getElementById('age').value = user.profile.age;
    document.getElementById('gender').value = user.profile.gender;
    document.getElementById('healthInfo').value = user.profile.health;
  }

  // Dashboard
  document.getElementById('dashboardPrakriti').textContent = user.prakriti || 'Not analyzed';
  document.getElementById('dashboardFollowups').textContent = user.followups?.length || 0;
  document.getElementById('wellnessTip').textContent = generateWellnessTip();

  // Prakriti
  if (user.prakriti) {
    document.getElementById('prakritiResult').innerText = `🌿 Dominant Prakriti: ${user.prakriti}`;
    showDiet(user.prakriti);
  }

  // Schedule
  loadSchedule();

  // Follow-ups
  displayFollowups();

  // Admin (only if admin)
  if (user.isAdmin) {
    updateAdminPanel();
  } else {
    document.querySelector('[data-tab="admin"]').style.display = 'none';
  }
}

// === TAB SWITCHING ===
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// === SAVE PROFILE ===
document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  user.profile = {
    name: document.getElementById('name').value,
    age: document.getElementById('age').value,
    gender: document.getElementById('gender').value,
    health: document.getElementById('healthInfo').value
  };

  const users = JSON.parse(localStorage.getItem('users'));
  const index = users.findIndex(u => u.email === user.email);
  users[index] = user;
  saveUsers(users);
  document.getElementById('profileMsg').innerText = '✅ Profile saved!';
  showNotification('Profile saved!');
  loadUserData(); // Refresh dashboard
});

// === PRAKRITI ANALYSIS ===
document.getElementById('prakritiForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const answers = [...document.querySelectorAll('#prakritiForm input:checked')].map(a => a.value);
  if (answers.length < 10) {
    showNotification('Answer all questions!', 'error');
    return;
  }

  const count = { Vata: 0, Pitta: 0, Kapha: 0 };
  answers.forEach(a => count[a]++);
  const prakriti = Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
  const percentages = Object.keys(count).map(k => `${k}: ${((count[k] / 10) * 100).toFixed(0)}%`).join(', ');

  const user = getCurrentUser();
  user.prakriti = prakriti;
  const users = JSON.parse(localStorage.getItem('users'));
  const index = users.findIndex(u => u.email === user.email);
  users[index] = user;
  saveUsers(users);

  document.getElementById('prakritiResult').innerText = `🌿 Dominant Prakriti: ${prakriti} (${percentages})`;
  showDiet(prakriti);
  showNotification('Prakriti analyzed!');
  loadUserData(); // Refresh dashboard
});

document.getElementById('resetPrakriti').addEventListener('click', () => {
  document.querySelectorAll('#prakritiForm input').forEach(i => i.checked = false);
  document.getElementById('prakritiResult').innerText = '';
});

// === DIET CHART ===
function showDiet(type) {
  const diets = {
    Vata: [
      { meal: 'Breakfast', items: 'Oatmeal with ghee, bananas', portions: '1 bowl' },
      { meal: 'Lunch', items: 'Rice, lentils, steamed veggies', portions: 'Balanced plate' },
      { meal: 'Dinner', items: 'Soups, warm milk', portions: 'Light' },
      { tips: 'Stay warm, avoid cold foods.' }
    ],
    Pitta: [
      { meal: 'Breakfast', items: 'Cucumber salad, rice', portions: 'Fresh and cool' },
      { meal: 'Lunch', items: 'Coconut water, light grains', portions: 'Moderate' },
      { meal: 'Dinner', items: 'Milk, sweet fruits', portions: 'Calming' },
      { tips: 'Avoid spicy foods, stay cool.' }
    ],
    Kapha: [
      { meal: 'Breakfast', items: 'Ginger tea, light fruits', portions: 'Small' },
      { meal: 'Lunch', items: 'Steamed veggies, lentils', portions: 'Spicy and light' },
      { meal: 'Dinner', items: 'Herbal teas, salads', portions: 'Minimal' },
      { tips: 'Stimulate digestion, avoid heavy foods.' }
    ]
  };
  const plan = diets[type] || [];
  const html = plan.length
    ? `<h3>${type} Diet Plan:</h3><ul>${plan.map(p => `<li><strong>${p.meal}:</strong> ${p.items} (${p.portions})</li>`).join('')}</ul><p><em>${plan[3]?.tips}</em></p>`
    : 'Analyze Prakriti to get diet plan!';
  document.getElementById('dietPlan').innerHTML = html;
}

document.getElementById('regenerateDiet').addEventListener('click', () => {
  const user = getCurrentUser();
  if (user.prakriti) showDiet(user.prakriti);
  else showNotification('Analyze Prakriti first!', 'error');
});

// === SCHEDULE ===
function loadSchedule() {
  const user = getCurrentUser();
  const schedule = user.schedule || [
    '6 AM - Wake Up',
    '7 AM - Yoga',
    '8 AM - Breakfast',
    '12 PM - Lunch',
    '7 PM - Dinner',
    '10 PM - Sleep'
  ];
  document.getElementById('scheduleList').innerHTML = schedule.map(item => `<li>${item}</li>`).join('');
}

document.getElementById('editSchedule').addEventListener('click', () => {
  const user = getCurrentUser();
  const newSchedule = prompt('Edit schedule (comma-separated):', (user.schedule || []).join(', '));
  if (newSchedule) {
    user.schedule = newSchedule.split(',').map(s => s.trim());
    const users = JSON.parse(localStorage.getItem('users'));
    const index = users.findIndex(u => u.email === user.email);
    users[index] = user;
    saveUsers(users);
    loadSchedule();
    showNotification('Schedule updated!');
  }
});

document.getElementById('resetSchedule').addEventListener('click', () => {
  const user = getCurrentUser();
  delete user.schedule;
  const users = JSON.parse(localStorage.getItem('users'));
  const index = users.findIndex(u => u.email === user.email);
  users[index] = user;
  saveUsers(users);
  loadSchedule();
  showNotification('Schedule reset!');
});

// === FOLLOW-UP ===
document.getElementById('addFollowup').addEventListener('click', () => {
  const note = prompt('Enter follow-up note:');
  if (!note) return;

  const user = getCurrentUser();
  user.followups = user.followups || [];
  user.followups.push({ date: new Date().toLocaleString(), note, completed: false });
  const users = JSON.parse(localStorage.getItem('users'));
  const index = users.findIndex(u => u.email === user.email);
  users[index] = user;
  saveUsers(users);
  displayFollowups();
  showNotification('Follow-up added!');
  loadUserData(); // Refresh dashboard
});

function displayFollowups() {
  const user = getCurrentUser();
  const list = document.getElementById('followupList');
  list.innerHTML = (user.followups || []).map((f, i) => `
    <div class="followup-item ${f.completed ? 'completed' : ''}">
      <span>📅 ${f.date} - ${f.note}</span>
      <div>
        <button onclick="toggleComplete(${i})">${f.completed ? 'Undo' : 'Complete'}</button>
        <button onclick="editFollowup(${i})">Edit</button>
        <button onclick="deleteFollowup(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

function toggleComplete(index) {
  const user = getCurrentUser();
  user.followups[index].completed = !user.followups[index].completed;
  const users = JSON.parse(localStorage.getItem('users'));
  const userIndex = users.findIndex(u => u.email === user.email);
  users[userIndex] = user;
  saveUsers(users);
  displayFollowups();
}

function editFollowup(index) {
  const user = getCurrentUser();
  const newNote = prompt('Edit note:', user.followups[index].note);
  if (newNote) {
    user.followups[index].note = newNote;
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.email === user.email);
    users[userIndex] = user;
    saveUsers(users);
    displayFollowups();
  }
}

function deleteFollowup(index) {
  if (confirm('Delete this follow-up?')) {
    const user = getCurrentUser();
    user.followups.splice(index, 1);
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.email === user.email);
    users[userIndex] = user;
    saveUsers(users);
    displayFollowups();
    loadUserData(); // Refresh dashboard
  }
}

// === ADMIN PANEL ===
function updateAdminPanel() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  document.getElementById('adminData').innerHTML = users.map(u => `
    <div class="user-card">
      <h3>${u.name || u.profile.name || 'Unnamed'}</h3>
      <p>Email: ${u.email}</p>
      <p>Age: ${u.profile.age || '-'}</p>
      <p>Gender: ${u.profile.gender || '-'}</p>
      <p>Prakriti: ${u.prakriti || 'Not analyzed'}</p>
      <p>Follow-ups: ${u.followups?.length || 0}</p>
      <button onclick="deleteUser('${u.email}')">Delete User</button>
    </div>
  `).join('');
}

document.getElementById('adminSearch').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('.user-card');
  cards.forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
  });
});

document.getElementById('exportUsers').addEventListener('click', () => {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const csv = 'Name,Email,Age,Gender,Prakriti,Follow-ups\n' +
    users.map(u => `${u.name || u.profile.name || ''},${u.email},${u.profile.age || ''},${u.profile.gender || ''},${u.prakriti || ''},${u.followups?.length || 0}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'users.csv';
  a.click();
  URL.revokeObjectURL(url);
});

function deleteUser(email) {
  if (confirm('Delete this user?')) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const filtered = users.filter(u => u.email !== email);
    saveUsers(filtered);
    updateAdminPanel();
    showNotification('User deleted!');
  }
}

// === FORGOT PASSWORD ===
document.getElementById('goForgotPassword').addEventListener('click', () => showPage('forgotPasswordPage')); // Assuming you add id="goForgotPassword" to the link in HTML
document.getElementById('backToLogin').addEventListener('click', () => showPage('loginPage'));

document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email);

  if (!user) {
    document.getElementById('forgotMsg').innerText = '❌ Email not found!';
    showNotification('Email not found!', 'error');
    return;
  }

  // Prompt for new password (insecure simulation)
  const newPass = prompt('Enter your new password:');
  if (!newPass || newPass.length < 6) {
    showNotification('Password must be at least 6 characters!', 'error');
    return;
  }

  user.pass = newPass;
  saveUsers(users);
  document.getElementById('forgotMsg').innerText = '✅ Password reset successfully! Please login.';
  showNotification('Password reset successfully!');
  showPage('loginPage');
});

// === AUTO-LOGIN CHECK ===
if (localStorage.getItem('loggedInUser')) {
  showPage('portal');
  loadUserData();
}
