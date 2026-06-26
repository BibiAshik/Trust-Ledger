// modal.js — Forgot Password modal logic (shared by index.html and customer-login.html)

function initForgotPasswordModal() {
    const overlay = document.getElementById('forgotPasswordModal');
    const closeBtn = document.getElementById('modalClose');
    const form = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('forgotEmail');
    const submitBtn = document.getElementById('forgotSubmitBtn');
    const errorEl = document.getElementById('forgotError');
    const formView = document.getElementById('forgotFormView');
    const successView = document.getElementById('forgotSuccessView');

    // Open modal
    document.querySelectorAll('[data-open-forgot]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            overlay.classList.add('active');
            emailInput.value = '';
            errorEl.style.display = 'none';
            formView.style.display = 'block';
            successView.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
            setTimeout(() => emailInput.focus(), 100);
        });
    });

    // Close modal
    function closeModal() {
        overlay.classList.remove('active');
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        errorEl.style.display = 'none';

        if (!email || !email.includes('@')) {
            errorEl.textContent = 'Please enter a valid email address.';
            errorEl.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const resp = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            // Always show success (security: don't reveal if email exists)
            formView.style.display = 'none';
            successView.style.display = 'block';
        } catch (err) {
            errorEl.textContent = 'Something went wrong. Please try again.';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
        }
    });
}

document.addEventListener('DOMContentLoaded', initForgotPasswordModal);
