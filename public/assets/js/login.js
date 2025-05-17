const ADMIN_PASSWORD = 'admin123'; // In real app, use proper authentication

async function verifyPassword(password) {
    try {
        const response = await fetch(`/api/verify-admin?password=${encodeURIComponent(password)}`);
        const data = await response.json();
        return data.valid;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    
    if (await verifyPassword(password)) {
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = '/dashboard';
    } else {
        document.getElementById('error-message').classList.add('visible');
    }
});
