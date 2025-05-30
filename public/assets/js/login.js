async function verifyPassword(password) {
    try {
        const response = await fetch('/api/verify-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await response.json();
        if (data.valid && data.token) {
            localStorage.setItem('adminToken', data.token);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('error-message');
    
    if (await verifyPassword(password)) {
        window.location.href = '/dashboard';
    } else {
        errorMsg.classList.add('visible');
        document.getElementById('admin-password').value = '';
    }
});
