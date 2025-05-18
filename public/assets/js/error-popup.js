function showErrorPopup() {
    const popup = document.createElement('div');
    popup.innerHTML = `
        <div class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl p-6 max-w-md w-full z-50 animate-fade-in">
            <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">System Alert</h3>
                    <p class="text-gray-600">We're experiencing some technical difficulties. Our team has been notified and is working on it. Please try again in a few moments.</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-4">
                    <i class="fas fa-times text-gray-400 hover:text-gray-500"></i>
                </button>
            </div>
            <div class="mt-4 flex justify-end space-x-3">
                <button onclick="window.location.reload()" class="text-sm bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100">
                    <i class="fas fa-sync-alt mr-2"></i>Refresh Page
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    // Auto remove after 10 seconds
    setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 500);
    }, 10000);
}
