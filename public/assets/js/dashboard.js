// Session management
const SESSION_TIMEOUT = 5 * 60 * 1000;
const WARNING_TIME = 1 * 60 * 1000;
let sessionTimer;
let warningTimer;
let lastActivity = Date.now();

function resetSessionTimer() {
    lastActivity = Date.now();
    clearTimeout(sessionTimer);
    clearTimeout(warningTimer);
    warningTimer = setTimeout(showSessionWarning, SESSION_TIMEOUT - WARNING_TIME);
    sessionTimer = setTimeout(endSession, SESSION_TIMEOUT);
}

function showSessionWarning() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <p>Your session will expire in 1 minute due to inactivity.</p>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function endSession() {
    const sessionModal = document.getElementById('session-modal');
    sessionModal.classList.remove('hidden');
    sessionStorage.removeItem('isLoggedIn');
    setTimeout(() => {
        window.location.href = '/login';
    }, 3000);
}

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
        updateReportedCount();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

let currentPage = 1;
const pageSize = 10; // Messages per page

function displayMessages(messagesToShow = messages) {
    const tbody = document.getElementById('messages-table');
    tbody.innerHTML = '';
    
    // Get paginated slice of messages
    const start = (currentPage - 1) * pageSize;
    const pagedMessages = messagesToShow.slice(start, start + pageSize);
    
    pagedMessages.forEach(msg => {
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
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: false
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

    renderPagination(messagesToShow.length);
    updateDeleteButton();
}

function renderPagination(totalItems) {
    const container = document.getElementById('messages-pagination');
    if (!container) return;

    const totalPages = Math.ceil(totalItems / pageSize);
    container.innerHTML = '';

    const prevBtn = createPaginationButton(
        '<i class="fas fa-chevron-left"></i>',
        () => {
            if (currentPage > 1) {
                currentPage--;
                displayMessages();
            }
        },
        currentPage === 1
    );
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= currentPage - 1 && i <= currentPage + 1)
        ) {
            const btn = createPaginationButton(
                i,
                () => {
                    currentPage = i;
                    displayMessages();
                },
                false,
                i === currentPage
            );
            container.appendChild(btn);
        } else if (
            i === currentPage - 2 || 
            i === currentPage + 2
        ) {
            const dots = document.createElement('span');
            dots.className = 'px-2 text-gray-500';
            dots.textContent = '...';
            container.appendChild(dots);
        }
    }

    const nextBtn = createPaginationButton(
        '<i class="fas fa-chevron-right"></i>',
        () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayMessages();
            }
        },
        currentPage === totalPages
    );
    container.appendChild(nextBtn);
}

function createPaginationButton(content, onClick, disabled = false, isActive = false) {
    const button = document.createElement('button');
    button.innerHTML = content;
    button.className = `
        px-3 py-2 mx-1 rounded-lg
        ${isActive 
            ? 'bg-indigo-500 text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `;
    if (!disabled) {
        button.onclick = onClick;
    }
    button.disabled = disabled;
    return button;
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
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ ids: deleteIds })
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = '/login';
            return;
        }

        if (response.ok) {
            await Promise.all([loadMessages(), loadReportedMessages()]);
        }
    } catch (error) {
        console.error('Error deleting messages:', error);
    } finally {
        deleteModal.classList.add('hidden');
        deleteIds = [];
    }
}

async function dismissReport(messageId) {
    try {
        const response = await fetch(`/api/messages/${messageId}/dismiss-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            await loadReportedMessages();
        }
    } catch (error) {
        console.error('Error dismissing report:', error);
    }
}

function updateStats() {
    const totalMessages = messages.length;
    const today = new Date().toDateString();
    const todayMessages = messages.filter(msg => 
        new Date(msg.timestamp).toDateString() === today
    ).length;
    const uniqueRecipients = new Set(messages.map(msg => msg.recipient)).size;
    document.getElementById('total-messages').textContent = totalMessages;
    document.getElementById('today-messages').textContent = todayMessages;
    document.getElementById('active-recipients').textContent = uniqueRecipients;
}

async function updateSystemInfo() {
    try {
        const response = await fetch('/api/system-info');
        const data = await response.json();
        const cpuBar = document.getElementById('cpu-load');
        const cpuText = document.getElementById('cpu-text');
        const cpuUsage = parseFloat(data.cpu.usage);
        cpuBar.style.width = `${cpuUsage}%`;
        cpuText.textContent = `CPU Load: ${cpuUsage}%`;
        if (cpuUsage > 80) {
            cpuBar.className = 'h-2 rounded-full bg-red-500 transition-all duration-500';
        } else if (cpuUsage > 50) {
            cpuBar.className = 'h-2 rounded-full bg-yellow-500 transition-all duration-500';
        } else {
            cpuBar.className = 'h-2 rounded-full bg-green-500 transition-all duration-500';
        }
        const ramBar = document.getElementById('ram-usage');
        const ramText = document.getElementById('ram-text');
        const ramUsage = parseFloat(data.memory.usagePercent);
        ramBar.style.width = `${ramUsage}%`;
        ramText.textContent = `RAM: ${data.memory.used}GB / ${data.memory.total}GB (${ramUsage}%)`;
        if (ramUsage > 80) {
            ramBar.className = 'h-2 rounded-full bg-red-500 transition-all duration-500';
        } else if (ramUsage > 50) {
            ramBar.className = 'h-2 rounded-full bg-yellow-500 transition-all duration-500';
        } else {
            ramBar.className = 'h-2 rounded-full bg-green-500 transition-all duration-500';
        }
        const dbStatus = document.getElementById('db-status');
        dbStatus.innerHTML = data.dbStatus === 'connected' ? 
            '<i class="fas fa-circle text-xs mr-1 text-green-500"></i><span>Connected</span>' : 
            '<i class="fas fa-circle text-xs mr-1 text-red-500"></i><span>Disconnected</span>';
        if (data.database) {
            const dbSizeText = document.getElementById('db-size-text');
            const dbStorageBar = document.getElementById('db-storage-bar');
            const dbCollections = document.getElementById('db-collections');
            const dbObjects = document.getElementById('db-objects');
            dbSizeText.textContent = `${data.database.size} / ${data.database.maxSize}`;
            dbStorageBar.style.width = `${data.database.usagePercent}%`;
            dbCollections.textContent = data.database.collections;
            dbObjects.textContent = data.database.objects;
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
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    } catch (error) {
        console.error('Error updating system info:', error);
    }
}

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

setInterval(updateSystemInfo, 2000);
updateSystemInfo();

function setupSearch() {
    const searchInput = document.getElementById('message-search-table');
    searchInput.addEventListener('input', (e) => {
        currentPage = 1; // Reset to first page on search
        const searchTerm = e.target.value.toLowerCase();
        const filteredMessages = messages.filter(msg => 
            msg.recipientName.toLowerCase().includes(searchTerm) ||
            msg.message.toLowerCase().includes(searchTerm)
        );
        displayMessages(filteredMessages);
    });
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('message-checkbox')) {
        updateDeleteButton();
    }
});

async function loadReportedMessages() {
    try {
        const response = await fetch('/api/messages/reported');
        const data = await response.json();
        displayReportedMessages(data.messages);
    } catch (error) {
        console.error('Error loading reported messages:', error);
    }
}

function displayReportedMessages(messages) {
    const container = document.getElementById('reported-messages-table');
    if (!container) return;
    container.innerHTML = '';
    messages.forEach(msg => {
        const date = new Date(msg.timestamp);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-900">${msg.recipientName}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${msg.message}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${msg.reports.map(r => r.reason).join(', ')}
            </td>
            <td class="px-6 py-4 text-sm space-x-2">
                <button class="text-red-600 hover:text-red-900" onclick="showDeleteModal('${msg._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button class="text-green-600 hover:text-green-900" onclick="dismissReport('${msg._id}')">
                    <i class="fas fa-check"></i> Keep
                </button>
            </td>
        `;
        container.appendChild(tr);
    });
}

function updateReportedCount() {
    const reportedMessages = messages.filter(msg => msg.isReported);
    const countElement = document.getElementById('reported-count');
    countElement.textContent = reportedMessages.length;
}

document.getElementById('current-year').textContent = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    resetSessionTimer();
    trackActivity();
    loadMessages().then(() => {
        displayMessages();
        updateStats();
    });
    setupSearch();
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
    });
    document.getElementById('select-all')?.addEventListener('change', (e) => {
        document.querySelectorAll('.message-checkbox').forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        updateDeleteButton();
    });
    document.getElementById('cancel-delete').addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        deleteIds = [];
    });
    document.getElementById('confirm-delete').addEventListener('click', performDelete);
    document.getElementById('delete-selected')?.addEventListener('click', () => {
        const selectedIds = Array.from(document.querySelectorAll('.message-checkbox:checked'))
            .map(checkbox => checkbox.dataset.id);
        if (selectedIds.length > 0) {
            showDeleteModal(selectedIds, true);
        }
    });
    const welcomeModal = document.getElementById('welcome-modal');
    const welcomeClose = document.getElementById('welcome-close');
    welcomeClose.addEventListener('click', () => {
        welcomeModal.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            welcomeModal.classList.add('hidden');
        }, 300);
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active', 'bg-gray-100');
            });
            button.classList.add('active', 'bg-gray-100');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`${tabName}-messages`).classList.remove('hidden');
            if (tabName === 'reported') {
                loadReportedMessages();
            } else {
                loadMessages();
            }
        });
    });
    loadReportedMessages();
});
