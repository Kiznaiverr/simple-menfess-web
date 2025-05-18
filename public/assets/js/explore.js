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
        `;
        container.appendChild(card);
    });
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
