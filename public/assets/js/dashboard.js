// Check authentication
if (!sessionStorage.getItem('isLoggedIn')) {
    window.location.href = '/login';
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

function displayMessages() {
    const tbody = document.getElementById('messages-table');
    tbody.innerHTML = '';
    
    messages.forEach(msg => {
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

// Add system info update function
async function updateSystemInfo() {
    try {
        const response = await fetch('/api/system-info');
        if (response.ok) {
            const data = await response.json();
            
            // Update CPU Load if available
            const cpuContainer = document.getElementById('cpu-load-container');
            const cpuBar = document.getElementById('cpu-load-bar');
            if (data.cpuLoad) {
                cpuContainer.classList.remove('hidden');
                const cpuPercentage = Math.round(data.cpuLoad * 100);
                cpuBar.style.width = `${cpuPercentage}%`;
            } else {
                cpuContainer.classList.add('hidden');
            }
            
            // Update Memory Usage if available
            const memoryContainer = document.getElementById('memory-usage-container');
            const memoryBar = document.getElementById('memory-usage-bar');
            if (data.memoryUsage) {
                memoryContainer.classList.remove('hidden');
                const memoryPercentage = Math.round(data.memoryUsage * 100);
                memoryBar.style.width = `${memoryPercentage}%`;
            } else {
                memoryContainer.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error updating system info:', error);
    }
}

// Update system info every 30 seconds
setInterval(updateSystemInfo, 30000);
updateSystemInfo(); // Initial update

// Add event delegation for checkboxes
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('message-checkbox')) {
        updateDeleteButton();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMessages().then(() => {
        displayMessages();
        updateStats();
    });
    
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
