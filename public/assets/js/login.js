async function verifyPassword(password) {
    try {
        const result = await apiService.verifyAdmin(password);
        return result.success && result.data.valid && result.data.token;
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
