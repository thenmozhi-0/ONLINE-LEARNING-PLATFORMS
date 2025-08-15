const API = 'http://localhost:5000/api';
const authSection = document.getElementById('auth-section');
const coursesSection = document.getElementById('courses-section');
const userInfo = document.getElementById('user-info');
const coursesDiv = document.getElementById('courses');
const playerDiv = document.getElementById('player');
const courseTitle = document.getElementById('course-title');
const videoEl = document.getElementById('video');
const quizDiv = document.getElementById('quiz');
const progressDiv = document.getElementById('progress');

let token = localStorage.getItem('token') || null;
let currentCourse = null;

function setUser(name){
  if (token) {
    userInfo.innerHTML = `Hello, ${name} <button class="secondary" onclick="logout()">Logout</button>`;
    authSection.classList.add('hidden');
    coursesSection.classList.remove('hidden');
    loadCourses();
    loadProgress();
  } else {
    userInfo.textContent = '';
  }
}

async function register() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const res = await fetch(`${API}/register`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  alert(data.message || data.error);
}

async function login() {
  const email = document.getElementById('log-email').value;
  const password = document.getElementById('log-password').value;
  const res = await fetch(`${API}/login`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('name', data.name || 'Student');
    setUser(data.name || 'Student');
  } else {
    alert(data.error || 'Login failed');
  }
}

async function loadCourses() {
  const res = await fetch(`${API}/courses`);
  const list = await res.json();
  coursesDiv.innerHTML = '';
  list.forEach(c => {
    const div = document.createElement('div');
    div.className = 'course-card';
    div.innerHTML = `<h3>${c.title}</h3><p>${c.description}</p>
      <button>Open</button>`;
    div.querySelector('button').onclick = () => openCourse(c);
    coursesDiv.appendChild(div);
  });
}

function openCourse(course) {
  currentCourse = course;
  playerDiv.classList.remove('hidden');
  quizDiv.classList.add('hidden');
  courseTitle.textContent = course.title;
  videoEl.src = course.videoUrl;
  document.getElementById('btn-start-quiz').onclick = () => startQuiz(course);
}

async function startQuiz(course) {
  const res = await fetch(`${API}/courses/${course.id}/quiz`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const questions = await res.json();
  quizDiv.classList.remove('hidden');
  quizDiv.innerHTML = '<h3>Quiz</h3>';
  questions.forEach((q, i) => {
    const block = document.createElement('div');
    block.className = 'card';
    block.innerHTML = `<p><strong>Q${i+1}.</strong> ${q.q}</p>` + 
      q.options.map((opt, idx) => `
        <label><input type="radio" name="q${i}" value="${idx}"> ${opt}</label>
      `).join('<br/>');
    quizDiv.appendChild(block);
  });
  const btn = document.createElement('button');
  btn.textContent = 'Submit Quiz';
  btn.onclick = submitQuiz;
  quizDiv.appendChild(btn);
}

async function submitQuiz() {
  const answers = [];
  const blocks = quizDiv.querySelectorAll('[name^="q"]');
  const totalQs = new Set();
  blocks.forEach(inp => totalQs.add(inp.name));
  for (let i = 0; i < totalQs.size; i++) {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    answers.push(selected ? Number(selected.value) : -1);
  }
  const res = await fetch(`${API}/courses/${currentCourse.id}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ answers })
  });
  const data = await res.json();
  alert(`Your score: ${data.score} / ${data.total}`);
  loadProgress();
}

async function loadProgress() {
  const res = await fetch(`${API}/progress`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const p = await res.json();
  const entries = Object.entries(p);
  progressDiv.innerHTML = '<h3>Your Progress</h3>' + 
    (entries.length ? entries.map(([cid, v]) => `<p>${cid}: ${v.score}/${v.total}</p>`).join('') : '<p>No progress yet.</p>');
}

function logout(){
  localStorage.removeItem('token');
  localStorage.removeItem('name');
  token = null;
  location.reload();
}

document.getElementById('btn-register').onclick = register;
document.getElementById('btn-login').onclick = login;

if (token) {
  setUser(localStorage.getItem('name') || 'Student');
}
