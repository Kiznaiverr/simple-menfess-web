const messageState = {
    items: [],
    sortDirection: 'desc',
    currentPage: 1,
    pageSize: 8  // Show 8 messages per page (2x4 grid)
};

async function loadMessages() {
    try {
        const result = await apiService.getMessages();
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        messageState.items = result.data.messages;
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

    // Get paginated slice of messages
    const start = (messageState.currentPage - 1) * messageState.pageSize;
    const paged = filtered.slice(start, start + messageState.pageSize);
    
    displayMessages(paged);
    renderPagination(filtered.length);
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
                        Untuk : ${msg.recipientName}
                    </span>
                    <span class="text-xs text-gray-500">
                        ${date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: false // Change to 24-hour format
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

function renderPagination(totalItems) {
    const container = document.createElement('div');
    container.className = 'flex justify-center items-center space-x-2 py-6';
    const totalPages = Math.ceil(totalItems / messageState.pageSize);

    // Previous button
    const prevBtn = createPaginationButton(
        '<i class="fas fa-chevron-left"></i>',
        () => {
            if (messageState.currentPage > 1) {
                messageState.currentPage--;
                filterAndDisplayMessages();
            }
        },
        messageState.currentPage === 1
    );
    container.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= messageState.currentPage - 1 && i <= messageState.currentPage + 1)
        ) {
            const btn = createPaginationButton(
                i,
                () => {
                    messageState.currentPage = i;
                    filterAndDisplayMessages();
                },
                false,
                i === messageState.currentPage
            );
            container.appendChild(btn);
        } else if (
            i === messageState.currentPage - 2 || 
            i === messageState.currentPage + 2
        ) {
            const dots = document.createElement('span');
            dots.className = 'px-2 text-gray-500';
            dots.textContent = '...';
            container.appendChild(dots);
        }
    }

    // Next button
    const nextBtn = createPaginationButton(
        '<i class="fas fa-chevron-right"></i>',
        () => {
            if (messageState.currentPage < totalPages) {
                messageState.currentPage++;
                filterAndDisplayMessages();
            }
        },
        messageState.currentPage === totalPages
    );
    container.appendChild(nextBtn);

    // Replace existing pagination if any
    const existingPagination = document.getElementById('messages-pagination');
    if (existingPagination) {
        existingPagination.remove();
    }
    container.id = 'messages-pagination';
    document.getElementById('messages-container').after(container);
}

function createPaginationButton(content, onClick, disabled = false, isActive = false) {
    const button = document.createElement('button');
    button.innerHTML = content;
    button.className = `
        px-3 py-2 rounded-lg
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

    const textarea = modal.querySelector('#report-reason');
    setTimeout(() => textarea.focus(), 100);

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
        const result = await apiService.reportMessage(id, reason);

        if (result.success) {
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg z-50';
            notification.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-check-circle mr-2"></i>
                    <p>Message reported successfully</p>
                </div>
            `;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('opacity-0');
                setTimeout(() => notification.remove(), 300);
            }, 3000);

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
    document.getElementById('search-messages').addEventListener('input', () => {
        messageState.currentPage = 1;
        filterAndDisplayMessages();
    });
    
    // Date filter handler
    document.getElementById('date-filter').addEventListener('change', () => {
        messageState.currentPage = 1;
        filterAndDisplayMessages();
    });
    
    // Sort handler
    document.getElementById('sort-date').addEventListener('click', () => {
        messageState.sortDirection = messageState.sortDirection === 'desc' ? 'asc' : 'desc';
        const icon = document.querySelector('#sort-date i');
        icon.className = messageState.sortDirection === 'desc' ? 
            'fas fa-sort-amount-down' : 'fas fa-sort-amount-up';
        filterAndDisplayMessages();
    });
});
