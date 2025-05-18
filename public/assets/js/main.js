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
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageCard.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            To: ${msg.recipientName}
                        </span>
                    </div>
                    <span class="text-xs text-gray-500">${formattedDate}</span>
                </div>
                <p class="text-gray-600 mt-3">${msg.message}</p>
            </div>
            <div class="px-6 py-3 bg-gray-50 flex justify-end items-center">
                <span class="text-xs text-gray-400">Anonymous</span>
            </div>
        `;
        
        messagesContainer.appendChild(messageCard);
    });
}

async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
            if (response.status === 503) {
                showDbErrorPopup();
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
        showDbErrorPopup();
        document.getElementById('no-messages').classList.remove('hidden');
    }
}

async function sendMessage(recipient, message) {
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipient, message })
        });

        if (!response.ok) throw new Error('Failed to send message');
        await loadMessages(); // Reload messages after sending
        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
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
        } else {
            alert('Failed to send message. Please try again.');
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
            } else {
                alert('Failed to send message. Please try again.');
            }
        }
    });

    // Start loading messages
    loadMessages();
    setInterval(loadMessages, 3 * 60 * 1000);
});
