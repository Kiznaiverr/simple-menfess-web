function showDbErrorPopup() {
    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 flex items-center justify-center z-50';
    popup.innerHTML = `
        <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 border border-white/20">
            <div class="text-center">
                <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-900 mb-2">System Unavailable</h3>
                <p class="text-gray-600 mb-6">
                    We're experiencing technical difficulties. Our team has been notified and is working to resolve this issue.
                </p>
                <div class="flex justify-center space-x-3">
                    <button onclick="window.location.reload()" 
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>Try Again
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);

    // Remove popup after 5 seconds
    setTimeout(() => {
        popup.classList.add('fade-out');
        setTimeout(() => popup.remove(), 300);
    }, 5000);
}
