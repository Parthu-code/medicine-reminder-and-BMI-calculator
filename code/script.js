// Global variables
let reminders = [];
let notificationPermission = false;

// DOM elements
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const reminderForm = document.getElementById('reminderForm');
const remindersList = document.getElementById('remindersList');
const bmiForm = document.getElementById('bmiForm');
const bmiResult = document.getElementById('bmiResult');
const notificationModal = document.getElementById('notificationModal');
const enableNotificationsBtn = document.getElementById('enableNotifications');
const skipNotificationsBtn = document.getElementById('skipNotifications');
const alarmSound = document.getElementById('alarmSound');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadReminders();
    checkNotificationPermission();
    startReminderChecker();
});

// Initialize the application
function initializeApp() {
    // Set default time to current time + 1 hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    document.getElementById('reminderTime').value = now.toTimeString().slice(0, 5);
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            navigateToPage(targetPage);
        });
    });

    // Reminder form
    reminderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addReminder();
    });

    // BMI form
    bmiForm.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBMI();
    });

    // Notification buttons
    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
    skipNotificationsBtn.addEventListener('click', closeNotificationModal);
}

// Navigation function
function navigateToPage(pageName) {
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    // Show target page
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === `${pageName}-page`) {
            page.classList.add('active');
        }
    });
}

// Add new reminder
function addReminder() {
    const medicationName = document.getElementById('medicationName').value;
    const dosage = document.getElementById('dosage').value;
    const reminderTime = document.getElementById('reminderTime').value;
    const frequency = document.getElementById('frequency').value;
    const notes = document.getElementById('notes').value;

    const reminder = {
        id: Date.now(),
        medicationName,
        dosage,
        reminderTime,
        frequency,
        notes,
        createdAt: new Date().toISOString(),
        isActive: true
    };

    reminders.push(reminder);
    saveReminders();
    displayReminders();
    reminderForm.reset();
    
    // Set default time to current time + 1 hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    document.getElementById('reminderTime').value = now.toTimeString().slice(0, 5);

    showNotification('Reminder Added', `${medicationName} reminder has been added successfully!`);
}

// Display reminders
function displayReminders() {
    if (reminders.length === 0) {
        remindersList.innerHTML = '<p class="no-reminders">No reminders set. Add your first reminder above!</p>';
        return;
    }

    remindersList.innerHTML = reminders
        .filter(reminder => reminder.isActive)
        .map(reminder => createReminderHTML(reminder))
        .join('');
}

// Create reminder HTML
function createReminderHTML(reminder) {
    const isOverdue = isReminderOverdue(reminder);
    const statusClass = isOverdue ? 'overdue' : '';
    
    return `
        <div class="reminder-item" data-id="${reminder.id}">
            <div class="reminder-status ${statusClass}"></div>
            <div class="reminder-header">
                <div class="reminder-title">${reminder.medicationName}</div>
                <div class="reminder-time">${formatTime(reminder.reminderTime)}</div>
            </div>
            <div class="reminder-details">
                <div class="reminder-detail">
                    <span>Dosage</span>
                    <span>${reminder.dosage}</span>
                </div>
                <div class="reminder-detail">
                    <span>Frequency</span>
                    <span>${formatFrequency(reminder.frequency)}</span>
                </div>
                <div class="reminder-detail">
                    <span>Created</span>
                    <span>${formatDate(reminder.createdAt)}</span>
                </div>
                ${reminder.notes ? `
                <div class="reminder-detail">
                    <span>Notes</span>
                    <span>${reminder.notes}</span>
                </div>
                ` : ''}
            </div>
            <div class="reminder-actions">
                <button class="btn btn-secondary" onclick="editReminder(${reminder.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteReminder(${reminder.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// Check if reminder is overdue
function isReminderOverdue(reminder) {
    const now = new Date();
    const today = now.toDateString();
    const reminderDateTime = new Date(`${today} ${reminder.reminderTime}`);
    
    return now > reminderDateTime;
}

// Format time
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Format frequency
function formatFrequency(frequency) {
    const frequencyMap = {
        'daily': 'Daily',
        'twice-daily': 'Twice Daily',
        'three-times': 'Three Times Daily',
        'weekly': 'Weekly',
        'custom': 'Custom'
    };
    return frequencyMap[frequency] || frequency;
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// Edit reminder
function editReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    // Populate form with reminder data
    document.getElementById('medicationName').value = reminder.medicationName;
    document.getElementById('dosage').value = reminder.dosage;
    document.getElementById('reminderTime').value = reminder.reminderTime;
    document.getElementById('frequency').value = reminder.frequency;
    document.getElementById('notes').value = reminder.notes;

    // Remove old reminder
    deleteReminder(id);

    // Scroll to form
    document.querySelector('.reminder-form').scrollIntoView({ behavior: 'smooth' });
}

// Delete reminder
function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    saveReminders();
    displayReminders();
    showNotification('Reminder Deleted', 'Reminder has been removed successfully!');
}

// Calculate BMI
function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value) / 100; // Convert cm to meters
    const age = parseInt(document.getElementById('age').value);

    if (weight <= 0 || height <= 0 || age <= 0) {
        showNotification('Invalid Input', 'Please enter valid weight, height, and age values.');
        return;
    }

    const bmi = weight / (height * height);
    const category = getBMICategory(bmi);
    const description = getBMIDescription(bmi, age);

    // Display result
    document.getElementById('bmiNumber').textContent = bmi.toFixed(1);
    document.getElementById('bmiCategory').textContent = category;
    document.getElementById('bmiDescription').textContent = description;

    // Show result
    bmiResult.style.display = 'block';
    bmiResult.scrollIntoView({ behavior: 'smooth' });

    // Save to localStorage
    const bmiHistory = JSON.parse(localStorage.getItem('bmiHistory') || '[]');
    bmiHistory.push({
        bmi: bmi.toFixed(1),
        weight,
        height: height * 100,
        age,
        date: new Date().toISOString()
    });
    localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));
}

// Get BMI category
function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

// Get BMI description
function getBMIDescription(bmi, age) {
    if (bmi < 18.5) {
        return 'Your BMI indicates you may be underweight. Consider consulting a healthcare provider.';
    } else if (bmi < 25) {
        return 'Your BMI indicates a healthy weight range. Keep up the good work!';
    } else if (bmi < 30) {
        return 'Your BMI indicates you may be overweight. Consider lifestyle changes and consult a healthcare provider.';
    } else {
        return 'Your BMI indicates obesity. Please consult a healthcare provider for guidance.';
    }
}

// Check notification permission
function checkNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }

    if (Notification.permission === 'granted') {
        notificationPermission = true;
    } else if (Notification.permission === 'denied') {
        // Don't show modal if already denied
    } else {
        // Show modal to request permission
        setTimeout(() => {
            notificationModal.style.display = 'block';
        }, 2000);
    }
}

// Request notification permission
async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationPermission = true;
            closeNotificationModal();
            showNotification('Notifications Enabled', 'You will now receive medication reminders!');
        } else {
            showNotification('Permission Denied', 'You can still use the app, but won\'t receive notifications.');
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

// Close notification modal
function closeNotificationModal() {
    notificationModal.style.display = 'none';
}

// Show notification
function showNotification(title, body) {
    if (notificationPermission && 'Notification' in window) {
        new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
        });
    }

    // Also show in-app notification
    showInAppNotification(title, body);
}

// Show in-app notification
function showInAppNotification(title, body) {
    const notification = document.createElement('div');
    notification.className = 'in-app-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${body}</p>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Start reminder checker
function startReminderChecker() {
    setInterval(checkReminders, 30000); // Check every 30 seconds
}

// Check reminders
function checkReminders() {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    reminders.forEach(reminder => {
        if (reminder.isActive && reminder.reminderTime === currentTime) {
            triggerReminder(reminder);
        }
    });
}

// Trigger reminder
function triggerReminder(reminder) {
    // Play alarm sound
    alarmSound.play().catch(e => console.log('Audio play failed:', e));

    // Show notification
    showNotification(
        'Medication Reminder',
        `Time to take ${reminder.medicationName} - ${reminder.dosage}`
    );

    // Create reminder popup
    createReminderPopup(reminder);
}

// Create reminder popup
function createReminderPopup(reminder) {
    const popup = document.createElement('div');
    popup.className = 'reminder-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>⏰ Medication Reminder</h3>
            <p><strong>${reminder.medicationName}</strong></p>
            <p>Dosage: ${reminder.dosage}</p>
            <p>Time: ${formatTime(reminder.reminderTime)}</p>
            ${reminder.notes ? `<p>Notes: ${reminder.notes}</p>` : ''}
            <div class="popup-actions">
                <button class="btn btn-primary" onclick="markAsTaken(${reminder.id})">
                    <i class="fas fa-check"></i> Mark as Taken
                </button>
                <button class="btn btn-secondary" onclick="snoozeReminder(${reminder.id})">
                    <i class="fas fa-clock"></i> Snooze (5 min)
                </button>
            </div>
        </div>
    `;

    // Add styles
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        z-index: 4000;
        max-width: 400px;
        text-align: center;
        animation: popupIn 0.3s ease-out;
    `;

    document.body.appendChild(popup);

    // Auto-close after 2 minutes
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
        }
    }, 120000);
}

// Mark reminder as taken
function markAsTaken(reminderId) {
    // Remove popup
    const popup = document.querySelector('.reminder-popup');
    if (popup) popup.remove();

    // Stop alarm
    alarmSound.pause();
    alarmSound.currentTime = 0;

    showNotification('Reminder Completed', 'Great job taking your medication on time!');
}

// Snooze reminder
function snoozeReminder(reminderId) {
    // Remove popup
    const popup = document.querySelector('.reminder-popup');
    if (popup) popup.remove();

    // Stop alarm
    alarmSound.pause();
    alarmSound.currentTime = 0;

    // Set reminder for 5 minutes later
    setTimeout(() => {
        const reminder = reminders.find(r => r.id === reminderId);
        if (reminder) {
            triggerReminder(reminder);
        }
    }, 300000); // 5 minutes

    showNotification('Reminder Snoozed', 'Reminder will appear again in 5 minutes.');
}

// Save reminders to localStorage
function saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

// Load reminders from localStorage
function loadReminders() {
    const saved = localStorage.getItem('reminders');
    if (saved) {
        reminders = JSON.parse(saved);
        displayReminders();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes popupIn {
        from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    .in-app-notification {
        font-family: inherit;
    }
    
    .in-app-notification h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
    }
    
    .in-app-notification p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
    }
    
    .reminder-popup {
        font-family: inherit;
    }
    
    .reminder-popup h3 {
        color: #667eea;
        margin-bottom: 1rem;
    }
    
    .reminder-popup p {
        margin: 0.5rem 0;
    }
    
    .popup-actions {
        margin-top: 1.5rem;
        display: flex;
        gap: 1rem;
        justify-content: center;
    }
    
    .no-reminders {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 2rem;
    }
`;

document.head.appendChild(style);
