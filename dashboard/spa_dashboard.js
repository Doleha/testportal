// Combined JavaScript for SPA Dashboard

// ===== DYNAMIC VIEW ROUTING =====
function showView(viewId) {
  // Hide all sections first
  ['homeSection', 'testSection', 'reportSection', 'settingsSection', 'resultSection'].forEach(id => {
    document.getElementById(id).style.display = (id === viewId) ? 'block' : 'none';
  });
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Find and activate the corresponding nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(viewId)) {
      link.classList.add('active');
    }
  });
  
  // Save current view to localStorage for persistence
  localStorage.setItem('currentView', viewId);
  
  // Perform any additional actions needed when switching to specific views
  if (viewId === 'reportSection') {
    loadReports();
  } else if (viewId === 'settingsSection') {
    loadSettings();
  }
}

// Restore last active view on page load
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');
  const lastView = localStorage.getItem('currentView');
  
  if (!token) {
    window.location.href = '/testportal/login.html';
    return;
  }
  
  if (userName) {
    document.getElementById('userName').textContent = userName;
  }
  
  // Show last active view or default to home
  if (lastView && document.getElementById(lastView)) {
    showView(lastView);
  } else {
    showView('homeSection');
  }
  
  // Check for existing test in progress
  const timeRemaining = localStorage.getItem('testTimeRemaining');
  const timerPaused = localStorage.getItem('timerPaused');
  
  if (timeRemaining && parseInt(timeRemaining) > 0) {
    // There's an existing test in progress
    const resumeTest = confirm('You have an unfinished test. Would you like to resume?');
    
    if (resumeTest) {
      // Load saved answers and questions
      loadSavedTest();
      
      // Resume timer if it wasn't paused
      if (timerPaused !== 'true') {
        resumeTimer();
      }
      
      // Show test section
      showView('testSection');
    } else {
      // Clear test data if user doesn't want to resume
      clearTestData();
    }
  }
});

// Direct navigation functions for better user experience
function goToHome() {
  showView('homeSection');
}

function goToTest() {
  showView('testSection');
}

function goToReports() {
  showView('reportSection');
}

function goToSettings() {
  showView('settingsSection');
}

// Handle browser back button
window.addEventListener('popstate', function(event) {
  const lastView = localStorage.getItem('currentView') || 'homeSection';
  showView(lastView);
});

// ===== TEST TIMER =====
let timerInterval;

function startTimer(seconds) {
  clearInterval(timerInterval);
  const display = document.getElementById('timer');
  let timeLeft = seconds;
  
  // Update timer display immediately
  updateTimerDisplay(timeLeft, display);
  
  timerInterval = setInterval(() => {
    timeLeft--;
    
    // Update the display
    updateTimerDisplay(timeLeft, display);
    
    // Save remaining time to localStorage for persistence
    localStorage.setItem('testTimeRemaining', timeLeft);
    
    // Check if time is up
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert('Time is up! Submitting your test...');
      submitAnswers();
    }
  }, 1000);
}

function updateTimerDisplay(timeLeft, display) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  display.textContent = `Time left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Change color based on time remaining
  if (timeLeft <= 60) { // Last minute
    display.classList.remove('bg-primary', 'bg-warning');
    display.classList.add('bg-danger');
  } else if (timeLeft <= 300) { // Last 5 minutes
    display.classList.remove('bg-primary', 'bg-danger');
    display.classList.add('bg-warning');
  } else {
    display.classList.remove('bg-warning', 'bg-danger');
    display.classList.add('bg-primary');
  }
}

function pauseTimer() {
  clearInterval(timerInterval);
  localStorage.setItem('timerPaused', 'true');
}

function resumeTimer() {
  const timeRemaining = parseInt(localStorage.getItem('testTimeRemaining') || '0');
  if (timeRemaining > 0) {
    startTimer(timeRemaining);
    localStorage.setItem('timerPaused', 'false');
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  localStorage.removeItem('testTimeRemaining');
  localStorage.removeItem('timerPaused');
  
  const display = document.getElementById('timer');
  display.textContent = 'Time left: 00:00';
  display.classList.remove('bg-warning', 'bg-danger');
  display.classList.add('bg-primary');
}

function clearTestData() {
  clearAnswers();
  resetTimer();
  localStorage.removeItem('testTimeRemaining');
  localStorage.removeItem('timerPaused');
}

// Handle page visibility changes to pause/resume timer
document.addEventListener('visibilitychange', function() {
  const timeRemaining = localStorage.getItem('testTimeRemaining');
  
  if (timeRemaining && parseInt(timeRemaining) > 0) {
    if (document.hidden) {
      // Page is hidden, pause the timer
      pauseTimer();
    } else {
      // Page is visible again, resume the timer
      resumeTimer();
    }
  }
});

// ===== QUESTION RENDERING AND ANSWER SAVING =====
// Render questions in the test container
function renderQuestions(questions) {
  const container = document.getElementById('questionContainer');
  container.innerHTML = '';
  
  // Store questions in localStorage for persistence
  localStorage.setItem('testQuestions', JSON.stringify(questions));
  
  questions.forEach((q, index) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'card mb-3';
    qDiv.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>Question ${index + 1}</h5>
        <span class="badge bg-secondary question-status" id="status_q${index}">Unanswered</span>
      </div>
      <div class="card-body">
        <p>${q.text}</p>
        <div class="options">
          ${q.options.map(opt => `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="q${index}" id="q${index}_${opt.replace(/\s+/g, '_')}" value="${opt}" onchange="saveAnswer(${index}, '${opt.replace(/'/g, "\\'")}')">
              <label class="form-check-label" for="q${index}_${opt.replace(/\s+/g, '_')}">${opt}</label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(qDiv);
  });
  
  // Load any saved answers
  loadSavedAnswers();
  
  // Add question navigation
  addQuestionNavigation(questions.length);
}

// Add question navigation for easier movement between questions
function addQuestionNavigation(questionCount) {
  const container = document.getElementById('questionContainer');
  
  const navDiv = document.createElement('div');
  navDiv.className = 'card mt-4 mb-3';
  navDiv.innerHTML = `
    <div class="card-header">
      <h5>Question Navigator</h5>
    </div>
    <div class="card-body">
      <div class="d-flex flex-wrap justify-content-center gap-2" id="questionNav">
        ${Array.from({length: questionCount}, (_, i) => `
          <button class="btn btn-outline-primary question-nav-btn" data-question="${i}" onclick="scrollToQuestion(${i})">
            ${i + 1}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  container.appendChild(navDiv);
}

// Scroll to specific question
function scrollToQuestion(index) {
  const questionCards = document.querySelectorAll('#questionContainer .card');
  if (questionCards[index]) {
    questionCards[index].scrollIntoView({ behavior: 'smooth' });
  }
}

// Save answer to localStorage
function saveAnswer(index, value) {
  let answers = JSON.parse(localStorage.getItem('answers') || '{}');
  answers[`q${index}`] = value;
  localStorage.setItem('answers', JSON.stringify(answers));
  
  // Update question status
  updateQuestionStatus(index, 'Answered');
  
  // Update navigation button
  updateNavButton(index, true);
  
  // Update progress
  updateAnswerProgress();
}

// Update the status badge for a question
function updateQuestionStatus(index, status) {
  const statusBadge = document.getElementById(`status_q${index}`);
  if (statusBadge) {
    statusBadge.textContent = status;
    statusBadge.className = `badge ${status === 'Answered' ? 'bg-success' : 'bg-secondary'} question-status`;
  }
}

// Update navigation button to show answered status
function updateNavButton(index, answered) {
  const navBtn = document.querySelector(`.question-nav-btn[data-question="${index}"]`);
  if (navBtn) {
    if (answered) {
      navBtn.classList.remove('btn-outline-primary');
      navBtn.classList.add('btn-success');
    } else {
      navBtn.classList.remove('btn-success');
      navBtn.classList.add('btn-outline-primary');
    }
  }
}

// Update overall progress indicator
function updateAnswerProgress() {
  const answers = JSON.parse(localStorage.getItem('answers') || '{}');
  const questions = JSON.parse(localStorage.getItem('testQuestions') || '[]');
  
  if (questions.length === 0) return;
  
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);
  
  // Add progress bar if it doesn't exist
  let progressBar = document.getElementById('answerProgressBar');
  if (!progressBar) {
    const testHeader = document.querySelector('.test-header');
    if (testHeader) {
      const progressDiv = document.createElement('div');
      progressDiv.className = 'w-100 mt-2';
      progressDiv.innerHTML = `
        <div class="progress">
          <div id="answerProgressBar" class="progress-bar" role="progressbar" style="width: ${progressPercent}%;" 
               aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
            ${progressPercent}% Complete
          </div>
        </div>
      `;
      testHeader.insertAdjacentElement('afterend', progressDiv);
    }
  } else {
    // Update existing progress bar
    progressBar.style.width = `${progressPercent}%`;
    progressBar.setAttribute('aria-valuenow', progressPercent);
    progressBar.textContent = `${progressPercent}% Complete`;
  }
}

// Load saved answers from localStorage
function loadSavedAnswers() {
  const answers = JSON.parse(localStorage.getItem('answers') || '{}');
  
  Object.keys(answers).forEach(key => {
    const index = key.substring(1); // Remove 'q' prefix
    const value = answers[key];
    const input = document.querySelector(`input[name="q${index}"][value="${value}"]`);
    
    if (input) {
      input.checked = true;
      updateQuestionStatus(index, 'Answered');
      updateNavButton(index, true);
    }
  });
  
  // Update overall progress
  updateAnswerProgress();
}

// Clear all answers
function clearAnswers() {
  localStorage.removeItem('answers');
  localStorage.removeItem('testQuestions');
  
  // Reset all radio buttons
  document.querySelectorAll('input[type="radio"]').forEach(input => {
    input.checked = false;
  });
  
  // Reset all status badges
  document.querySelectorAll('.question-status').forEach(badge => {
    badge.textContent = 'Unanswered';
    badge.className = 'badge bg-secondary question-status';
  });
  
  // Reset all nav buttons
  document.querySelectorAll('.question-nav-btn').forEach(btn => {
    btn.classList.remove('btn-success');
    btn.classList.add('btn-outline-primary');
  });
  
  // Reset progress bar
  const progressBar = document.getElementById('answerProgressBar');
  if (progressBar) {
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', 0);
    progressBar.textContent = '0% Complete';
  }
}

function loadSavedTest() {
  // This would normally load questions from localStorage or API
  // For demo purposes, we'll use sample questions
  const sampleQuestions = [
    {
      text: "What is the value of x in the equation 2x + 5 = 13?",
      options: ["x = 3", "x = 4", "x = 5", "x = 6"]
    },
    {
      text: "Which of the following is a prime number?",
      options: ["15", "21", "29", "33"]
    },
    {
      text: "If a triangle has sides of length 3, 4, and 5, what type of triangle is it?",
      options: ["Equilateral", "Isosceles", "Scalene", "Right"]
    },
    {
      text: "What is the area of a circle with radius 4 units?",
      options: ["16π square units", "8π square units", "4π square units", "12π square units"]
    },
    {
      text: "Simplify the expression: 3(2x - 4) + 5",
      options: ["6x - 7", "6x - 12 + 5", "6x - 7 + 5", "6x - 12"]
    }
  ];
  
  renderQuestions(sampleQuestions);
  loadSavedAnswers();
}

// Submit answers to the server
function submitAnswers() {
  const answers = JSON.parse(localStorage.getItem('answers') || '{}');
  const questions = JSON.parse(localStorage.getItem('testQuestions') || '[]');
  
  // Check if all questions are answered
  if (Object.keys(answers).length < questions.length) {
    const unansweredCount = questions.length - Object.keys(answers).length;
    const confirmSubmit = confirm(`You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`);
    
    if (!confirmSubmit) {
      return;
    }
  }
  
  showLoading();
  
  // For demo purposes, we'll simulate a response
  setTimeout(() => {
    hideLoading();
    clearInterval(timerInterval);
    
    const sampleResult = {
      score: "85%",
      correct: 4,
      incorrect: 1,
      feedback: "Great job! You've mastered basic algebra concepts.",
      answers: answers
    };
    
    // Clear test data
    clearTestData();
    
    // Display results
    displayTestResults(sampleResult);
  }, 1500);
  
  // In a real implementation, use the fetch API:
  /*
  fetch('http://localhost:5678/webhook/frontend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'submit_test',
      params: {
        student_id: localStorage.getItem('userId'),
        answers: answers
      }
    })
  })
  .then(res => res.json())
  .then(data => {
    hideLoading();
    clearInterval(timerInterval);
    clearTestData();
    displayTestResults(data);
  })
  .catch(err => {
    hideLoading();
    console.error('Error:', err);
    alert('Failed to submit test. Please try again.');
  });
  */
}

// Display test results in a more visual format
function displayTestResults(results) {
  const resultContainer = document.getElementById('resultContainer');
  
  resultContainer.innerHTML = `
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h4>Test Results</h4>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6 text-center mb-4">
            <div class="display-1 fw-bold text-primary">${results.score}</div>
            <p class="lead">Your Score</p>
          </div>
          <div class="col-md-6">
            <div class="d-flex justify-content-center">
              <div class="pie-chart" style="--percentage: ${parseInt(results.score)}; --color: #4e4376;">
                <span class="pie-chart-text">${results.score}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row mt-4">
          <div class="col-md-6">
            <div class="card bg-light">
              <div class="card-body text-center">
                <h5 class="text-success">${results.correct}</h5>
                <p>Correct Answers</p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card bg-light">
              <div class="card-body text-center">
                <h5 class="text-danger">${results.incorrect}</h5>
                <p>Incorrect Answers</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="alert alert-info mt-4">
          <h5>Feedback</h5>
          <p>${results.feedback}</p>
        </div>
        
        <div class="d-flex justify-content-between mt-4">
          <button class="btn btn-secondary" onclick="showView('homeSection')">Return to Dashboard</button>
          <button class="btn btn-primary" onclick="showView('reportSection'); loadReports();">View Full Report</button>
        </div>
      </div>
    </div>
  `;
  
  // Add CSS for pie chart
  const style = document.createElement('style');
  style.textContent = `
    .pie-chart {
      position: relative;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: conic-gradient(var(--color) calc(var(--percentage) * 1%), #f0f0f0 0);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .pie-chart::before {
      content: '';
      position: absolute;
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: white;
    }
    
    .pie-chart-text {
      position: relative;
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--color);
    }
  `;
  document.head.appendChild(style);
  
  showView('resultSection');
}

// ===== REPORT AND SETTINGS SECTIONS =====

// Load reports from the server
function loadReports() {
  showLoading();
  
  // For demo purposes, we'll simulate a response
  setTimeout(() => {
    hideLoading();
    
    const sampleReport = {
      overall_score: "78%",
      tests_taken: 5,
      subject_performance: {
        "Math": "85%",
        "Science": "72%",
        "English": "80%"
      },
      recent_tests: [
        {
          date: "2025-03-25",
          subject: "Math",
          score: "85%"
        },
        {
          date: "2025-03-20",
          subject: "Science",
          score: "72%"
        },
        {
          date: "2025-03-15",
          subject: "English",
          score: "80%"
        },
        {
          date: "2025-03-10",
          subject: "Math",
          score: "75%"
        }
      ],
      improvement_areas: [
        "Algebraic Equations",
        "Scientific Notation",
        "Grammar Rules"
      ]
    };
    
    renderReportDashboard(sampleReport);
  }, 1500);
  
  // In a real implementation, use the fetch API:
  /*
  fetch('http://localhost:5678/webhook/frontend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'view_report',
      params: { student_id: localStorage.getItem('userId') }
    })
  })
  .then(res => res.json())
  .then(data => {
    hideLoading();
    renderReportDashboard(data);
  })
  .catch(err => {
    hideLoading();
    console.error('Error:', err);
    alert('Failed to load reports. Please try again.');
  });
  */
}

// Render the report dashboard with visualizations
function renderReportDashboard(report) {
  const reportContainer = document.getElementById('reportContainer');
  
  reportContainer.innerHTML = `
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header bg-primary text-white">
            <h5>Performance Summary</h5>
          </div>
          <div class="card-body">
            <div class="text-center mb-4">
              <div class="display-4 fw-bold text-primary">${report.overall_score}</div>
              <p class="lead">Overall Score</p>
            </div>
            <div class="d-flex justify-content-between">
              <div class="text-center">
                <h5>${report.tests_taken}</h5>
                <p>Tests Taken</p>
              </div>
              <div class="text-center">
                <h5>${Object.keys(report.subject_performance).length}</h5>
                <p>Subjects</p>
              </div>
              <div class="text-center">
                <h5>${report.improvement_areas.length}</h5>
                <p>Areas to Improve</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 mb-4">
        <div class="card h-100">
          <div class="card-header bg-primary text-white">
            <h5>Subject Performance</h5>
          </div>
          <div class="card-body">
            <ul class="list-group">
              ${Object.entries(report.subject_performance).map(([subject, score]) => 
                `<li class="list-group-item">
                  <div class="d-flex justify-content-between align-items-center">
                    <span>${subject}</span>
                    <span class="badge bg-primary rounded-pill">${score}</span>
                  </div>
                  <div class="progress mt-2" style="height: 10px;">
                    <div class="progress-bar" role="progressbar" style="width: ${parseInt(score)}%;" 
                         aria-valuenow="${parseInt(score)}" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </li>`
              ).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-8 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5>Recent Tests</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.recent_tests.map((test, index) => 
                    `<tr>
                      <td>${test.date}</td>
                      <td>${test.subject}</td>
                      <td>
                        <div class="progress" style="height: 20px;">
                          <div class="progress-bar" role="progressbar" style="width: ${parseInt(test.score)}%;" 
                               aria-valuenow="${parseInt(test.score)}" aria-valuemin="0" aria-valuemax="100">
                            ${test.score}
                          </div>
                        </div>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewTestDetails(${index})">
                          View Details
                        </button>
                      </td>
                    </tr>`
                  ).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-4 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5>Areas to Improve</h5>
          </div>
          <div class="card-body">
            <ul class="list-group">
              ${report.improvement_areas.map(area => 
                `<li class="list-group-item d-flex justify-content-between align-items-center">
                  ${area}
                  <button class="btn btn-sm btn-outline-primary" onclick="practiceArea('${area}')">
                    Practice
                  </button>
                </li>`
              ).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-12 mb-4">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5>Performance Trend</h5>
          </div>
          <div class="card-body">
            <div id="performanceChart" style="height: 300px;">
              <!-- This would be a chart in a real implementation -->
              <div class="alert alert-info">
                <p>In a real implementation, this would be a line chart showing your performance trend over time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// View details of a specific test
function viewTestDetails(testIndex) {
  alert(`Viewing details for test ${testIndex + 1}. In a real implementation, this would show question-by-question breakdown.`);
}

// Practice a specific area
function practiceArea(area) {
  alert(`Starting practice session for ${area}. In a real implementation, this would generate practice questions.`);
}

// Load settings from the server
function loadSettings() {
  showLoading();
  
  // For demo purposes, we'll simulate a response
  setTimeout(() => {
    hideLoading();
    
    const sampleSettings = {
      grade_level: "9",
      subject: "Math",
      test_duration: "30 minutes",
      notifications_enabled: true,
      theme: "default",
      accessibility: {
        font_size: "medium",
        high_contrast: false
      }
    };
    
    renderCurrentSettings(sampleSettings);
    populateSettingsForm(sampleSettings);
  }, 1500);
  
  // In a real implementation, use the fetch API:
  /*
  fetch('http://localhost:5678/webhook/frontend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'fetch_settings',
      params: { student_id: localStorage.getItem('userId') }
    })
  })
  .then(res => res.json())
  .then(data => {
    hideLoading();
    renderCurrentSettings(data);
    populateSettingsForm(data);
  })
  .catch(err => {
    hideLoading();
    console.error('Error:', err);
    alert('Failed to load settings. Please try again.');
  });
  */
}

// Render current settings in a user-friendly format
function renderCurrentSettings(settings) {
  const currentSettings = document.getElementById('currentSettings');
  
  currentSettings.innerHTML = `
    <div class="card mb-4">
      <div class="card-header bg-primary text-white">
        <h5>Current Settings</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h6>Academic Settings</h6>
            <ul class="list-group mb-3">
              <li class="list-group-item d-flex justify-content-between">
                <span>Grade Level:</span>
                <span class="badge bg-primary rounded-pill">${settings.grade_level}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>Preferred Subject:</span>
                <span class="badge bg-primary rounded-pill">${settings.subject}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>Test Duration:</span>
                <span class="badge bg-primary rounded-pill">${settings.test_duration}</span>
              </li>
            </ul>
          </div>
          
          <div class="col-md-6">
            <h6>Application Settings</h6>
            <ul class="list-group mb-3">
              <li class="list-group-item d-flex justify-content-between">
                <span>Notifications:</span>
                <span class="badge ${settings.notifications_enabled ? 'bg-success' : 'bg-secondary'} rounded-pill">
                  ${settings.notifications_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>Theme:</span>
                <span class="badge bg-primary rounded-pill">${settings.theme}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>Font Size:</span>
                <span class="badge bg-primary rounded-pill">${settings.accessibility.font_size}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between">
                <span>High Contrast:</span>
                <span class="badge ${settings.accessibility.high_contrast ? 'bg-success' : 'bg-secondary'} rounded-pill">
                  ${settings.accessibility.high_contrast ? 'Enabled' : 'Disabled'}
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <button class="btn btn-primary" onclick="showSettingsForm()">Update Settings</button>
      </div>
    </div>
  `;
}

// Populate the settings form with current values
function populateSettingsForm(settings) {
  // Ensure the form exists
  if (!document.getElementById('updateSettingsForm')) {
    createSettingsForm();
  }
  
  // Set form values
  document.getElementById('gradeLevel').value = settings.grade_level;
  document.getElementById('subject').value = settings.subject;
  document.getElementById('testDuration').value = settings.test_duration.split(' ')[0]; // Extract number from "30 minutes"
  document.getElementById('notifications').checked = settings.notifications_enabled;
  document.getElementById('theme').value = settings.theme;
  document.getElementById('fontSize').value = settings.accessibility.font_size;
  document.getElementById('highContrast').checked = settings.accessibility.high_contrast;
}

// Create the settings form if it doesn't exist
function createSettingsForm() {
  const settingsSection = document.getElementById('settingsSection');
  const formDiv = document.getElementById('settingsForm') || document.createElement('div');
  
  formDiv.id = 'settingsForm';
  formDiv.style.display = 'none';
  
  formDiv.innerHTML = `
    <div class="card mb-4">
      <div class="card-header bg-primary text-white">
        <h5>Update Your Settings</h5>
      </div>
      <div class="card-body">
        <form id="updateSettingsForm">
          <div class="row">
            <div class="col-md-6">
              <h6>Academic Settings</h6>
              
              <div class="mb-3">
                <label for="gradeLevel" class="form-label">Grade Level</label>
                <select class="form-select" id="gradeLevel">
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="subject" class="form-label">Preferred Subject</label>
                <select class="form-select" id="subject">
                  <option value="Math">Math</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="testDuration" class="form-label">Test Duration (minutes)</label>
                <select class="form-select" id="testDuration">
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                </select>
              </div>
            </div>
            
            <div class="col-md-6">
              <h6>Application Settings</h6>
              
              <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="notifications">
                <label class="form-check-label" for="notifications">Enable Notifications</label>
              </div>
              
              <div class="mb-3">
                <label for="theme" class="form-label">Theme</label>
                <select class="form-select" id="theme">
                  <option value="default">Default</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="colorful">Colorful</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="fontSize" class="form-label">Font Size</label>
                <select class="form-select" id="fontSize">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              
              <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="highContrast">
                <label class="form-check-label" for="highContrast">High Contrast Mode</label>
              </div>
            </div>
          </div>
          
          <div class="d-flex justify-content-between mt-3">
            <button type="button" class="btn btn-secondary" onclick="cancelSettingsUpdate()">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  if (!document.getElementById('settingsForm')) {
    settingsSection.appendChild(formDiv);
  }
}

// Show the settings form
function showSettingsForm() {
  document.getElementById('settingsForm').style.display = 'block';
  document.getElementById('settingsForm').scrollIntoView({ behavior: 'smooth' });
}

// Cancel settings update
function cancelSettingsUpdate() {
  document.getElementById('settingsForm').style.display = 'none';
}

// Save settings to the server
function saveSettings() {
  const settings = {
    grade_level: document.getElementById('gradeLevel').value,
    subject: document.getElementById('subject').value,
    test_duration: document.getElementById('testDuration').value + " minutes",
    notifications_enabled: document.getElementById('notifications').checked,
    theme: document.getElementById('theme').value,
    accessibility: {
      font_size: document.getElementById('fontSize').value,
      high_contrast: document.getElementById('highContrast').checked
    }
  };
  
  showLoading();
  
  // For demo purposes, we'll simulate a response
  setTimeout(() => {
    hideLoading();
    document.getElementById('settingsForm').style.display = 'none';
    
    // Apply theme changes immediately if applicable
    applyThemeSettings(settings);
    
    // Refresh the current settings display
    renderCurrentSettings(settings);
    
    // Show success message
    showSettingsUpdateSuccess();
  }, 1500);
  
  // In a real implementation, use the fetch API:
  /*
  fetch('http://localhost:5678/webhook/frontend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update_settings',
      params: {
        student_id: localStorage.getItem('userId'),
        settings: settings
      }
    })
  })
  .then(res => res.json())
  .then(data => {
    hideLoading();
    document.getElementById('settingsForm').style.display = 'none';
    
    // Apply theme changes immediately if applicable
    applyThemeSettings(settings);
    
    // Refresh the current settings display
    renderCurrentSettings(data);
    
    // Show success message
    showSettingsUpdateSuccess();
  })
  .catch(err => {
    hideLoading();
    console.error('Error:', err);
    alert('Failed to update settings. Please try again.');
  });
  */
}

// Apply theme settings immediately
function applyThemeSettings(settings) {
  // Apply font size
  const fontSize = settings.accessibility.font_size;
  document.documentElement.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
  
  // Apply high contrast if enabled
  if (settings.accessibility.high_contrast) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
  
  // Apply theme
  document.body.className = ''; // Clear existing themes
  document.body.classList.add(`theme-${settings.theme}`);
  
  // Add CSS for themes if not already present
  if (!document.getElementById('theme-styles')) {
    const style = document.createElement('style');
    style.id = 'theme-styles';
    style.textContent = `
      .theme-dark {
        background: #121212 !important;
        color: #f0f0f0 !important;
      }
      
      .theme-dark .dashboard-container {
        background-color: #1e1e1e !important;
        color: #f0f0f0 !important;
      }
      
      .theme-dark .card {
        background-color: #2d2d2d !important;
        color: #f0f0f0 !important;
      }
      
      .theme-dark .action-card {
        background-color: #2d2d2d !important;
      }
      
      .theme-light {
        background: #f8f9fa !important;
      }
      
      .theme-colorful {
        background: linear-gradient(to right, #ff758c, #ff7eb3) !important;
      }
      
      .high-contrast {
        filter: contrast(1.5);
      }
    `;
    document.head.appendChild(style);
  }
}

// Show success message after settings update
function showSettingsUpdateSuccess() {
  const currentSettings = document.getElementById('currentSettings');
  const successAlert = document.createElement('div');
  
  successAlert.className = 'alert alert-success alert-dismissible fade show mt-3';
  successAlert.innerHTML = `
    <strong>Success!</strong> Your settings have been updated.
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  currentSettings.insertAdjacentElement('afterend', successAlert);
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    successAlert.classList.remove('show');
    setTimeout(() => successAlert.remove(), 300);
  }, 3000);
}

// ===== UTILITY FUNCTIONS =====
function showLoading() {
  document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoading() {
  document.getElementById('loadingSpinner').style.display = 'none';
}

// Prepare test with sample questions
function prepareTest() {
  showLoading();
  
  // For demo purposes, we'll create sample questions
  // In a real implementation, this would come from the API
  const sampleQuestions = [
    {
      text: "What is the value of x in the equation 2x + 5 = 13?",
      options: ["x = 3", "x = 4", "x = 5", "x = 6"]
    },
    {
      text: "Which of the following is a prime number?",
      options: ["15", "21", "29", "33"]
    },
    {
      text: "If a triangle has sides of length 3, 4, and 5, what type of triangle is it?",
      options: ["Equilateral", "Isosceles", "Scalene", "Right"]
    },
    {
      text: "What is the area of a circle with radius 4 units?",
      options: ["16π square units", "8π square units", "4π square units", "12π square units"]
    },
    {
      text: "Simplify the expression: 3(2x - 4) + 5",
      options: ["6x - 7", "6x - 12 + 5", "6x - 7 + 5", "6x - 12"]
    }
  ];
  
  // Simulate API call
  setTimeout(() => {
    hideLoading();
    
    // Clear any previous answers
    clearAnswers();
    
    // Render questions
    renderQuestions(sampleQuestions);
    
    // Start timer (5 minutes for demo)
    startTimer(5 * 60);
    
    // Show test section
    showView('testSection');
  }, 1500);
  
  // In a real implementation, use the fetch API:
  /*
  fetch('http://localhost:5678/webhook/frontend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'start_test',
      params: { student_id: localStorage.getItem('userId') }
    })
  })
  .then(res => res.json())
  .then(data => {
    hideLoading();
    
    // Clear any previous answers
    clearAnswers();
    
    // Render questions
    renderQuestions(data.questions);
    
    // Start timer (30 minutes)
    startTimer(30 * 60);
    
    // Show test section
    showView('testSection');
  })
  .catch(err => {
    hideLoading();
    console.error('Error:', err);
    alert('Failed to start test. Please try again.');
  });
  */
}

function saveProgress() {
  alert('Your progress has been saved. You can continue this test later.');
}

function logout() {
  showLoading();
  
  // For demo purposes, we'll simulate a response
  setTimeout(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('answers');
    window.location.href = '/testportal/login.html';
  }, 1000);
  
  // In a real implementation, use the fetch API:
  /*
  fetch('http://localhost:5678/webhook/frontend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'logout',
      params: { student_id: localStorage.getItem('userId') }
    })
  })
  .then(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('answers');
    window.location.href = '/testportal/login.html';
  })
  .catch(err => {
    hideLoading();
    console.error('Error:', err);
    alert('Failed to logout. Please try again.');
  });
  */
}
