// app.js

// Fetch helper with simple error handling
async function fetchApi(url, options = {}) {
    try {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {})
            }
        });
        if (response.status === 401) {
            window.location.href = './index.html';
            return null;
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        alert('Something went wrong. Please try again.');
        return null;
    }
}

async function getCurrentUser() {
    const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        return { authenticated: false };
    }

    return response.json();
}

// Check authentication status on page load (except login)
async function checkAuth() {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        return;
    }
    const user = await getCurrentUser();
    if (!user || !user.authenticated) {
        window.location.href = './index.html';
    } else {
        const userDisplay = document.getElementById('username-display');
        if(userDisplay) userDisplay.innerText = user.username;
    }
}

async function redirectIfAuthenticated() {
    const user = await getCurrentUser();
    if (user && user.authenticated) {
        window.location.href = './dashboard.html';
    }
}

// Handle Logout
function logout() {
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin'
    }).then(() => {
        window.location.href = './index.html';
    });
}

// Format currency
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return 'Rs. 0.00';
    return 'Rs. ' + Number(amount).toFixed(2);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
