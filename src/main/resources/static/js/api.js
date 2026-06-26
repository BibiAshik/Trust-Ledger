// api.js — JWT-aware fetch wrapper
const TOKEN_KEY = 'tl_token';
const AUTH_USER_KEY = 'tl_user';

function isPublicAuthPage(path = window.location.pathname) {
    return path === '/'
        || path.endsWith('/shop-login.html')
        || path.endsWith('/customer-login.html')
        || path.endsWith('/reset-password.html');
}

function clearLegacySharedAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}

function getToken() {
    clearLegacySharedAuth();
    return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    clearLegacySharedAuth();
    sessionStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    clearLegacySharedAuth();
}

async function fetchApi(url, options = {}) {
    const token = getToken();
    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        // Only auto-redirect if we're NOT on a login page already
        const path = window.location.pathname;
        const isLoginPage = isPublicAuthPage(path);

        if (!isLoginPage) {
            removeToken();
            const isCustomerPage = path.includes('/customer/');
            window.location.href = isCustomerPage ? '/customer/customer-login.html' : '/shop-owner/shop-login.html';
        }
        throw new Error('Unauthorized');
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
        const errData = isJson ? await response.json().catch(() => ({})) : {};
        throw new Error(errData.error || `Request failed (${response.status})`);
    }

    if (!isJson) return null;
    return await response.json();
}
