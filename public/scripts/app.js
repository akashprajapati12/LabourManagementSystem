// API Base URL
const API_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check authentication
function checkAuth() {
    if (authToken) {
        showMainApp();
        updateUserDisplay();
    } else {
        showLoginModal();
    }
}

// Show login screen
function showLoginModal() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('navbar').classList.remove('show');
    document.getElementById('sidebar').classList.remove('show');
    document.getElementById('mainContent').classList.remove('show');
}

// Show main app
function showMainApp() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('navbar').classList.add('show');
    document.getElementById('sidebar').classList.add('show');
    document.getElementById('mainContent').classList.add('show');
    loadLabourDropdowns();
    loadDashboard();
}

// Update user display
function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    if (currentUser.name) {
        userDisplay.textContent = `Welcome, ${currentUser.name}`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Forms
    document.getElementById('labourForm').addEventListener('submit', saveLabour);
    document.getElementById('attendanceForm').addEventListener('submit', saveAttendance);
    document.getElementById('advanceForm').addEventListener('submit', saveAdvance);
    document.getElementById('deductionForm').addEventListener('submit', saveDeduction);
    document.getElementById('leaveForm').addEventListener('submit', saveLeave);
    document.getElementById('salaryForm').addEventListener('submit', calculateSalary);
    
    // Navigation
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadSection(link.dataset.section);
        });
    });
    
    // Month selectors
    document.getElementById('attendanceMonth').addEventListener('change', loadAttendance);
    document.getElementById('salaryMonth').addEventListener('change', loadSalaries);
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainApp();
            showAlert('Login successful', 'success');
            document.getElementById('loginForm').reset();
        } else {
            showAlert(data.error || 'Login failed', 'danger');
        }
    } catch (error) {
        showAlert('Error logging in', 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, name, email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Registration successful! Please login.', 'success');
            document.getElementById('registerForm').reset();
            document.getElementById('login-tab').click();
        } else {
            showAlert(data.error || 'Registration failed', 'danger');
        }
    } catch (error) {
        showAlert('Error registering', 'danger');
    }
}

function logout() {
    authToken = null;
    currentUser = {};
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLoginModal();
    showAlert('Logged out successfully', 'info');
}

// Section loader
function loadSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
    
    // Show selected section
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
        document.querySelector(`.sidebar [data-section="${section}"]`).classList.add('active');
        
        // Load data based on section
        switch(section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'labours':
                loadLabours();
                break;
            case 'attendance':
                loadAttendance();
                break;
            case 'advances':
                loadAdvances();
                break;
            case 'deductions':
                loadDeductions();
                break;
            case 'leaves':
                loadLeaves();
                break;
            case 'salaries':
                loadSalaries();
                break;
        }
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const [labours, attendance, advances, deductions, leaves, salaries] = await Promise.all([
            fetchAPI('/labours'),
            fetchAPI('/attendance/month/' + new Date().toISOString().slice(0, 7)),
            fetchAPI('/advances'),
            fetchAPI('/deductions'),
            fetchAPI('/leaves'),
            fetchAPI('/salaries')
        ]);
        
        const dashboardCards = document.getElementById('dashboardCards');
        dashboardCards.innerHTML = `
            <div class="col-md-4 col-lg-3">
                <div class="stat-card" style="background: linear-gradient(135deg, #ff9a56 0%, #ff7e5f 100%);">
                    <h5><i class="fas fa-users"></i> Total Labours</h5>
                    <div class="number">${labours.length}</div>
                </div>
            </div>
            <div class="col-md-4 col-lg-3">
                <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <h5><i class="fas fa-calendar-check"></i> Present Today</h5>
                    <div class="number">${attendance.filter(a => a.status === 'present').length}</div>
                </div>
            </div>
            <div class="col-md-4 col-lg-3">
                <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <h5><i class="fas fa-hand-holding-usd"></i> Total Advances</h5>
                    <div class="number">₹${advances.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}</div>
                </div>
            </div>
            <div class="col-md-4 col-lg-3">
                <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <h5><i class="fas fa-calendar-times"></i> Pending Leaves</h5>
                    <div class="number">${leaves.filter(l => l.status === 'pending').length}</div>
                </div>
            </div>
        `;
    } catch (error) {
        showAlert('Error loading dashboard', 'danger');
    }
}

// Labours Management
async function loadLabours() {
    try {
        const labours = await fetchAPI('/labours');
        const tbody = document.querySelector('#laboursTable tbody');
        
        if (labours.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No labours found</td></tr>';
            return;
        }
        
        tbody.innerHTML = labours.map(labour => `
            <tr>
                <td>${labour.name}</td>
                <td>${labour.email || '-'}</td>
                <td>${labour.phone || '-'}</td>
                <td>₹${labour.dailyRate}</td>
                <td>${labour.designation || '-'}</td>
                <td><span class="badge bg-${labour.status === 'active' ? 'success' : 'danger'}">${labour.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-warning" onclick="editLabour(${labour.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLabour(${labour.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showAlert('Error loading labours', 'danger');
    }
}

async function saveLabour(e) {
    e.preventDefault();
    
    const labourId = document.getElementById('labourId').value;
    const data = {
        name: document.getElementById('labourName').value,
        email: document.getElementById('labourEmail').value,
        phone: document.getElementById('labourPhone').value,
        address: document.getElementById('labourAddress').value,
        aadhar: document.getElementById('labourAadhar').value,
        bankAccount: document.getElementById('labourBank').value,
        dailyRate: parseFloat(document.getElementById('labourRate').value),
        designation: document.getElementById('labourDesignation').value,
        status: 'active'
    };
    
    try {
        const method = labourId ? 'PUT' : 'POST';
        const url = labourId ? `/labours/${labourId}` : '/labours';
        
        const response = await fetchAPI(url, method, data);
        
        showAlert('Labour saved successfully', 'success');
        document.getElementById('labourForm').reset();
        document.getElementById('labourId').value = '';
        bootstrap.Modal.getInstance(document.getElementById('labourModal')).hide();
        loadLabours();
        loadLabourDropdowns();
    } catch (error) {
        showAlert('Error saving labour', 'danger');
    }
}

async function editLabour(id) {
    try {
        const labour = await fetchAPI(`/labours/${id}`);
        
        document.getElementById('labourId').value = labour.id;
        document.getElementById('labourName').value = labour.name;
        document.getElementById('labourEmail').value = labour.email || '';
        document.getElementById('labourPhone').value = labour.phone || '';
        document.getElementById('labourAddress').value = labour.address || '';
        document.getElementById('labourAadhar').value = labour.aadhar || '';
        document.getElementById('labourBank').value = labour.bankAccount || '';
        document.getElementById('labourRate').value = labour.dailyRate;
        document.getElementById('labourDesignation').value = labour.designation || '';
        
        const modal = new bootstrap.Modal(document.getElementById('labourModal'));
        modal.show();
    } catch (error) {
        showAlert('Error loading labour', 'danger');
    }
}

async function deleteLabour(id) {
    if (confirm('Are you sure you want to delete this labour?')) {
        try {
            await fetchAPI(`/labours/${id}`, 'DELETE');
            showAlert('Labour deleted successfully', 'success');
            loadLabours();
        } catch (error) {
            showAlert('Error deleting labour', 'danger');
        }
    }
}

// Attendance Management
async function loadAttendance() {
    try {
        const month = document.getElementById('attendanceMonth').value || new Date().toISOString().slice(0, 7);
        document.getElementById('attendanceMonth').value = month;
        
        const attendance = await fetchAPI(`/attendance/month/${month}`);
        const tbody = document.querySelector('#attendanceTable tbody');
        
        if (attendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No attendance records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = attendance.map(record => `
            <tr>
                <td>${record.name}</td>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td><span class="badge bg-${getStatusColor(record.status)}">${record.status}</span></td>
                <td>${record.hours}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteAttendance(${record.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showAlert('Error loading attendance', 'danger');
    }
}

async function saveAttendance(e) {
    e.preventDefault();
    
    const data = {
        labourId: parseInt(document.getElementById('attLabourId').value),
        date: document.getElementById('attDate').value,
        status: document.getElementById('attStatus').value,
        hours: parseFloat(document.getElementById('attHours').value),
        notes: document.getElementById('attNotes').value
    };
    
    try {
        await fetchAPI('/attendance', 'POST', data);
        showAlert('Attendance marked successfully', 'success');
        document.getElementById('attendanceForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
        loadAttendance();
    } catch (error) {
        showAlert('Error marking attendance', 'danger');
    }
}

async function deleteAttendance(id) {
    if (confirm('Delete this attendance record?')) {
        try {
            await fetchAPI(`/attendance/${id}`, 'DELETE');
            showAlert('Attendance deleted', 'success');
            loadAttendance();
        } catch (error) {
            showAlert('Error deleting attendance', 'danger');
        }
    }
}

// Advances Management
async function loadAdvances() {
    try {
        const advances = await fetchAPI('/advances');
        const tbody = document.querySelector('#advancesTable tbody');
        
        if (advances.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No advances found</td></tr>';
            return;
        }
        
        tbody.innerHTML = advances.map(adv => `
            <tr>
                <td>${adv.name}</td>
                <td>₹${adv.amount.toFixed(2)}</td>
                <td>${new Date(adv.date).toLocaleDateString()}</td>
                <td>${adv.reason || '-'}</td>
                <td><span class="badge bg-${adv.status === 'pending' ? 'warning' : 'success'}">${adv.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="updateAdvanceStatus(${adv.id})">Mark Paid</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAdvance(${adv.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showAlert('Error loading advances', 'danger');
    }
}

async function saveAdvance(e) {
    e.preventDefault();
    
    const data = {
        labourId: parseInt(document.getElementById('advLabourId').value),
        amount: parseFloat(document.getElementById('advAmount').value),
        reason: document.getElementById('advReason').value,
        dueDate: document.getElementById('advDueDate').value
    };
    
    try {
        await fetchAPI('/advances', 'POST', data);
        showAlert('Advance added successfully', 'success');
        document.getElementById('advanceForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('advanceModal')).hide();
        loadAdvances();
    } catch (error) {
        showAlert('Error adding advance', 'danger');
    }
}

async function updateAdvanceStatus(id) {
    try {
        await fetchAPI(`/advances/${id}`, 'PUT', { status: 'paid' });
        showAlert('Advance marked as paid', 'success');
        loadAdvances();
    } catch (error) {
        showAlert('Error updating advance', 'danger');
    }
}

async function deleteAdvance(id) {
    if (confirm('Delete this advance?')) {
        try {
            await fetchAPI(`/advances/${id}`, 'DELETE');
            showAlert('Advance deleted', 'success');
            loadAdvances();
        } catch (error) {
            showAlert('Error deleting advance', 'danger');
        }
    }
}

// Deductions Management
async function loadDeductions() {
    try {
        const deductions = await fetchAPI('/deductions');
        const tbody = document.querySelector('#deductionsTable tbody');
        
        if (deductions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No deductions found</td></tr>';
            return;
        }
        
        tbody.innerHTML = deductions.map(ded => `
            <tr>
                <td>${ded.name}</td>
                <td>₹${ded.amount.toFixed(2)}</td>
                <td>${ded.type || '-'}</td>
                <td>${new Date(ded.date).toLocaleDateString()}</td>
                <td>${ded.reason || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteDeduction(${ded.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showAlert('Error loading deductions', 'danger');
    }
}

async function saveDeduction(e) {
    e.preventDefault();
    
    const data = {
        labourId: parseInt(document.getElementById('dedLabourId').value),
        amount: parseFloat(document.getElementById('dedAmount').value),
        type: document.getElementById('dedType').value,
        reason: document.getElementById('dedReason').value
    };
    
    try {
        await fetchAPI('/deductions', 'POST', data);
        showAlert('Deduction added successfully', 'success');
        document.getElementById('deductionForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('deductionModal')).hide();
        loadDeductions();
    } catch (error) {
        showAlert('Error adding deduction', 'danger');
    }
}

async function deleteDeduction(id) {
    if (confirm('Delete this deduction?')) {
        try {
            await fetchAPI(`/deductions/${id}`, 'DELETE');
            showAlert('Deduction deleted', 'success');
            loadDeductions();
        } catch (error) {
            showAlert('Error deleting deduction', 'danger');
        }
    }
}

// Leaves Management
async function loadLeaves() {
    try {
        const leaves = await fetchAPI('/leaves');
        const tbody = document.querySelector('#leavesTable tbody');
        
        if (leaves.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No leave requests found</td></tr>';
            return;
        }
        
        tbody.innerHTML = leaves.map(leave => `
            <tr>
                <td>${leave.name}</td>
                <td>${new Date(leave.startDate).toLocaleDateString()}</td>
                <td>${new Date(leave.endDate).toLocaleDateString()}</td>
                <td>${leave.type || '-'}</td>
                <td><span class="badge bg-${getLeaveStatusColor(leave.status)}">${leave.status}</span></td>
                <td>
                    <div class="action-buttons">
                        ${leave.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="updateLeaveStatus(${leave.id}, 'approved')">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="updateLeaveStatus(${leave.id}, 'rejected')">Reject</button>
                        ` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="deleteLeave(${leave.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showAlert('Error loading leaves', 'danger');
    }
}

async function saveLeave(e) {
    e.preventDefault();
    
    const data = {
        labourId: parseInt(document.getElementById('leaveLabourId').value),
        startDate: document.getElementById('leaveStart').value,
        endDate: document.getElementById('leaveEnd').value,
        type: document.getElementById('leaveType').value,
        reason: document.getElementById('leaveReason').value
    };
    
    try {
        await fetchAPI('/leaves', 'POST', data);
        showAlert('Leave request submitted', 'success');
        document.getElementById('leaveForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('leaveModal')).hide();
        loadLeaves();
    } catch (error) {
        showAlert('Error submitting leave request', 'danger');
    }
}

async function updateLeaveStatus(id, status) {
    try {
        await fetchAPI(`/leaves/${id}`, 'PUT', { status });
        showAlert(`Leave ${status}`, 'success');
        loadLeaves();
    } catch (error) {
        showAlert('Error updating leave', 'danger');
    }
}

async function deleteLeave(id) {
    if (confirm('Delete this leave request?')) {
        try {
            await fetchAPI(`/leaves/${id}`, 'DELETE');
            showAlert('Leave deleted', 'success');
            loadLeaves();
        } catch (error) {
            showAlert('Error deleting leave', 'danger');
        }
    }
}

// Salaries Management
async function loadSalaries() {
    try {
        const month = document.getElementById('salaryMonth').value || new Date().toISOString().slice(0, 7);
        document.getElementById('salaryMonth').value = month;
        
        const salaries = await fetchAPI(`/salaries/month/${month}`);
        const tbody = document.querySelector('#salariesTable tbody');
        
        if (salaries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No salary records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = salaries.map(sal => `
            <tr>
                <td>${sal.name}</td>
                <td>${new Date(sal.month).toLocaleDateString('en-IN', {month: 'long', year: 'numeric'})}</td>
                <td>${sal.daysPresent}</td>
                <td>₹${sal.basicSalary.toFixed(2)}</td>
                <td>₹${sal.totalAdvance.toFixed(2)}</td>
                <td>₹${sal.totalDeductions.toFixed(2)}</td>
                <td><strong>₹${sal.netSalary.toFixed(2)}</strong></td>
                <td><span class="badge bg-${sal.status === 'pending' ? 'warning' : 'success'}">${sal.status}</span></td>
                <td>
                    <div class="action-buttons">
                        ${sal.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="updateSalaryStatus(${sal.id}, 'paid')">Mark Paid</button>
                        ` : ''}
                        <button class="btn btn-sm btn-info" onclick="printSalarySlip(${sal.id})">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showAlert('Error loading salaries', 'danger');
    }
}

async function calculateSalary(e) {
    e.preventDefault();
    
    const data = {
        labourId: parseInt(document.getElementById('salLabourId').value),
        month: document.getElementById('salMonth').value
    };
    
    try {
        const response = await fetchAPI('/salaries/calculate', 'POST', data);
        showAlert('Salary calculated successfully', 'success');
        document.getElementById('salaryForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('salaryModal')).hide();
        loadSalaries();
    } catch (error) {
        showAlert('Error calculating salary', 'danger');
    }
}

async function updateSalaryStatus(id, status) {
    try {
        await fetchAPI(`/salaries/${id}`, 'PUT', { status });
        showAlert('Salary marked as paid', 'success');
        loadSalaries();
    } catch (error) {
        showAlert('Error updating salary', 'danger');
    }
}

async function printSalarySlip(id) {
    alert('Salary slip print feature coming soon!');
}

// Helper functions
async function loadLabourDropdowns() {
    try {
        const labours = await fetchAPI('/labours');
        
        if (!labours || labours.length === 0) {
            console.warn('No labours found');
            return;
        }
        
        const options = labours.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
        const selectElements = ['attLabourId', 'advLabourId', 'dedLabourId', 'leaveLabourId', 'salLabourId'];
        
        selectElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = '<option value="">Select Labour</option>' + options;
            }
        });
    } catch (error) {
        console.error('Error loading labour dropdowns:', error);
    }
}

async function fetchAPI(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (response.status === 401) {
        logout();
    }
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API Error');
    }
    
    return response.json();
}

function showAlert(message, type = 'info') {
    const loginContainer = document.getElementById('loginContainer');
    
    // Check if login page is visible
    if (loginContainer && loginContainer.style.display !== 'none') {
        const activeTab = document.querySelector('.tab-pane.show.active');
        const alertContainer = activeTab && activeTab.id === 'login-form' 
            ? document.getElementById('loginAlert')
            : document.getElementById('registerAlert');
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
    } else {
        // Show in main app
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        const mainContent = document.getElementById('mainContent');
        mainContent.insertBefore(alertDiv, mainContent.firstChild);
    }
    
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.remove());
    }, 3000);
}

function getStatusColor(status) {
    const colors = {
        'present': 'success',
        'absent': 'danger',
        'half-day': 'warning',
        'sick-leave': 'info'
    };
    return colors[status] || 'secondary';
}

function getLeaveStatusColor(status) {
    const colors = {
        'approved': 'success',
        'rejected': 'danger',
        'pending': 'warning'
    };
    return colors[status] || 'secondary';
}
