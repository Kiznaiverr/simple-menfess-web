const ADMIN_PASSWORD = 'admin123'; // In real app, use proper authentication

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const errorMessage = document.getElementById('error-message');
    
    if (password === ADMIN_PASSWORD) {
        // Store auth state
        sessionStorage.setItem('isLoggedIn', 'true');
        // Redirect to dashboard
        window.location.href = '/dashboard';
    } else {
        errorMessage.classList.add('visible');
        setTimeout(() => errorMessage.classList.remove('visible'), 3000);
    }
});
