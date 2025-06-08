// Main page message logic

let messages = [];
let lastDisplayedMessages = [];

function updateLastRefresh() {
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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
            hour12: false
        });
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
        messageCard.querySelector(`#recipient-container-${msg._id}`).appendChild(recipientSpan);
        messageCard.querySelector(`#message-container-${msg._id}`).appendChild(messageP);
        messagesContainer.appendChild(messageCard);
    });
}

async function loadMessages() {
    try {
        const result = await apiService.getMessages();
        
        if (!result.success) {
            if (result.error.includes('Connection error') || result.error.includes('503')) {
                showErrorPopup(`Connection error. Retrying in 5 seconds...`);
                setTimeout(loadMessages, 5000);
                return;
            }
            throw new Error(result.error);
        }

        const data = result.data;
        if (!data || !data.messages) throw new Error('Invalid data format');
        
        const sortedMessages = data.messages.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
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

// Kirim pesan anonim
async function sendMessage(recipient, message) {
    try {
        const result = await apiService.sendMessage(recipient, message);
        
        if (!result.success) {
            if (result.response?.status === 400) {
                showBadWordError(result.error || 'Invalid message content');
                return false;
            }
            if (result.response?.status === 429) {
                if (result.data?.redirect) {
                    window.location.href = result.data.redirect;
                    return false;
                }
                showRateLimitError(result.error);
                return false;
            }
            throw new Error(result.error);
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
    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute top-2 right-2 text-red-400 hover:text-red-600';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = () => popup.remove();
    popup.appendChild(closeBtn);
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.classList.add('opacity-0');
        setTimeout(() => popup.remove(), 300);
    }, 5000);
}

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

// Init
document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('message-form');
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalCloseBtn = document.getElementById('modal-close');
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

    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            confirmationModal.classList.add('hidden');
        }
    });

    document.getElementById('message').addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
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

    loadMessages();
    setInterval(loadMessages, 3 * 60 * 1000);
});
