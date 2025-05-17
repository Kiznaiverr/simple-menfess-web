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
        const response = await fetch('../data/messages.json');
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
                <input type="checkbox" class="message-checkbox rounded" data-id="${msg.id}">
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
                <button class="text-red-600 hover:text-red-900" onclick="showDeleteModal(${msg.id})">
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
        const response = await fetch('http://localhost:3000/api/messages', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: deleteIds })
        });

        if (response.ok) {
            messages = messages.filter(msg => !deleteIds.includes(msg.id));
            displayMessages();
            updateStats();
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
            .map(checkbox => parseInt(checkbox.dataset.id));
        if (selectedIds.length > 0) {
            showDeleteModal(selectedIds, true);
        }
    });
});
