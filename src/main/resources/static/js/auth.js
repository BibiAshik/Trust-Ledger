// auth.js — JWT-based authentication management
const USER_KEY = 'tl_user';

// ──────────────────────────────────────────────
// Login — POST to /api/auth/login, store JWT
// ──────────────────────────────────────────────
async function login(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Invalid credentials');
    }

    const data = await response.json();
    setToken(data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify({
        username: data.username,
        role: data.role,
        isFirstLogin: data.isFirstLogin || false
    }));
    return data;
}

// ──────────────────────────────────────────────
// Logout — clear local state and redirect
// ──────────────────────────────────────────────
function logout() {
    removeToken();
    const isCustomerPage = window.location.pathname.includes('/customer/');
    window.location.href = isCustomerPage ? '/customer/customer-login.html' : '/shop-owner/shop-login.html';
}

// ──────────────────────────────────────────────
// Get current user from localStorage
// ──────────────────────────────────────────────
function getCurrentUserSync() {
    localStorage.removeItem(USER_KEY);
    const stored = sessionStorage.getItem(USER_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
}

// Decode JWT payload to check expiry client-side (no network call needed)
function isTokenValid() {
    const token = getToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
}

// ──────────────────────────────────────────────
// checkAuth — called automatically on every protected page load
// Redirects to login if token is missing/expired.
// Redirects to correct portal based on role.
// ──────────────────────────────────────────────
async function checkAuth() {
    const path = window.location.pathname;

    // Skip auth check on public pages
    const isPublicPage = isPublicAuthPage(path);
    if (isPublicPage) return;

    // Check token validity
    if (!isTokenValid()) {
        removeToken();
        const isCustomerPage = path.includes('/customer/');
        window.location.href = isCustomerPage ? '/customer/customer-login.html' : '/shop-owner/shop-login.html';
        return;
    }

    const user = getCurrentUserSync();
    if (!user) {
        removeToken();
        window.location.href = '/shop-owner/shop-login.html';
        return;
    }

    // ── Role-based route guards ──
    if (user.role === 'ROLE_CUSTOMER') {
        // Customer trying to access admin pages → redirect to customer dashboard
        if (!path.includes('/customer/')) {
            window.location.href = '/customer/dashboard.html';
            return;
        }
        // First-login customer must set password before accessing dashboard
        if (user.isFirstLogin && !path.endsWith('first-login.html')) {
            window.location.href = '/customer/first-login.html';
            return;
        }
        // If already set password, skip the first-login page
        if (!user.isFirstLogin && path.endsWith('first-login.html')) {
            window.location.href = '/customer/dashboard.html';
            return;
        }

    } else if (user.role === 'ROLE_ADMIN') {
        // Admin trying to access customer pages → redirect to admin dashboard
        if (path.includes('/customer/')) {
            window.location.href = '/shop-owner/dashboard.html';
            return;
        }
    }

    // Show the username in the page header if the element exists
    const userDisplay = document.getElementById('username-display');
    if (userDisplay) userDisplay.innerText = user.username || 'User';
}

// ──────────────────────────────────────────────
// redirectIfAuthenticated — used on login pages
// If already logged in, send to the right dashboard
// ──────────────────────────────────────────────
function redirectIfAuthenticated() {
    if (!isTokenValid()) return;
    const user = getCurrentUserSync();
    if (!user) return;

    if (user.role === 'ROLE_CUSTOMER') {
        window.location.href = user.isFirstLogin
            ? '/customer/first-login.html'
            : '/customer/dashboard.html';
    } else {
        window.location.href = '/shop-owner/dashboard.html';
    }
}

// ──────────────────────────────────────────────
// Auto-run checkAuth on every page load
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
