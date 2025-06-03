function showWelcomePopup() {
    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center z-50 animate-fadeIn';
    popup.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-90 opacity-0 translate-y-4">
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6 animate-bounce">
                    <i class="fas fa-paper-plane text-2xl text-indigo-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-4 animate-fadeInUp" style="animation-delay: 0.2s">
                    Selamat Datang di UMNUfes! 👋
                </h2>
                <p class="text-gray-600 mb-6 animate-fadeInUp" style="animation-delay: 0.3s">
                    Saat ini website masih dalam tahap pengembangan (BETA). 
                    Jika Anda menemukan masalah atau bug, silakan laporkan di 
                    <a href="/support" class="text-indigo-600 hover:text-indigo-700 font-medium">
                        halaman support
                    </a>
                </p>
                <button id="welcome-close" class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all duration-200 animate-fadeInUp hover:scale-105 transform" style="animation-delay: 0.4s">
                    Mengerti
                </button>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeInUp {
            from { 
                opacity: 0;
                transform: translateY(20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes scaleIn {
            from { 
                transform: scale(0.95) translateY(10px);
                opacity: 0;
            }
            to { 
                transform: scale(1) translateY(0);
                opacity: 1;
            }
        }
        .animate-fadeIn {
            animation: fadeIn 0.3s ease forwards;
        }
        .animate-fadeInUp {
            opacity: 0;
            animation: fadeInUp 0.5s ease forwards;
        }
        .animate-bounce {
            animation: bounce 1s infinite;
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.querySelector('.bg-white').style.transform = 'scale(1) translateY(0)';
        popup.querySelector('.bg-white').style.opacity = '1';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }, 10);

    document.getElementById('welcome-close').addEventListener('click', () => {
        popup.style.opacity = '0';
        popup.querySelector('.bg-white').style.transform = 'scale(0.95) translateY(10px)';
        popup.querySelector('.bg-white').style.opacity = '0';
        setTimeout(() => {
            popup.remove();
            style.remove();
        }, 300);
    });
}

document.addEventListener('DOMContentLoaded', showWelcomePopup);
