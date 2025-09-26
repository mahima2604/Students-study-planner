// Smart Study Planner - JavaScript Implementation

// Data Storage
let tasks = [];
let goals = [];
let currentFilter = 'all';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderGoals();
    renderTasks();
    updateProgress();
    updateTimeline();
    populateGoalSelect();
    
    // Set minimum date to today
    document.getElementById('taskDeadline').min = new Date().toISOString().split('T')[0];
});

// Data Management Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveData() {
    localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
    localStorage.setItem('studyPlannerGoals', JSON.stringify(goals));
}

function loadData() {
    const savedTasks = localStorage.getItem('studyPlannerTasks');
    const savedGoals = localStorage.getItem('studyPlannerGoals');
    
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
    }
}

// Goal Management
function showAddGoalModal() {
    document.getElementById('goalModalTitle').textContent = 'Add New Goal';
    document.getElementById('goalForm').reset();
    document.getElementById('goalModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function addGoal(event) {
    event.preventDefault();
    
    const title = document.getElementById('goalTitle').value.trim();
    
    if (!title) {
        alert('Please enter a goal title');
        return;
    }
    
    const goal = {
        id: generateId(),
        title: title,
        progress: 0,
        createdAt: new Date().toISOString()
    };
    
    goals.push(goal);
    saveData();
    renderGoals();
    populateGoalSelect();
    closeModal('goalModal');
    
    // Show success message
    showNotification('Goal added successfully!', 'success');
}

function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal? This will unlink all associated tasks.')) {
        // Remove goal
        goals = goals.filter(goal => goal.id !== goalId);
        
        // Unlink tasks from this goal
        tasks = tasks.map(task => {
            if (task.goalId === goalId) {
                task.goalId = '';
            }
            return task;
        });
        
        saveData();
        renderGoals();
        renderTasks();
        populateGoalSelect();
        updateProgress();
        
        showNotification('Goal deleted successfully!', 'success');
    }
}

function renderGoals() {
    const container = document.getElementById('goalsContainer');
    
    if (goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-target"></i>
                <h3>No Goals Yet</h3>
                <p>Create your first study goal to get started!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = goals.map(goal => {
        const linkedTasks = tasks.filter(task => task.goalId === goal.id);
        const completedTasks = linkedTasks.filter(task => task.status === 'Completed').length;
        const progressPercentage = linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0;
        
        return `
            <div class="goal-card">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${escapeHtml(goal.title)}</div>
                        <div class="goal-progress">${linkedTasks.length} tasks • ${progressPercentage}% complete</div>
                    </div>
                    <button class="btn btn-danger" onclick="deleteGoal('${goal.id}')" title="Delete Goal">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Task Management
function showAddTaskModal() {
    document.getElementById('taskModalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskModal').style.display = 'block';
    document.getElementById('taskDeadline').min = new Date().toISOString().split('T')[0];
}

function showEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskSubject').value = task.subject || '';
    document.getElementById('taskDeadline').value = task.deadline;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskGoal').value = task.goalId || '';
    
    // Store the task ID for editing
    document.getElementById('taskForm').dataset.editingId = taskId;
    
    document.getElementById('taskModal').style.display = 'block';
}

function addOrEditTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const subject = document.getElementById('taskSubject').value.trim();
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;
    const goalId = document.getElementById('taskGoal').value;
    
    if (!title || !deadline) {
        alert('Please fill in all required fields');
        return;
    }
    
    const editingId = document.getElementById('taskForm').dataset.editingId;
    
    if (editingId) {
        // Edit existing task
        const taskIndex = tasks.findIndex(t => t.id === editingId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title: title,
                subject: subject,
                deadline: deadline,
                priority: priority,
                goalId: goalId
            };
            showNotification('Task updated successfully!', 'success');
        }
        delete document.getElementById('taskForm').dataset.editingId;
    } else {
        // Add new task
        const task = {
            id: generateId(),
            title: title,
            subject: subject,
            deadline: deadline,
            priority: priority,
            status: 'Pending',
            goalId: goalId,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(task);
        showNotification('Task added successfully!', 'success');
    }
    
    saveData();
    renderTasks();
    updateProgress();
    updateTimeline();
    closeModal('taskModal');
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveData();
        renderTasks();
        updateProgress();
        updateTimeline();
        
        showNotification('Task deleted successfully!', 'success');
    }
}

function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
    saveData();
    renderTasks();
    renderGoals();
    updateProgress();
    updateTimeline();
    
    const statusText = task.status === 'Completed' ? 'completed' : 'marked as pending';
    showNotification(`Task ${statusText}!`, 'success');
}

function filterTasks(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTasks();
}

function getTaskStatusClass(task) {
    if (task.status === 'Completed') {
        return 'task-completed';
    }
    
    const today = new Date();
    const deadline = new Date(task.deadline);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'task-overdue';
    } else if (diffDays <= 3) {
        return 'task-upcoming';
    }
    
    return '';
}

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    
    let filteredTasks = tasks;
    
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(task => task.status === 'Pending');
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.status === 'Completed');
    }
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No Tasks Found</h3>
                <p>${currentFilter === 'all' ? 'Create your first task to get started!' : `No ${currentFilter} tasks found.`}</p>
            </div>
        `;
        return;
    }
    
    // Sort tasks by deadline
    filteredTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    container.innerHTML = filteredTasks.map(task => {
        const statusClass = getTaskStatusClass(task);
        const goal = goals.find(g => g.id === task.goalId);
        const deadlineDate = new Date(task.deadline);
        const today = new Date();
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let deadlineText = '';
        if (diffDays < 0) {
            deadlineText = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            deadlineText = 'Due today';
        } else if (diffDays === 1) {
            deadlineText = 'Due tomorrow';
        } else {
            deadlineText = `Due in ${diffDays} days`;
        }
        
        return `
            <div class="task-card ${statusClass}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            ${task.subject ? `<span><i class="fas fa-book"></i> ${escapeHtml(task.subject)}</span>` : ''}
                            <span><i class="fas fa-calendar"></i> ${deadlineDate.toLocaleDateString()}</span>
                            <span><i class="fas fa-clock"></i> ${deadlineText}</span>
                            ${goal ? `<span><i class="fas fa-target"></i> ${escapeHtml(goal.title)}</span>` : ''}
                        </div>
                    </div>
                    <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                </div>
                <div class="card-actions">
                    <button class="btn ${task.status === 'Completed' ? 'btn-secondary' : 'btn-success'}" 
                            onclick="toggleTaskStatus('${task.id}')">
                        <i class="fas fa-${task.status === 'Completed' ? 'undo' : 'check'}"></i>
                        ${task.status === 'Completed' ? 'Mark Pending' : 'Mark Complete'}
                    </button>
                    <button class="btn btn-secondary" onclick="showEditTaskModal('${task.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteTask('${task.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function populateGoalSelect() {
    const select = document.getElementById('taskGoal');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">No Goal</option>';
    
    goals.forEach(goal => {
        const option = document.createElement('option');
        option.value = goal.id;
        option.textContent = goal.title;
        select.appendChild(option);
    });
    
    select.value = currentValue;
}

// Progress Tracking
function updateProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;
    
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${progressPercentage}%`;
}

// Timeline View
function updateTimeline() {
    const container = document.getElementById('timelineContainer');
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No Timeline Data</h3>
                <p>Add some tasks to see your timeline!</p>
            </div>
        `;
        return;
    }
    
    // Group tasks by date
    const tasksByDate = {};
    tasks.forEach(task => {
        const date = task.deadline;
        if (!tasksByDate[date]) {
            tasksByDate[date] = [];
        }
        tasksByDate[date].push(task);
    });
    
    // Sort dates
    const sortedDates = Object.keys(tasksByDate).sort((a, b) => new Date(a) - new Date(b));
    
    // Show next 7 days or all dates if fewer than 7
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const relevantDates = sortedDates.filter(date => {
        const dateObj = new Date(date);
        return dateObj >= today || dateObj < nextWeek;
    }).slice(0, 7);
    
    if (relevantDates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No Upcoming Tasks</h3>
                <p>All tasks are in the past or more than a week away!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = relevantDates.map(date => {
        const dateObj = new Date(date);
        const dayTasks = tasksByDate[date];
        
        return `
            <div class="timeline-item">
                <div class="timeline-date">
                    ${dateObj.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                </div>
                <div class="timeline-tasks">
                    ${dayTasks.map(task => `
                        <span class="timeline-task ${getTaskStatusClass(task)}">
                            ${escapeHtml(task.title)}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#68d391' : '#667eea'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;
document.head.appendChild(notificationStyles);

// Event Listeners
document.getElementById('taskForm').addEventListener('submit', addOrEditTask);
document.getElementById('goalForm').addEventListener('submit', addGoal);

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const taskModal = document.getElementById('taskModal');
    const goalModal = document.getElementById('goalModal');
    
    if (event.target === taskModal) {
        closeModal('taskModal');
    }
    if (event.target === goalModal) {
        closeModal('goalModal');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Escape key closes modals
    if (event.key === 'Escape') {
        closeModal('taskModal');
        closeModal('goalModal');
    }
    
    // Ctrl/Cmd + N adds new task
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        showAddTaskModal();
    }
    
    // Ctrl/Cmd + G adds new goal
    if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
        event.preventDefault();
        showAddGoalModal();
    }
});
