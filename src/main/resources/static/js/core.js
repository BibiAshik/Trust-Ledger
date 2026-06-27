// core.js - Combined shared scripts

// --- api.js ---
// api.js — JWT-aware fetch wrapper
// This file handles all API calls to the backend and automatically attaches the authentication token.

/* ==========================================================================
   SECTION 1: CONSTANTS & HELPERS
   (Simple variables and basic checks)
   ========================================================================== */
const TOKEN_KEY = 'tl_token';
const AUTH_USER_KEY = 'tl_user';

// Checks if the current page is a login or reset password page
function isPublicAuthPage(path = window.location.pathname) {
    return path === '/'
        || path.endsWith('/shop-login.html')
        || path.endsWith('/customer-login.html')
        || path.endsWith('/reset-password.html');
}

/* ==========================================================================
   SECTION 2: TOKEN MANAGEMENT
   (Functions to get, set, and remove the user's login token)
   ========================================================================== */
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

/* ==========================================================================
   SECTION 3: CORE API FETCHER
   (The most complex part: wraps the standard fetch() to handle auth & errors)
   ========================================================================== */
async function fetchApi(url, options = {}) {
    const token = getToken();
    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    // If the user is logged in, attach their token to the request
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    // Automatically set JSON content type if body is a JSON string
    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = 'application/json';
    }

    // Perform the actual network request
    const response = await fetch(url, { ...options, headers });

    // Handle Unauthorized (401) errors -> Redirect to login
    if (response.status === 401) {
        const path = window.location.pathname;
        const isLoginPage = isPublicAuthPage(path);

        if (!isLoginPage) {
            removeToken();
            const isCustomerPage = path.includes('/customer/');
            window.location.href = isCustomerPage ? '/customer/customer-login.html' : '/shop-owner/shop-login.html';
        }
        throw new Error('Unauthorized');
    }

    // Return null for "No Content" responses
    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Handle API errors
    if (!response.ok) {
        const errData = isJson ? await response.json().catch(() => ({})) : {};
        throw new Error(errData.error || `Request failed (${response.status})`);
    }

    // Return parsed JSON data
    if (!isJson) return null;
    return await response.json();
}


// --- auth.js ---
// auth.js — Authentication & Role Management
// Handles logging in, logging out, and protecting pages from unauthorized access.

const USER_KEY = 'tl_user';

/* ==========================================================================
   SECTION 1: LOGIN & LOGOUT
   (Simple functions to log the user in and out)
   ========================================================================== */
   
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

function logout() {
    removeToken();
    const isCustomerPage = window.location.pathname.includes('/customer/');
    window.location.href = isCustomerPage ? '/customer/customer-login.html' : '/shop-owner/shop-login.html';
}

/* ==========================================================================
   SECTION 2: USER & TOKEN DATA
   (Functions to read the saved user data from the browser's memory)
   ========================================================================== */
   
function getCurrentUserSync() {
    localStorage.removeItem(USER_KEY);
    const stored = sessionStorage.getItem(USER_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
}

// Check if the token has expired
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

/* ==========================================================================
   SECTION 3: SECURITY GUARDS & ROUTING
   (The most complex part: automatically checks if the user is allowed to see the page)
   ========================================================================== */
   
// Automatically redirects users to the correct dashboard if they are already logged in
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

// The main security check. Runs on every page load to prevent unauthorized access.
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

    // Role-based route guards
    if (user.role === 'ROLE_CUSTOMER') {
        if (!path.includes('/customer/')) {
            window.location.href = '/customer/dashboard.html';
            return;
        }
        if (user.isFirstLogin && !path.endsWith('first-login.html')) {
            window.location.href = '/customer/first-login.html';
            return;
        }
        if (!user.isFirstLogin && path.endsWith('first-login.html')) {
            window.location.href = '/customer/dashboard.html';
            return;
        }
    } else if (user.role === 'ROLE_ADMIN') {
        if (path.includes('/customer/')) {
            window.location.href = '/shop-owner/dashboard.html';
            return;
        }
    }

    // Show the username in the page header
    const userDisplay = document.getElementById('username-display');
    if (userDisplay) userDisplay.innerText = user.username || 'User';
}

// Auto-run the security check when the page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});


// --- utils.js ---
// utils.js — Shared utility functions
// This file contains helpful functions used across many different pages.

/* ==========================================================================
   SECTION 1: FORMATTING & DATA HELPERS
   (Simple functions to format data nicely)
   ========================================================================== */

// Formats a raw number into Indian Rupee currency (e.g. 1000 -> ₹1,000)
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹0';
    const n = Number(amount);
    if (isNaN(n)) return '₹0';
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Gets the phone number from the JWT token (stored as 'sub' claim)
function getPhoneFromToken() {
    const token = getToken();
    if (!token) return '';
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || '';
    } catch {
        return '';
    }
}

/* ==========================================================================
   SECTION 2: UI & NAVIGATION HELPERS
   (Functions that change the appearance of the user interface)
   ========================================================================== */

// Highlights the active link in the sidebar based on the current URL
function setActiveNav() {
    const current = window.location.pathname.split('/').pop();
    document.querySelectorAll('.cp-nav a, .nav-links a').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href.endsWith(current)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Sets the user's name in the top bar on customer pages
function initTopbar() {
    const phone = getPhoneFromToken();
    const user = getCurrentUserSync();
    const name = user ? user.username : '';

    const el1 = document.getElementById('topbar-phone');
    const el2 = document.getElementById('topbar-phone2');
    
    if (el1) el1.textContent = name || phone || 'Customer';
    if (el2) el2.textContent = name || phone || 'Customer';
    setActiveNav();
}

/* ==========================================================================
   SECTION 3: MOBILE LAYOUT & RESPONSIVENESS
   (Complex logic to handle the mobile sidebar toggle)
   ========================================================================== */

function initMobileSidebar() {
    const sidebar = document.querySelector('.cp-sidebar, .sidebar');
    if (!sidebar || document.querySelector('.mobile-menu-toggle')) {
        setActiveNav();
        return;
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mobile-menu-toggle';
    toggle.setAttribute('aria-label', 'Toggle navigation menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span>';

    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-sidebar-backdrop';

    const closeSidebar = () => {
        document.body.classList.remove('mobile-sidebar-open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    const toggleSidebar = () => {
        const isOpen = document.body.classList.toggle('mobile-sidebar-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
    };

    toggle.addEventListener('click', toggleSidebar);
    backdrop.addEventListener('click', closeSidebar);
    
    // Close sidebar when clicking a link on mobile
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.matchMedia('(max-width: 768px)').matches) {
                closeSidebar();
            }
        });
    });

    document.body.prepend(backdrop);
    document.body.prepend(toggle);
    setActiveNav();
}

// Automatically initialize the mobile sidebar when the page loads
document.addEventListener('DOMContentLoaded', initMobileSidebar);


// --- modal.js ---
// modal.js — Forgot Password modal logic
// Handles the popup window where users can enter their email to reset their password.

function initForgotPasswordModal() {
    /* ==========================================================================
       SECTION 1: HTML ELEMENTS
       (Finding all the buttons, inputs, and screens we need to control)
       ========================================================================== */
    const overlay = document.getElementById('forgotPasswordModal');
    const closeBtn = document.getElementById('modalClose');
    const form = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('forgotEmail');
    const submitBtn = document.getElementById('forgotSubmitBtn');
    const errorEl = document.getElementById('forgotError');
    const formView = document.getElementById('forgotFormView');
    const successView = document.getElementById('forgotSuccessView');

    // If the modal doesn't exist on this page, do nothing
    if (!overlay) return;

    /* ==========================================================================
       SECTION 2: OPENING & CLOSING THE MODAL
       (Simple functions to show and hide the popup)
       ========================================================================== */

    // Function to close the modal
    function closeModal() {
        overlay.classList.remove('active');
    }

    // Close when clicking the "X" button
    closeBtn.addEventListener('click', closeModal);

    // Close when clicking the dark background area
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Close when pressing the Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Find all links that should open this modal and attach the open event
    document.querySelectorAll('[data-open-forgot]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            // Show the modal
            overlay.classList.add('active');
            
            // Reset the form back to its initial state
            emailInput.value = '';
            errorEl.style.display = 'none';
            formView.style.display = 'block';
            successView.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
            
            // Auto-focus the email input
            setTimeout(() => emailInput.focus(), 100);
        });
    });

    /* ==========================================================================
       SECTION 3: FORM SUBMISSION
       (The complex part: sending the email to the backend server)
       ========================================================================== */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        errorEl.style.display = 'none';

        // Basic validation: must not be empty and must have an @ symbol
        if (!email || !email.includes('@')) {
            errorEl.textContent = 'Please enter a valid email address.';
            errorEl.style.display = 'block';
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            // Send request to the backend
            const resp = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            // If successful, hide the form and show the success message
            formView.style.display = 'none';
            successView.style.display = 'block';
            
        } catch (err) {
            // If it fails, show an error message and allow them to try again
            errorEl.textContent = 'Something went wrong. Please try again.';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
        }
    });
}

// Automatically start the modal script when the page finishes loading
document.addEventListener('DOMContentLoaded', initForgotPasswordModal);


// ==========================================
// UTILS: Download Receipt
// ==========================================
window.downloadReceipt = function(paymentId) {
    const token = getToken();
    if (!token) {
        alert('Please login first to download the receipt.');
        return;
    }
    
    fetch('/api/payments/' + paymentId + '/receipt', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to download receipt');
        return response.blob();
    })
    .then(blob => {
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = 'receipt_REC-' + paymentId + '.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    })
    .catch(error => {
        console.error('Download error:', error);
        alert('Failed to download receipt');
    });
};
