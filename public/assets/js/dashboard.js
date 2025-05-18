// Check authentication
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = '/login';
}

// Add session management constants and variables
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const WARNING_TIME = 1 * 60 * 1000; // Show warning 1 minute before timeout
let sessionTimer;
let warningTimer;
let lastActivity = Date.now();

// Add session timeout management
function resetSessionTimer() {
    lastActivity = Date.now();
    clearTimeout(sessionTimer);
    clearTimeout(warningTimer);
    
    // Set new timers
    warningTimer = setTimeout(showSessionWarning, SESSION_TIMEOUT - WARNING_TIME);
    sessionTimer = setTimeout(endSession, SESSION_TIMEOUT);
}

function showSessionWarning() {
    // Create and show warning notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <p>Your session will expire in 1 minute due to inactivity.</p>
        </div>
    `;
    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => notification.remove(), 5000);
}

function endSession() {
    // Show session timeout modal
    const sessionModal = document.getElementById('session-modal');
    sessionModal.classList.remove('hidden');
    
    // Clear session storage
    sessionStorage.removeItem('isLoggedIn');
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
        window.location.href = '/login';
    }, 3000);
}

// Track user activity
function trackActivity() {
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetSessionTimer);
    });
}

let messages = [];
let deleteIds = [];
const deleteModal = document.getElementById('delete-modal');
const deleteMessage = document.getElementById('delete-message');

async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        messages = data.messages;
        displayMessages();
        updateStats();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessages(messagesToShow = messages) {
    const tbody = document.getElementById('messages-table');
    tbody.innerHTML = '';
    
    messagesToShow.forEach(msg => {
        const tr = document.createElement('tr');
        const date = new Date(msg.timestamp);
        
        tr.innerHTML = `
            <td class="px-6 py-4">
                <input type="checkbox" class="message-checkbox rounded" data-id="${msg._id}">
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">${msg.recipientName}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${msg.message}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </td>
            <td class="px-6 py-4 text-sm">
                <button class="text-red-600 hover:text-red-900" onclick="showDeleteModal('${msg._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    updateDeleteButton();
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('delete-selected');
    if (!deleteBtn) return;
    
    const hasSelected = document.querySelector('.message-checkbox:checked');
    deleteBtn.classList.toggle('hidden', !hasSelected);
}

function showDeleteModal(ids, isMultiple = false) {
    deleteIds = Array.isArray(ids) ? ids : [ids];
    deleteMessage.textContent = isMultiple 
        ? `Are you sure you want to delete ${deleteIds.length} messages?`
        : 'Are you sure you want to delete this message?';
    deleteModal.classList.remove('hidden');
}

async function performDelete() {
    try {
        const response = await fetch('/api/messages', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: deleteIds })
        });

        if (response.ok) {
            await loadMessages(); // Reload messages after delete
        }
    } catch (error) {
        console.error('Error deleting messages:', error);
    } finally {
        deleteModal.classList.add('hidden');
        deleteIds = [];
    }
}

function updateStats() {
    const totalMessages = messages.length;
    const today = new Date().toDateString();
    const todayMessages = messages.filter(msg => 
        new Date(msg.timestamp).toDateString() === today
    ).length;

    document.getElementById('total-messages').textContent = totalMessages;
    document.getElementById('today-messages').textContent = todayMessages;
}

// Update system info function
async function updateSystemInfo() {
    try {
        const response = await fetch('/api/system-info');
        const data = await response.json();

        // Update CPU info
        const cpuBar = document.getElementById('cpu-load');
        const cpuText = document.getElementById('cpu-text');
        const cpuUsage = parseFloat(data.cpu.usage);
        cpuBar.style.width = `${cpuUsage}%`;
        cpuText.textContent = `CPU Load: ${cpuUsage}%`;

        // Set CPU bar color
        if (cpuUsage > 80) {
            cpuBar.className = 'h-2 rounded-full bg-red-500 transition-all duration-500';
        } else if (cpuUsage > 50) {
            cpuBar.className = 'h-2 rounded-full bg-yellow-500 transition-all duration-500';
        } else {
            cpuBar.className = 'h-2 rounded-full bg-green-500 transition-all duration-500';
        }

        // Update RAM usage
        const ramBar = document.getElementById('ram-usage');
        const ramText = document.getElementById('ram-text');
        const ramUsage = parseFloat(data.memory.usagePercent);
        ramBar.style.width = `${ramUsage}%`;
        ramText.textContent = `RAM: ${data.memory.used}GB / ${data.memory.total}GB (${ramUsage}%)`;

        // Set RAM bar color based on usage
        if (ramUsage > 80) {
            ramBar.className = 'h-2 rounded-full bg-red-500 transition-all duration-500';
        } else if (ramUsage > 50) {
            ramBar.className = 'h-2 rounded-full bg-yellow-500 transition-all duration-500';
        } else {
            ramBar.className = 'h-2 rounded-full bg-green-500 transition-all duration-500';
        }

        // Update database status
        const dbStatus = document.getElementById('db-status');
        dbStatus.innerHTML = data.dbStatus === 'connected' ? 
            '<i class="fas fa-circle text-xs mr-1 text-green-500"></i><span>Connected</span>' : 
            '<i class="fas fa-circle text-xs mr-1 text-red-500"></i><span>Disconnected</span>';

        // Update Database Stats
        if (data.database) {
            const dbSizeText = document.getElementById('db-size-text');
            const dbStorageBar = document.getElementById('db-storage-bar');
            const dbCollections = document.getElementById('db-collections');
            const dbObjects = document.getElementById('db-objects');

            dbSizeText.textContent = `${data.database.size} / ${data.database.maxSize}`;
            dbStorageBar.style.width = `${data.database.usagePercent}%`;
            dbCollections.textContent = data.database.collections;
            dbObjects.textContent = data.database.objects;

            // Show warning only when storage is critical
            const usedSpace = parseFloat(data.database.usagePercent);
            if (usedSpace > 90) {
                showStorageWarning('Critical: Database storage is almost full! Please manage your data.');
                dbStorageBar.className = 'h-2 rounded-full bg-red-500 transition-all duration-500';
            } else if (usedSpace > 80) {
                dbStorageBar.className = 'h-2 rounded-full bg-yellow-500 transition-all duration-500';
            } else {
                dbStorageBar.className = 'h-2 rounded-full bg-blue-500 transition-all duration-500';
            }
        }

        // Update last refresh time
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Error updating system info:', error);
    }
}

// Add storage warning function
function showStorageWarning(message) {
    const warning = document.createElement('div');
    warning.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg z-50';
    warning.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(warning);
    setTimeout(() => warning.remove(), 5000);
}

// Update system info every 2 seconds for better responsiveness
setInterval(updateSystemInfo, 2000);
updateSystemInfo(); // Initial update

// Add search functionality
function setupSearch() {
    const searchInput = document.getElementById('message-search-table');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredMessages = messages.filter(msg => 
            msg.recipientName.toLowerCase().includes(searchTerm) ||
            msg.message.toLowerCase().includes(searchTerm)
        );
        displayMessages(filteredMessages);
    });
}

// Add event delegation for checkboxes
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('message-checkbox')) {
        updateDeleteButton();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    if (!sessionStorage.getItem('isLoggedIn')) {
        window.location.href = '/login';
        return;
    }

    // Initialize session management
    resetSessionTimer();
    trackActivity();

    loadMessages().then(() => {
        displayMessages();
        updateStats();
    });
    
    setupSearch(); // Add search initialization
    
    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = '/login';
    });

    // Select all checkbox handler
    document.getElementById('select-all')?.addEventListener('change', (e) => {
        document.querySelectorAll('.message-checkbox').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        updateDeleteButton();
    });

    // Delete modal handlers
    document.getElementById('cancel-delete').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        deleteIds = [];
    });

    document.getElementById('confirm-delete').addEventListener('click', performDelete);

    // Update delete button click handler
    document.getElementById('delete-selected')?.addEventListener('click', () => {
        const selectedIds = Array.from(document.querySelectorAll('.message-checkbox:checked'))
            .map(checkbox => checkbox.dataset.id);
        if (selectedIds.length > 0) {
            showDeleteModal(selectedIds, true);
        }
    });

    // Welcome modal handler
    const welcomeModal = document.getElementById('welcome-modal');
    const welcomeClose = document.getElementById('welcome-close');
    
    welcomeClose.addEventListener('click', () => {
        welcomeModal.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            welcomeModal.classList.add('hidden');
        }, 300);
    });
});
