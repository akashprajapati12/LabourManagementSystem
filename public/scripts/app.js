// Delete salary record
async function deleteSalary(id) {
    if (confirm('Delete this salary record?')) {
        try {
            await fetchAPI(`/salaries/${id}`, 'DELETE');
            showAlert('Salary deleted successfully', 'success');
            loadSalaries();
        } catch (error) {
            showAlert('Error deleting salary', 'danger');
        }
    }
}
// API Base URL - handle both mobile and desktop
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
// when deployed, use relative path so requests go to same host/origin
const API_URL = `${window.location.origin}/api`;

let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Mobile-specific initialization
    if (isMobile) {
        document.body.classList.add('mobile-device');
        setupNetworkMonitoring();
    }
    
    checkAuth();
    setupEventListeners();
});

// Mobile network monitoring
function setupNetworkMonitoring() {
    const networkStatus = document.getElementById('networkStatus');
    
    function updateNetworkStatus() {
        if (navigator.onLine) {
            networkStatus.textContent = 'Online';
            networkStatus.className = 'network-status online';
        } else {
            networkStatus.textContent = 'Offline - Please check your connection';
            networkStatus.className = 'network-status';
        }
        // Only show status when offline
        networkStatus.style.display = navigator.onLine ? 'none' : 'block';
    }
    
    // Initial check
    updateNetworkStatus();
    
    // Event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
}

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
    document.getElementById('sidebar').classList.remove('show');
    document.getElementById('mainContent').classList.add('show');
    loadLabourDropdowns();
    loadDashboard();
}

// Update user display (logo + details)
function updateUserDisplay() {
    const initialsEl = document.getElementById('userInitials');
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const idEl = document.getElementById('userId');
    const roleEl = document.getElementById('userRole');

    const name = currentUser.name || currentUser.username || 'User';
    const email = currentUser.email || '';
    const id = currentUser.id || currentUser.userId || '';
    const role = currentUser.role || '';

    if (initialsEl) {
        const parts = name.split(' ');
        const initials = (parts[0] ? parts[0][0] : 'U') + (parts[1] ? parts[1][0] : '');
        initialsEl.textContent = initials.toUpperCase();
    }
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email || '-';
    if (idEl) idEl.textContent = id ? `User ID: ${id}` : 'User ID: -';
    if (roleEl) roleEl.textContent = role ? `Role: ${role}` : '';
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Logout (in sidebar footer)
    const logoutSidebar = document.getElementById('logoutBtnSidebar');
    if (logoutSidebar) logoutSidebar.addEventListener('click', logout);

    // Hamburger menu toggle - ensure visible when toggled
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarToggleBtn && sidebarEl) {
        // create overlay if it doesn't exist
        let overlayEl = document.getElementById('sidebarOverlay');
        if (!overlayEl) {
            overlayEl = document.createElement('div');
            overlayEl.id = 'sidebarOverlay';
            overlayEl.className = 'sidebar-overlay';
            document.body.appendChild(overlayEl);
        }

        sidebarToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarEl.classList.toggle('show');
            overlayEl.classList.toggle('show');
        });
        
        // Close sidebar when any link or button inside it is clicked
        sidebarEl.addEventListener('click', (e) => {
            const clickable = e.target.closest('a, button, [data-section]');
            if (clickable) {
                sidebarEl.classList.remove('show');
                overlayEl.classList.remove('show');
            }
        });

        // Close sidebar when clicking outside of it (overlay behavior)
        document.addEventListener('click', (e) => {
            const isClickInside = e.target.closest('#sidebar');
            const isToggle = e.target.closest('#sidebarToggle');
            if (!isClickInside && !isToggle && sidebarEl.classList.contains('show')) {
                sidebarEl.classList.remove('show');
                overlayEl.classList.remove('show');
            }
        });

        // Clicking on the overlay should close the sidebar as well
        overlayEl.addEventListener('click', () => {
            if (sidebarEl.classList.contains('show')) {
                sidebarEl.classList.remove('show');
                overlayEl.classList.remove('show');
            }
        });
    }

    // User logo toggle - show user details
    const userLogo = document.getElementById('userLogo');
    if (userLogo) {
        console.log('Binding userLogo click');
        userLogo.addEventListener('click', (e) => {
            e.stopPropagation();
            const details = document.getElementById('userDetails');
            if (details) {
                // toggle via inline style to avoid inline style conflicts
                if (details.style.display === 'block' || details.classList.contains('show')) {
                    details.style.display = 'none';
                    details.classList.remove('show');
                } else {
                    details.style.display = 'block';
                    details.classList.add('show');
                }
            }
        });
        // close user details when clicking outside
        document.addEventListener('click', () => {
            const details = document.getElementById('userDetails');
            if (details && (details.style.display === 'block' || details.classList.contains('show'))) {
                details.style.display = 'none';
                details.classList.remove('show');
            }
        });
    } else {
        console.warn('userLogo element not found');
    }
    
    // Close sidebar when clicking on a nav link
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('sidebar').classList.remove('show');
            loadSection(link.dataset.section);
        });
    });
    
    // Forms
    document.getElementById('labourForm').addEventListener('submit', saveLabour);
    
    // Photo upload handlers
    const photoDropZone = document.getElementById('photoDropZone');
    const photoInput = document.getElementById('labourPhoto');
    
    if (photoDropZone && photoInput) {
        photoDropZone.addEventListener('click', () => photoInput.click());
        
        photoInput.addEventListener('change', handlePhotoSelect);
        
        photoDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            photoDropZone.style.backgroundColor = '#e7e9ff';
            photoDropZone.style.borderColor = '#667eea';
        });
        
        photoDropZone.addEventListener('dragleave', () => {
            photoDropZone.style.backgroundColor = '#f8f9fa';
            photoDropZone.style.borderColor = '#ccc';
        });
        
        photoDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            photoDropZone.style.backgroundColor = '#f8f9fa';
            photoDropZone.style.borderColor = '#ccc';
            if (e.dataTransfer.files.length > 0) {
                photoInput.files = e.dataTransfer.files;
                handlePhotoSelect();
            }
        });
    }
    
    document.getElementById('attendanceForm').addEventListener('submit', saveAttendance);
    document.getElementById('advanceForm').addEventListener('submit', saveAdvance);
    document.getElementById('leaveForm').addEventListener('submit', saveLeave);
    document.getElementById('salaryForm').addEventListener('submit', calculateSalary);
    
    // Month selectors
    document.getElementById('attendanceDate').addEventListener('change', loadAttendance);
    document.getElementById('salaryMonth').addEventListener('change', loadSalaries);
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Basic validation
    if (!username || !password) {
        showAlert('Please enter both username and password', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
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
        let errorMessage = 'Error connecting to server. Please try again.';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        showAlert(errorMessage, 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    
    // Basic validation
    if (!username || !password || !name) {
        showAlert('Username, password, and name are required', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'danger');
        return;
    }
    
    try {
        console.log('Attempting registration with:', { username, name, email });
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, name, email })
        });
        
        console.log('Registration response status:', response.status);
        const data = await response.json();
        console.log('Registration response data:', data);
        
        if (response.ok) {
            showAlert('Registration successful! Please login.', 'success');
            document.getElementById('registerForm').reset();
            document.getElementById('login-tab').click();
        } else {
            showAlert(data.error || 'Registration failed', 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Error connecting to server. Please try again.', 'danger');
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
            // deductions removed
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
        const [labours, attendance, advances, leaves, salaries] = await Promise.all([
            fetchAPI('/labours'),
            fetchAPI('/attendance'),
            fetchAPI('/advances'),
            fetchAPI('/leaves'),
            fetchAPI('/salaries')
        ]);
        
        const dashboardCards = document.getElementById('dashboardCards');
        dashboardCards.innerHTML = `
            <div class="col-md-6 col-lg-3">
                <button class="stat-card modern-card nav-button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);" onclick="loadSection('labours')">
                    <div class="card-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="card-content">
                        <h6>Total Labours</h6>
                        <div class="number">${labours.length}</div>
                    </div>
                </button>
            </div>
            <div class="col-md-6 col-lg-3">
                <button class="stat-card modern-card nav-button" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);" onclick="loadSection('attendance')">
                    <div class="card-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="card-content">
                        <h6>Present Today</h6>
                        <div class="number">${attendance.filter(a => {
                            const recDate = new Date(a.date).toISOString().split('T')[0];
                            const today = new Date().toISOString().split('T')[0];
                            return ['present', 'half-day', 'overtime'].includes(a.status) && recDate === today;
                        }).length}</div>
                    </div>
                </button>
            </div>
            <div class="col-md-6 col-lg-3">
                <button class="stat-card modern-card nav-button" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);" onclick="loadSection('advances')">
                    <div class="card-icon">
                        <i class="fas fa-hand-holding-usd"></i>
                    </div>
                    <div class="card-content">
                        <h6>Total Advances</h6>
                        <div class="number">₹${advances.reduce((sum, a) => sum + a.amount, 0).toFixed(0)}</div>
                    </div>
                </button>
            </div>
            <div class="col-md-6 col-lg-3">
                <button class="stat-card modern-card nav-button" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);" onclick="loadSection('leaves')">
                    <div class="card-icon">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <div class="card-content">
                        <h6>Pending Leaves</h6>
                        <div class="number">${leaves.filter(l => l.status === 'pending').length}</div>
                    </div>
                </button>
            </div>
        `;
    } catch (error) {
        showAlert('Error loading dashboard', 'danger');
    }
}

// Photo upload handler
function handlePhotoSelect() {
    const photoInput = document.getElementById('labourPhoto');
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewImg = document.getElementById('photoPreviewImg');
    
    if (photoInput && photoInput.files && photoInput.files[0]) {
        const file = photoInput.files[0];
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Photo size should be less than 5MB', 'warning');
            photoInput.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (photoPreviewImg) {
                photoPreviewImg.src = e.target.result;
                photoPreview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}

function removePhoto() {
    const photoInput = document.getElementById('labourPhoto');
    const photoPreview = document.getElementById('photoPreview');
    if (photoInput) photoInput.value = '';
    if (photoPreview) photoPreview.style.display = 'none';
}

// Labours Management
async function loadLabours() {
    try {
        const labours = await fetchAPI('/labours');
        const container = document.getElementById('laboursContainer');
        
        if (labours.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-4">No labours found</div>';
            return;
        }
        
        container.innerHTML = labours.map(labour => `
            <div class="row g-2 mb-2 p-2 border rounded" style="background: white; align-items: center; border: 1px solid #dee2e6;">
                <!-- Photo -->
                <div class="col-auto">
                    ${labour.photo ? `
                        <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; border: 2px solid #667eea;">
                            <img src="${labour.photo}" alt="${labour.name}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    ` : `
                        <div style="width: 50px; height: 50px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; border: 2px solid #667eea;">
                            ${labour.name.split(' ').map(n => n[0]).join('')}
                        </div>
                    `}
                </div>
                
                <!-- Name and Designation -->
                <div class="col">
                    <div style="font-weight: 600; font-size: 15px; color: #2c3e50; margin-bottom: 2px;">${labour.name}</div>
                    ${labour.designation ? `<div style="font-size: 12px; color: #6c757d;">${labour.designation}</div>` : ''}
                </div>
                
                <!-- Action Buttons -->
                <div class="col-auto">
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-info" style="padding: 4px 10px; font-size: 11px; border-radius: 15px;" onclick="showLabourDetails(${labour.id})">
                            <i class="fas fa-info-circle"></i> Info
                        </button>
                        <button class="btn btn-sm btn-success" style="padding: 4px 10px; font-size: 11px; border-radius: 15px;" onclick="showAttendanceCalendar(${labour.id}, '${labour.name}')">
                            <i class="fas fa-calendar"></i> Attendance
                        </button>
                        <button class="btn btn-sm btn-danger" style="padding: 4px 10px; font-size: 11px; border-radius: 15px;" onclick="deleteLabour(${labour.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showAlert('Error loading labours', 'danger');
    }
}

function showLabourDetails(labourId) {
    fetchAPI('/labours').then(labours => {
        const labour = labours.find(l => l.id === labourId);
        if (labour) {
            const detailsHtml = `
                ${labour.photo ? `<div style="margin-bottom: 15px;"><img src="${labour.photo}" alt="${labour.name}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 6px;"></div>` : ''}
                <div style="border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 12px;">
                    <h6>${labour.name}</h6>
                </div>
                <div style="margin-bottom: 10px; line-height: 1.8;">
                    <strong>Email:</strong> ${labour.email || '-'}<br>
                    <strong>Phone:</strong> ${labour.phone || '-'}<br>
                    <strong>Address:</strong> ${labour.address || '-'}<br>
                    <strong>Daily Rate:</strong> ₹${labour.dailyRate || 0}<br>
                    <strong>Designation:</strong> ${labour.designation || '-'}<br>
                    <strong>Aadhar:</strong> ${labour.aadhar || '-'}<br>
                    <strong>Bank Account:</strong> ${labour.bankAccount || '-'}
                </div>
            `;
            document.getElementById('labourDetailsContent').innerHTML = detailsHtml;
            new bootstrap.Modal(document.getElementById('labourDetailsModal')).show();
        }
    }).catch(err => showAlert('Error loading labour details', 'danger'));
}

function showAttendanceCalendar(labourId, labourName) {
    const monthInput = document.getElementById('calendarMonth');
    const currentMonth = new Date().toISOString().slice(0, 7);
    monthInput.value = currentMonth;
    
    const calendarModal = new bootstrap.Modal(document.getElementById('labourCalendarModal'));
    calendarModal.show();
    
    // Store labour info for calendar loading
    window.currentCalendarLabourId = labourId;
    window.currentCalendarMonth = currentMonth;
    
    // Load calendar
    loadAttendanceCalendar(labourId, currentMonth);
    
    // Set up month change event
    if (!monthInput._labourCalendarListener) {
        monthInput._labourCalendarListener = true;
        monthInput.addEventListener('change', (e) => {
            loadAttendanceCalendar(window.currentCalendarLabourId, e.target.value);
        });
    }
}

async function loadAttendanceCalendar(labourId, month) {
    try {
        const safeMonth = /^\d{4}-\d{2}$/.test(String(month || ''))
            ? String(month)
            : new Date().toISOString().slice(0, 7);
        const attendance = await fetchAPI('/attendance');
        const getDateOnly = (value) => {
            if (!value) return '';
            const str = String(value);
            return str.includes('T') ? str.split('T')[0] : str.slice(0, 10);
        };
        const labourAttendance = attendance.filter(a => {
            const dateOnly = getDateOnly(a?.date);
            const aMonth = dateOnly ? dateOnly.slice(0, 7) : '';
            return Number(a?.labourId) === Number(labourId) && aMonth === safeMonth;
        });

        const calendarDiv = document.getElementById('attendanceCalendar');
        const monthLabel = new Date(safeMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        
        let html = `<h6 style="margin-bottom: 15px;">${monthLabel}</h6><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;">`;
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            html += `<div style="padding: 8px; text-align: center; font-weight: 600; color: #666; font-size: 12px;">${day}</div>`;
        });
        
        // Get first day of month and number of days
        const [year, monthNum] = safeMonth.split('-');
        const firstDay = new Date(year, monthNum - 1, 1).getDay();
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            html += `<div style="padding: 8px; text-align: center; background: #f5f5f5; border-radius: 4px;"></div>`;
        }
        
        // Track month-wise totals shown in legend
        const attendanceTotals = {
            present: 0,
            overtime: 0,
            halfDay: 0,
            absent: 0
        };
        let overtimeExtraHours = 0;

        labourAttendance.forEach(record => {
            if (record?.status === 'overtime') {
                const workedHours = Number(record?.hours) || 0;
                // Only add extra hours (workedHours - 8) to OT
                overtimeExtraHours += Math.max(workedHours - 8, 0);
                // Count overtime day as present
                attendanceTotals.present += 1;
            }
        });

        // Add day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${safeMonth}-${String(day).padStart(2, '0')}`;
            const attRecord = labourAttendance.find(a => getDateOnly(a?.date) === dateStr);
            const status = attRecord ? attRecord.status : 'absent';
            let bgColor = '#7B241C'; // dark red for absent
            let textColor = '#fff';
            let statusLabel = 'A';
            
            if (status === 'present') {
                bgColor = '#145A32'; // dark green for present
                textColor = '#fff';
                statusLabel = 'P';
            } else if (status === 'half-day') {
                bgColor = '#fff3cd';
                textColor = '#856404';
                statusLabel = 'H';
            } else if (status === 'overtime') {
                bgColor = '#0c5460';
                textColor = '#fff';
                statusLabel = 'OT';
            }

            if (status === 'present') {
                attendanceTotals.present += 1;
            } else if (status === 'overtime') {
                attendanceTotals.overtime += 1;
            } else if (status === 'half-day') {
                attendanceTotals.halfDay += 1;
            } else {
                attendanceTotals.absent += 1;
            }
            
            html += `<div style="padding: 8px; text-align: center; background: ${bgColor}; color: ${textColor}; border-radius: 4px; font-weight: 500; cursor: pointer; min-height: 45px; display: flex; flex-direction: column; justify-content: center; align-items: center;" title="${day} - ${status}" data-bs-toggle="tooltip"><small>${day}</small><small>${statusLabel}</small></div>`;
        }
        
        html += `</div>
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 13px;">
                <div><span style="display: inline-block; width: 12px; height: 12px; background: #d4edda; border-radius: 3px; margin-right: 5px;"></span>P = Present (${attendanceTotals.present})</div>
                <div><span style="display: inline-block; width: 12px; height: 12px; background: #d1ecf1; border-radius: 3px; margin-right: 5px;"></span>OT = Overtime (${attendanceTotals.overtime} days, ${overtimeExtraHours.toFixed(1)}h extra)</div>
                <div><span style="display: inline-block; width: 12px; height: 12px; background: #fff3cd; border-radius: 3px; margin-right: 5px;"></span>H = Half-day (${attendanceTotals.halfDay})</div>
                <div><span style="display: inline-block; width: 12px; height: 12px; background: #f8d7da; border-radius: 3px; margin-right: 5px;"></span>A = Absent (${attendanceTotals.absent})</div>
            </div>
        </div>`;
        calendarDiv.innerHTML = html;
    } catch (error) {
        console.error('loadAttendanceCalendar failed:', error);
        showAlert(`Error loading attendance calendar: ${error?.message || 'Unknown error'}`, 'danger');
    }
}

async function saveLabour(e) {
    e.preventDefault();
    
    const labourId = document.getElementById('labourId').value;
    const photoInput = document.getElementById('labourPhoto');
    
    let photoData = null;
    
    // Get existing photo if updating and no new photo selected
    if (labourId && !photoInput.files.length) {
        // Keep existing photo
        try {
            const labours = await fetchAPI('/labours');
            const existingLabour = labours.find(l => l.id === parseInt(labourId));
            if (existingLabour && existingLabour.photo) {
                photoData = existingLabour.photo;
            }
        } catch (e) {
            console.log('Could not retrieve existing photo');
        }
    } else if (photoInput.files.length > 0) {
        // Convert new photo to base64
        photoData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(photoInput.files[0]);
        });
    }
    
    const data = {
        name: document.getElementById('labourName').value,
        email: document.getElementById('labourEmail').value,
        phone: document.getElementById('labourPhone').value,
        address: document.getElementById('labourAddress').value,
        aadhar: document.getElementById('labourAadhar').value,
        bankAccount: document.getElementById('labourBank').value,
        dailyRate: parseFloat(document.getElementById('labourRate').value),
        designation: document.getElementById('labourDesignation').value,
        photo: photoData,
        status: 'active'
    };
    
    try {
        const method = labourId ? 'PUT' : 'POST';
        const url = labourId ? `/labours/${labourId}` : '/labours';
        
        const response = await fetchAPI(url, method, data);
        
        showAlert('Labour saved successfully', 'success');
        document.getElementById('labourForm').reset();
        document.getElementById('labourId').value = '';
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) photoPreview.style.display = 'none';
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
        // Set date to today if not set
        const dateInput = document.getElementById('attendanceDate');
        if (!dateInput.value) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
        
        const selectedDate = dateInput.value;
        const labours = await fetchAPI('/labours');
        const attendance = await fetchAPI('/attendance');
        
        const tbody = document.querySelector('#attendanceTable tbody');
        
        if (labours.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No labours found. Add labours first.</td></tr>';
            return;
        }
        
        tbody.innerHTML = labours.map(labour => {
            const todayRecord = attendance.find(a => 
                a.labourId === labour.id && 
                new Date(a.date).toISOString().split('T')[0] === selectedDate
            );
            
            const status = todayRecord ? todayRecord.status : 'not-marked';
            const hours = todayRecord ? todayRecord.hours : 8;
            
            return `
                <tr>
                    <td><strong>${labour.name}</strong></td>
                    <td>
                        <span class="badge" style="background: ${getStatusColor(status)}; color: #fff; font-weight: 600;">
                            ${status === 'not-marked' ? 'Not Marked' : status}
                        </span>
                    </td>
                    <td>${hours}</td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-success btn-small-round" title="Present" onclick="markAttendance(${labour.id}, '${selectedDate}', 'present')">
                                <i class="fas fa-check"></i> P
                            </button>
                            <button class="btn btn-outline-danger btn-small-round" title="Absent" onclick="markAttendance(${labour.id}, '${selectedDate}', 'absent')">
                                <i class="fas fa-times"></i> A
                            </button>
                            <button class="btn btn-outline-warning btn-small-round" title="Half-day" onclick="markAttendance(${labour.id}, '${selectedDate}', 'half-day')">
                                <i class="fas fa-minus"></i> H-D
                            </button>
                            <button class="btn btn-outline-primary btn-small-round" title="Overtime" onclick="showOvertimeModal(${labour.id}, '${labour.name}', '${selectedDate}', ${hours})">
                                <i class="fas fa-clock"></i> OT
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        showAlert('Error loading attendance', 'danger');
        console.error(error);
    }
}

async function markAttendance(labourId, date, status, hours = 8) {
    try {
        // If status is half-day, set hours to 4
        if (status === 'half-day') {
            hours = 4;
        }
        const data = {
            labourId: labourId,
            date: date,
            status: status,
            hours: hours,
            notes: ''
        };
        await fetchAPI('/attendance', 'POST', data);
        showAlert(`Attendance marked as ${status}`, 'success');
        loadAttendance();
    } catch (error) {
        showAlert('Error marking attendance', 'danger');
        console.error(error);
    }
}

// Overtime modal handling
let overtimeData = {};

function showOvertimeModal(labourId, labourName, date, currentHours = 8) {
    overtimeData = { labourId, date, currentHours: currentHours || 8 };
    document.getElementById('overtimeLabourName').value = labourName;
    document.getElementById('overtimeHours').value = 1;
    const modal = new bootstrap.Modal(document.getElementById('overtimeModal'));
    modal.show();
}

document.getElementById('overtimeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const overtimeHours = Number(document.getElementById('overtimeHours').value) || 1;
    const totalHours = overtimeData.currentHours + overtimeHours;
    await markAttendance(overtimeData.labourId, overtimeData.date, 'overtime', totalHours);
    bootstrap.Modal.getInstance(document.getElementById('overtimeModal')).hide();
});

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

// Deductions removed from frontend

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
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                tbody.innerHTML = '<tr><td colspan="10"><div class="text-center py-4" style="background: white; border-radius: 12px; margin: 15px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);"><i class="fas fa-file-invoice-dollar" style="font-size: 48px; color: #6c757d; margin-bottom: 15px;"></i><div style="color: #6c757d; font-size: 18px;">No salary records found</div></div></td></tr>';
            } else {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4">No salary records found</td></tr>';
            }
            return;
        }
        
        // Check if on mobile device
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Mobile-friendly card layout
            tbody.innerHTML = salaries.map(sal => `
                <tr>
                    <td colspan="10">
                        <div class="salary-card">
                            <div class="salary-header">
                                <h5>${sal.name}</h5>
                                <span class="badge bg-${sal.status === 'pending' ? 'warning' : 'success'}">${sal.status}</span>
                            </div>
                            <div class="salary-details">
                                <div class="detail-row">
                                    <span class="label">Month:</span>
                                    <span class="value">${new Date(sal.month).toLocaleDateString('en-IN', {month: 'long', year: 'numeric'})}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Days:</span>
                                    <span class="value">${sal.daysPresent || 0}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">OT Hours:</span>
                                    <span class="value">${(Number(sal.overtimeHours) || 0).toFixed(1)}h</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Basic:</span>
                                    <span class="value">₹${(Number(sal.basicSalary) || 0).toFixed(2)}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">OT Pay:</span>
                                    <span class="value">₹${(Number(sal.overtimePay) || 0).toFixed(2)}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Advances:</span>
                                    <span class="value">₹${(Number(sal.totalAdvance) || 0).toFixed(2)}</span>
                                </div>
                                <div class="detail-row net-row">
                                    <span class="label">Net Salary:</span>
                                    <span class="value">₹${(Number(sal.netSalary) || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div class="salary-actions">
                                ${sal.status === 'pending' ? `
                                    <button class="btn btn-sm btn-success" onclick="updateSalaryStatus(${sal.id}, 'paid')">Mark Paid</button>
                                ` : ''}
                                <button class="btn btn-sm btn-info" onclick="printSalarySlip(${sal.id})">
                                    <i class="fas fa-print"></i> Print
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteSalary(${sal.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            // Desktop table layout
            tbody.innerHTML = salaries.map(sal => `
                <tr data-salary-id="${sal.id}" data-basic="${Number(sal.basicSalary) || 0}" data-advance="${Number(sal.totalAdvance) || 0}" data-deductions="${Number(sal.totalDeductions) || 0}" data-net="${Number(sal.netSalary) || 0}" data-days="${sal.daysPresent || 0}">
                    <td>${sal.name}</td>
                    <td>${new Date(sal.month).toLocaleDateString('en-IN', {month: 'long', year: 'numeric'})}</td>
                    <td>${sal.daysPresent || 0}</td>
                    <td>${(Number(sal.overtimeHours) || 0).toFixed(1)}h</td>
                    <td>₹${(Number(sal.basicSalary) || 0).toFixed(2)}</td>
                    <td>₹${(Number(sal.overtimePay) || 0).toFixed(2)}</td>
                    <td>₹${(Number(sal.totalAdvance) || 0).toFixed(2)}</td>
                    <td><strong>₹${(Number(sal.netSalary) || 0).toFixed(2)}</strong></td>
                    <td><span class="badge bg-${sal.status === 'pending' ? 'warning' : 'success'}">${sal.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${sal.status === 'pending' ? `
                                <button class="btn btn-sm btn-success" onclick="updateSalaryStatus(${sal.id}, 'paid')">Mark Paid</button>
                            ` : ''}
                            <button class="btn btn-sm btn-info" onclick="printSalarySlip(${sal.id})">
                                <i class="fas fa-print"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteSalary(${sal.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        showAlert('Error loading salaries', 'danger');
    }
}

// Delete salary record
async function deleteSalary(id) {
    if (confirm('Delete this salary record?')) {
        try {
            await fetchAPI(`/salaries/${id}`, 'DELETE');
            showAlert('Salary deleted successfully', 'success');
            loadSalaries();
        } catch (error) {
            showAlert('Error deleting salary', 'danger');
        }
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
    try {
        if (typeof html2pdf === 'undefined') {
            showAlert('PDF library not loaded (html2pdf).', 'danger');
            return;
        }

        let sal;
        try {
            sal = await fetchAPI(`/salaries/${id}`);
        } catch (fetchErr) {
            // fallback to reading values from the table row if API fetch fails
            const row = document.querySelector(`#salariesTable tbody tr[data-salary-id="${id}"]`);
            if (row) {
                sal = {
                    id: id,
                    name: row.children[0].innerText.trim(),
                    month: (row.children[1].innerText && row.children[1].innerText.trim()) || '',
                    daysPresent: Number(row.dataset.days) || Number(row.children[2].innerText.trim()) || 0,
                    basicSalary: Number(row.dataset.basic) || parseFloat((row.children[3].innerText || '').replace(/[^0-9.-]+/g, '')) || 0,
                    totalAdvance: Number(row.dataset.advance) || parseFloat((row.children[4].innerText || '').replace(/[^0-9.-]+/g, '')) || 0,
                    totalDeductions: Number(row.dataset.deductions) || parseFloat((row.children[5].innerText || '').replace(/[^0-9.-]+/g, '')) || 0,
                    netSalary: Number(row.dataset.net) || parseFloat((row.children[6].innerText || '').replace(/[^0-9.-]+/g, '')) || 0,
                    status: (row.children[7].innerText || '').trim() || 'pending'
                };
            } else {
                throw fetchErr;
            }
        }

        if (!sal || !sal.id) {
            showAlert('Salary record not found', 'warning');
            return;
        }

        const monthLabel = sal.month ? new Date(sal.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';
        const filename = `Salary_${(sal.name || 'labour').replace(/\s+/g, '_')}_${sal.month || ''}.pdf`;

        const basicSalary = Number(sal.basicSalary) || 0;
        const overtimeHours = Number(sal.overtimeHours) || 0;
        const overtimePay = Number(sal.overtimePay) || 0;
        const totalAdvance = Number(sal.totalAdvance) || 0;
        const totalDeductions = Number(sal.totalDeductions) || 0;
        const netSalary = Number(sal.netSalary) || (basicSalary + overtimePay - totalAdvance - totalDeductions);

        const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

        // Build invoice HTML with clearer layout and guaranteed amounts
        const container = document.createElement('div');
        container.style.width = '720px';
        container.style.padding = '24px';
        container.style.fontFamily = 'Helvetica, Arial, sans-serif';
        container.style.color = '#222';
        container.innerHTML = `
            <div style="border-bottom:1px solid #ddd;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <h2 style="margin:0;color:#333;">Labour Management</h2>
                    <div style="color:#666;font-size:13px;">Invoice - Monthly Salary</div>
                </div>
                <div style="text-align:right;color:#666;font-size:13px;">
                    <div>Date: ${new Date().toLocaleDateString('en-IN')}</div>
                    <div>Month: ${monthLabel}</div>
                    <div>Salary ID: ${sal.id || ''}</div>
                </div>
            </div>

            <div style="display:flex;justify-content:space-between;margin-bottom:18px;">
                <div>
                    <strong>Employee:</strong>
                    <div>${sal.name || ''}</div>
                    <div>ID: ${sal.labourId || ''}</div>
                </div>
                <div style="text-align:right;">
                    <strong>Status:</strong>
                    <div>${sal.status || 'pending'}</div>
                </div>
            </div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:14px;table-layout:fixed;">
                <colgroup>
                    <col style="width:65%">
                    <col style="width:35%">
                </colgroup>
                <thead>
                    <tr style="background:#f7f7f7;text-align:left;">
                        <th style="padding:10px;border:1px solid #eee;">Description</th>
                        <th style="padding:10px;border:1px solid #eee;text-align:right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:10px;border:1px solid #eee;">Basic Salary (days present: ${sal.daysPresent || 0})</td>
                        <td style="padding:10px;border:1px solid #eee;text-align:right;white-space:nowrap;">${fmt.format(basicSalary)}</td>
                    </tr>
                    ${overtimeHours > 0 ? `
                    <tr>
                        <td style="padding:10px;border:1px solid #eee;">Overtime (${overtimeHours} hours @ 1.5x)</td>
                        <td style="padding:10px;border:1px solid #eee;text-align:right;white-space:nowrap;">${fmt.format(overtimePay)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding:10px;border:1px solid #eee;">Total Advance</td>
                        <td style="padding:10px;border:1px solid #eee;text-align:right;white-space:nowrap;">${fmt.format(totalAdvance)}</td>
                    </tr>

                    <tr style="font-weight:700;background:#fafafa;">
                        <td style="padding:12px;border:1px solid #eee;">Net Salary</td>
                        <td style="padding:12px;border:1px solid #eee;text-align:right;white-space:nowrap;">${fmt.format(netSalary)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="font-size:12px;color:#666;">This is a system generated payslip for the month specified. Keep this document for your records.</div>
        `;

        document.body.appendChild(container);

        // Generate PDF using html2pdf (bundled with html2pdf.bundle.min.js)
        const opt = {
            margin:       10,
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(container).save();

        // cleanup
        document.body.removeChild(container);
    } catch (err) {
        console.error(err);
        showAlert('Failed to generate PDF', 'danger');
    }
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
        throw new Error('Unauthorized');
    }

    // Try to parse body as text first so we can handle non-JSON errors
    const text = await response.text();

    if (!response.ok) {
        let errMsg = text || `Request failed with status ${response.status}`;
        try {
            const parsed = JSON.parse(text || '{}');
            errMsg = parsed.error || parsed.message || errMsg;
        } catch (e) {
            // not JSON, keep text
        }
        throw new Error(errMsg);
    }

    try {
        return text ? JSON.parse(text) : {};
    } catch (e) {
        return text;
    }
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
        'present': '#145A32', // dark green
        'absent': '#7B241C', // dark red
        'half-day': '#FFC107', // yellow
        'overtime': '#0dcaf0' // info blue
    };
    return colors[status] || '#6c757d'; // default gray
}

function getLeaveStatusColor(status) {
    const colors = {
        'approved': 'success',
        'rejected': 'danger',
        'pending': 'warning'
    };
    return colors[status] || 'secondary';
}
