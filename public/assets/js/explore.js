const messageState = {
    items: [],
    sortDirection: 'desc'
};

async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        messageState.items = data.messages;
        filterAndDisplayMessages();
    } catch (error) {
        console.error('Error loading messages:', error);
        document.getElementById('no-messages').classList.remove('hidden');
    }
}

function filterAndDisplayMessages() {
    const searchTerm = document.getElementById('search-messages').value.toLowerCase();
    const dateFilter = document.getElementById('date-filter').value;
    let filtered = [...messageState.items];

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(msg => 
            msg.message.toLowerCase().includes(searchTerm) ||
            msg.recipientName.toLowerCase().includes(searchTerm)
        );
    }

    // Apply date filter
    if (dateFilter) {
        const filterDate = new Date(dateFilter).toDateString();
        filtered = filtered.filter(msg => 
            new Date(msg.timestamp).toDateString() === filterDate
        );
    }

    // Sort messages
    filtered.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return messageState.sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });

    displayMessages(filtered);
}

function displayMessages(messages) {
    const container = document.getElementById('messages-container');
    const noMessages = document.getElementById('no-messages');
    container.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        noMessages.classList.remove('hidden');
        return;
    }
    
    noMessages.classList.add('hidden');
    messages.forEach(msg => {
        const date = new Date(msg.timestamp);
        const card = document.createElement('div');
        card.className = 'message-card bg-white rounded-xl shadow-md overflow-hidden h-full';
        card.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        To: ${msg.recipientName}
                    </span>
                    <span class="text-xs text-gray-500">
                        ${date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <p class="text-gray-600 mt-3">${msg.message}</p>
            </div>
            <div class="px-6 py-3 bg-gray-50 flex justify-end items-center relative">
                <button onclick="showReportModal('${msg._id}')" 
                    class="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 absolute inset-y-0 right-0 px-6 z-10">
                    <i class="fas fa-flag"></i>
                    Report
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function showReportModal(id) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 transform transition-all scale-100 opacity-100">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                    <i class="fas fa-flag text-red-500 mr-2"></i>
                    Report Message
                </h3>
                <button onclick="closeReportModal(this)" class="text-gray-400 hover:text-gray-500 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form onsubmit="submitReport(event, '${id}')" class="space-y-4" id="report-form">
                <div>
                    <textarea id="report-reason" 
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        placeholder="Please describe why you're reporting this message..." 
                        rows="4"
                        required></textarea>
                </div>
                <div class="flex justify-end space-x-3">
                    <button type="button" 
                        onclick="closeReportModal(this)" 
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                        <i class="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button type="submit" 
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center">
                        <i class="fas fa-flag mr-2"></i>
                        Submit Report
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Focus textarea and handle Enter key
    const textarea = modal.querySelector('#report-reason');
    setTimeout(() => textarea.focus(), 100);

    // Handle Ctrl+Enter submit
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            modal.querySelector('form').dispatchEvent(new Event('submit'));
        }
    });
}

function closeReportModal(element) {
    const modal = element.closest('.fixed');
    modal.classList.add('opacity-0', 'scale-95');
    setTimeout(() => modal.remove(), 200);
}

async function submitReport(event, id) {
    event.preventDefault();
    const reason = document.getElementById('report-reason').value;
    if (!reason) return;
    
    try {
        const response = await fetch(`/api/messages/${id}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });

        if (response.ok) {
            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50';
            notification.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-2"></i>
                    <p>Message reported successfully</p>
                </div>
            `;
            document.body.appendChild(notification);

            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.classList.add('opacity-0');
                setTimeout(() => notification.remove(), 300);
            }, 3000);

            // Close modal
            closeReportModal(document.getElementById('report-reason'));
        }
    } catch (error) {
        console.error('Error reporting message:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    
    // Search handler
    document.getElementById('search-messages').addEventListener('input', filterAndDisplayMessages);
    
    // Date filter handler
    document.getElementById('date-filter').addEventListener('change', filterAndDisplayMessages);
    
    // Sort handler
    document.getElementById('sort-date').addEventListener('click', () => {
        messageState.sortDirection = messageState.sortDirection === 'desc' ? 'asc' : 'desc';
        const icon = document.querySelector('#sort-date i');
        icon.className = messageState.sortDirection === 'desc' ? 
            'fas fa-sort-amount-down' : 'fas fa-sort-amount-up';
        filterAndDisplayMessages();
    });
});
