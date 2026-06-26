// utils.js — Shared utility functions

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₹0';
    const n = Number(amount);
    if (isNaN(n)) return '₹0';
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Get the phone number from the JWT token (stored as 'sub' claim)
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

// Set active nav link based on current page
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

// Set topbar phone number on all customer pages
function initTopbar() {
    const phone = getPhoneFromToken();
    const user = getCurrentUserSync();
    const name = user ? user.username : '';

    const el1 = document.getElementById('topbar-phone');
    const el2 = document.getElementById('topbar-phone2');
    
    // Use the name (stored in user.username during login) instead of the phone number
    if (el1) el1.textContent = name || phone || 'Customer';
    if (el2) el2.textContent = name || phone || 'Customer';
    setActiveNav();
}

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

document.addEventListener('DOMContentLoaded', initMobileSidebar);
