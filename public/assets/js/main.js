let messages = [];
let lastDisplayedMessages = [];

// Add updateLastRefresh function
function updateLastRefresh() {
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

// Escape HTML function
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Display messages function
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messages-container');
    const noMessagesDiv = document.getElementById('no-messages');
    
    messagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        noMessagesDiv.classList.remove('hidden');
        return;
    }
    
    noMessagesDiv.classList.add('hidden');
    
    messages.forEach(msg => {
        const messageCard = document.createElement('div');
        messageCard.className = 'message-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition';
        
        const date = new Date(msg.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: false // Change to 24-hour format
        });
        
        // Use textContent for safe insertion
        const recipientSpan = document.createElement('span');
        recipientSpan.textContent = msg.recipientName;
        recipientSpan.className = 'inline-block px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800';
        
        const messageP = document.createElement('p');
        messageP.textContent = msg.message;
        messageP.className = 'text-gray-600 mt-3';

        messageCard.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <div id="recipient-container-${msg._id}"></div>
                    <span class="text-xs text-gray-500">${formattedDate}</span>
                </div>
                <div id="message-container-${msg._id}"></div>
            </div>
            <div class="px-6 py-3 bg-gray-50 flex justify-end items-center">
                <span class="text-xs text-gray-400">Anonymous</span>
            </div>
        `;
        
        // Safely append content
        messageCard.querySelector(`#recipient-container-${msg._id}`).appendChild(recipientSpan);
        messageCard.querySelector(`#message-container-${msg._id}`).appendChild(messageP);
        
        messagesContainer.appendChild(messageCard);
    });
}

async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
            if (response.status === 503) {
                // Show retryable error
                const retryAfter = 5;
                showErrorPopup(`Connection error. Retrying in ${retryAfter} seconds...`);
                setTimeout(loadMessages, retryAfter * 1000);
                return;
            }
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (!data || !data.messages) {
            throw new Error('Invalid data format');
        }

        // Sort all messages by timestamp (newest first)
        const sortedMessages = data.messages.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        // Get latest 6 messages
        const recentMessages = sortedMessages.slice(0, 6);
        
        if (recentMessages.length > 0) {
            lastDisplayedMessages = recentMessages;
            displayMessages(recentMessages);
            updateLastRefresh();
        } else {
            document.getElementById('no-messages').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('no-messages').classList.remove('hidden');
        showErrorPopup('Unable to load messages. Please try again later.');
    }
}

// Update sendMessage function
async function sendMessage(recipient, message) {
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipient, message })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 400) {
                showBadWordError(data.error || 'Invalid message content');
                return false;
            }
            if (response.status === 429) {
                if (data.redirect) {
                    window.location.href = data.redirect;
                    return false;
                }
                showRateLimitError(data.error);
                return false;
            }
            throw new Error('Failed to send message');
        }

        await loadMessages();
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        showErrorPopup('Failed to send message. Please try again.');
        return false;
    }
}

function showRateLimitError(message) {
    const popup = document.createElement('div');
    popup.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg z-50 animate-fade-in';
    popup.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
                <i class="fas fa-clock text-2xl text-yellow-500"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold mb-1">Batas Pengiriman Tercapai</h4>
                <p class="text-sm">${message}</p>
                <p class="text-xs text-yellow-600 mt-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    Mohon tunggu beberapa saat
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.classList.add('opacity-0');
        setTimeout(() => popup.remove(), 300);
    }, 5000);
}

// Add new function for bad word error popup
function showBadWordError(message) {
    const popup = document.createElement('div');
    popup.className = 'fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50 animate-fade-in';
    popup.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold mb-1">Pesan Tidak Dapat Dikirim</h4>
                <p class="text-sm">${message}</p>
                <p class="text-xs text-red-600 mt-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    Mohon gunakan bahasa yang sopan
                </p>
            </div>
        </div>
    `;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute top-2 right-2 text-red-400 hover:text-red-600';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = () => popup.remove();
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);

    // Auto remove after 5 seconds
    setTimeout(() => {
        popup.classList.add('opacity-0');
        setTimeout(() => popup.remove(), 300);
    }, 5000);
}

// Update showErrorPopup styling
function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg z-50 animate-fade-in max-w-md';
    popup.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-xl text-red-500"></i>
            </div>
            <div class="flex-1">
                <p class="font-medium text-red-700">${message}</p>
                <p class="text-sm text-red-600 mt-1">Mohon gunakan bahasa yang sopan</p>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    // Add fade out animation
    setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 500);
    }, 5000);
}

// Offline detection
window.addEventListener('offline', () => {
    window.location.href = '/offline';
});

window.addEventListener('online', () => {
    window.location.reload();
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('message-form');
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    
    // Remove floating button from DOM
    const floatingBtn = document.getElementById('new-message-btn');
    if (floatingBtn) floatingBtn.remove();

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const recipient = document.getElementById('recipient').value;
        const message = document.getElementById('message').value;
        
        if (!recipient || !message) return;
        
        const success = await sendMessage(recipient, message);
        if (success) {
            messageForm.reset();
            confirmationModal.classList.remove('hidden');
        }
    });

    modalCloseBtn.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            confirmationModal.classList.add('hidden');
        }
    });

    // Add Enter key handler for message input
    document.getElementById('message').addEventListener('keydown', async (e) => {
        // Check if Enter was pressed without Shift (Shift+Enter for new line)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default new line
            
            const recipient = document.getElementById('recipient').value;
            const message = e.target.value.trim();
            
            if (!recipient || !message) return;
            
            const success = await sendMessage(recipient, message);
            if (success) {
                messageForm.reset();
                confirmationModal.classList.remove('hidden');
            }
        }
    });

    // Start loading messages
    loadMessages();
    setInterval(loadMessages, 3 * 60 * 1000);
});
