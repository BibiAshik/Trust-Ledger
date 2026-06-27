// customer.js - Combined Customer scripts

// --- customer-login.js ---
if (window.location.pathname.includes('customer-login.html')) {
  (function() {
// js/customer/customer-login.js
// Handles the login form submission for customers

/* ==========================================================================
   SECTION 1: INITIALIZATION & UI
   (Setup when the page loads, like password toggles)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // If they are already logged in, send them straight to the dashboard
    redirectIfAuthenticated();
});

// Toggle password visibility (eye icon)
document.getElementById('togglePassword').addEventListener('click', function() {
    const pw = document.getElementById('password');
    pw.type = pw.type === 'password' ? 'text' : 'password';
});

/* ==========================================================================
   SECTION 2: FORM SUBMISSION
   (Sending credentials to the server and handling the response)
   ========================================================================== */

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get UI elements
    const errEl = document.getElementById('errorMsg');
    const btn = document.getElementById('loginBtn');
    
    // Reset errors and show loading state
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Logging in...';

    try {
        // Send login request to the backend
        const data = await login(
            document.getElementById('username').value.trim(),
            document.getElementById('password').value
        );
        
        // Redirect based on role and first-login status
        if (data.role === 'ROLE_CUSTOMER') {
            window.location.href = data.isFirstLogin ? '/customer/first-login.html' : '/customer/dashboard.html';
        } else {
            window.location.href = '/shop-owner/dashboard.html';
        }
        
    } catch (err) {
        // Handle errors (invalid password, etc)
        errEl.textContent = err.message || 'Invalid phone/email or password';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = `<svg class="stroke-icon" style="width:18px;height:18px;" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> Login`;
    }
});

  })();
}

// --- dashboard.js ---
if (window.location.pathname.includes('dashboard.html')) {
  (function() {
// js/customer/dashboard.js
// Handles the logic for the customer dashboard

/* ==========================================================================
   SECTION 1: UI UPDATERS
   (Functions that update the text on the screen)
   ========================================================================== */

function updateDashboardStats(loans, payments) {
    if (loans) {
        // Calculate total borrowed amount
        const totalBorrowed = loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0);
        document.getElementById('stat-total').textContent = loans.length;
        document.getElementById('stat-borrowed').textContent = formatCurrency(totalBorrowed);

        // Calculate total balance across all loans
        const balance = loans.reduce((sum, loan) => sum + (loan.remainingPrincipal || 0) + (loan.totalPendingInterest || 0), 0);
        document.getElementById('stat-balance').textContent = formatCurrency(balance);
    }

    if (payments) {
        // Calculate total paid amount
        const totalPaid = (payments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
        document.getElementById('stat-paid').textContent = formatCurrency(totalPaid);
    }
}

function updateRecentLoansTable(loans) {
    if (!loans) return;

    // Get the most recent 3 loans
    const recent = [...loans].reverse().slice(0, 3);
    const tbody = document.getElementById('recentLoansBody');
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:36px;">No loans found</td></tr>';
        return;
    } 
    
    // Generate the table rows
    tbody.innerHTML = recent.map(l => {
        const bal = (l.remainingPrincipal || 0) + (l.totalPendingInterest || 0);
        const sc = l.status === 'OVERDUE' ? 'badge-overdue' : l.status === 'CLOSED' ? 'badge-closed' : 'badge-active';
        const loanId = 'TLG' + String(l.id).padStart(10, '0');
        return `<tr>
    <td style="font-weight:600;">${loanId}</td>
    <td>${formatCurrency(l.loanAmount)}</td>
    <td>${new Date(l.loanDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
    <td><span class="cp-badge ${sc}">${l.status.charAt(0) + l.status.slice(1).toLowerCase()}</span></td>
    <td>${formatCurrency(bal)}</td>
    <td><a href="./loan-details.html?id=${l.id}" class="cp-view-btn" title="View Details">
        <svg style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    </a></td>
</tr>`;
    }).join('');
}

/* ==========================================================================
   SECTION 2: DATA FETCHING
   (Complex logic to fetch data from the backend when the page loads)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    // Set the user's name in the top bar
    initTopbar();

    try {
        // Fetch both loans and payments at the same time for speed
        const [loans, payments] = await Promise.all([
            fetchApi('/api/customer-portal/loans'),
            fetchApi('/api/customer-portal/payments').catch(() => [])
        ]);

        // Update the screen with the fetched data
        updateDashboardStats(loans, payments);
        updateRecentLoansTable(loans);

    } catch (e) {
        console.error('Dashboard load error:', e);
    }
});

  })();
}

// --- first-login.js ---
if (window.location.pathname.includes('first-login.html')) {
  (function() {
// js/customer/first-login.js
// Handles setting a new password on the very first login

/* ==========================================================================
   SECTION 1: FORM SUBMISSION
   (Sending the new password to the server and handling the response)
   ========================================================================== */

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get UI elements
    const errEl = document.getElementById('errorMsg');
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    errEl.style.display = 'none';

    // Basic Validation: Check password length
    if (newPassword.length < 6) {
        errEl.textContent = 'Password must be at least 6 characters.';
        errEl.style.display = 'block';
        return;
    }

    // Basic Validation: Ensure passwords match
    if (newPassword !== confirmPassword) {
        errEl.textContent = 'Passwords do not match.';
        errEl.style.display = 'block';
        return;
    }

    // Show loading state
    document.getElementById('setBtn').disabled = true;
    document.getElementById('setBtn').textContent = 'Setting...';

    /* ==========================================================================
       SECTION 2: API COMMUNICATION
       (The complex part: updating the server and local browser memory)
       ========================================================================== */
    try {
        // Send request to the backend
        await fetchApi('/api/customer-portal/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword })
        });

        // Update stored user so isFirstLogin flag reflects change
        const stored = sessionStorage.getItem('tl_user');
        if (stored) {
            const user = JSON.parse(stored);
            user.isFirstLogin = false;
            sessionStorage.setItem('tl_user', JSON.stringify(user));
        }

        // Successfully set password, go to dashboard
        window.location.href = './dashboard.html';
        
    } catch (error) {
        // Handle errors
        errEl.textContent = 'Failed to update password. Please try again.';
        errEl.style.display = 'block';
        document.getElementById('setBtn').disabled = false;
        document.getElementById('setBtn').textContent = 'Set Password';
    }
});

  })();
}

// --- loan-details.js ---
if (window.location.pathname.includes('loan-details.html')) {
  (function() {
// js/customer/loan-details.js
// Handles displaying the details of a single loan and processing payments

/* ==========================================================================
   SECTION 1: HELPERS & VARIABLES
   (Simple functions and variables used across the file)
   ========================================================================== */

let currentLoanId = null;

// Sets the visual style for the loan status (Active, Closed, Overdue)
function setBadge(el, status) {
    el.textContent = status;
    el.className = status === 'ACTIVE' ? 'badge-active'
                 : status === 'CLOSED' ? 'badge-closed'
                 : 'badge-overdue';
}

// Calculates the number of months between two dates
function monthsBetween(d1, d2) {
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

/* ==========================================================================
   SECTION 2: UI UPDATERS
   (Functions that update the text and images on the screen)
   ========================================================================== */

// Updates the top banner with loan summary
function updateTopBanner(loan) {
    document.getElementById('dt-id').textContent = 'TLG-' + String(loan.id).padStart(8, '0');
    setBadge(document.getElementById('dt-status-badge'), loan.status);
    setBadge(document.getElementById('dt-status-badge2'), loan.status);

    const loanDateObj = loan.loanDate ? new Date(loan.loanDate) : null;
    const dueDateObj  = loan.dueDate  ? new Date(loan.dueDate)  : null;

    document.getElementById('dt-date').textContent = loanDateObj
        ? loanDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
    document.getElementById('dt-duedate').textContent = dueDateObj
        ? dueDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    // Show "In X Months" or "Overdue" text
    if (dueDateObj && loan.status === 'ACTIVE') {
        const m = monthsBetween(new Date(), dueDateObj);
        if (m > 0) {
            document.getElementById('dt-due-highlight').textContent = `(In ${m} Month${m !== 1 ? 's' : ''})`;
        } else if (m <= 0) {
            document.getElementById('dt-due-highlight').textContent = 'Overdue';
            document.getElementById('dt-due-highlight').style.color = '#dc2626';
        }
    }

    document.getElementById('dt-principal').textContent = formatCurrency(loan.loanAmount);
    document.getElementById('dt-rate-display').textContent = (loan.interestPercentage || 0) + '% per month';
    document.getElementById('dt-period').textContent = loan.loanPeriod
        ? loan.loanPeriod.charAt(0).toUpperCase() + loan.loanPeriod.slice(1)
        : '—';
}

// Updates the section showing details about the gold items
function updateGoldDetails(loan) {
    document.getElementById('dt-item').textContent     = loan.itemType || '—';
    document.getElementById('dt-numitems').textContent = loan.numberOfItems || '—';
    document.getElementById('dt-weight').textContent   = (loan.grossWeight || loan.weight || 0) + ' g';
    document.getElementById('dt-purity').textContent   = loan.purity || '—';
    document.getElementById('dt-estvalue').textContent = loan.estimatedValue ? formatCurrency(loan.estimatedValue) : '—';

    if (loan.remarks) {
        document.getElementById('dt-remarks-section').style.display = 'block';
        document.getElementById('dt-remarks').textContent = loan.remarks;
    }

    // Load Gold Photos if they exist
    if (loan.goldPhotoUrls) {
        const photoUrls = loan.goldPhotoUrls.split(',').filter(u => u.trim());
        if (photoUrls.length > 0) {
            document.getElementById('dt-photos-section').style.display = 'block';
            const container = document.getElementById('dt-photos');
            container.innerHTML = '';
            photoUrls.forEach((url, i) => {
                const img = document.createElement('img');
                img.src = url.trim();
                img.alt = 'Gold Photo ' + (i + 1);
                img.className = 'photo-thumb';
                img.addEventListener('click', () => window.open(url.trim(), '_blank'));
                container.appendChild(img);
            });
        }
    }
}

// Updates the financial summary and payment pre-fill amounts
function updateOutstandingSummary(loan) {
    const remPrincipal = loan.remainingPrincipal || 0;
    const pendInterest = loan.totalPendingInterest || 0;
    const totalDue     = remPrincipal + pendInterest;

    document.getElementById('dt-rem-principal').textContent = formatCurrency(remPrincipal);
    document.getElementById('dt-pend-interest').textContent = formatCurrency(pendInterest);
    document.getElementById('dt-total-due').textContent     = formatCurrency(totalDue);

    // Pre-fill payment amount
    document.getElementById('pay-amount').value = pendInterest > 0 ? pendInterest : totalDue;

    if (loan.status === 'CLOSED') {
        document.getElementById('pay-section').style.display = 'none';
    }
}

// Updates the history table showing past payments
function updateHistoryTable(payments) {
    const tbody = document.getElementById('historyTableBody');
    if (!payments || payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:36px;color:#94a3b8;">No payments recorded yet.</td></tr>';
        return;
    } 
    
    const sorted = [...payments].reverse();
    const total = sorted.length;
    tbody.innerHTML = sorted.map((p, i) => {
        const date = new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const rcpt = 'RCPT-' + String(total - i).padStart(4, '0');
        const typeLabel = p.type === 'INTEREST' ? 'Interest Payment'
                        : p.type === 'PRINCIPAL' ? 'Principal Payment'
                        : p.type === 'FULL_CLOSURE' ? 'Full Closure'
                        : p.type;
        return `<tr>
            <td>${date}</td>
            <td>${typeLabel}</td>
            <td style="font-weight:600;">${formatCurrency(p.amount)}</td>
            <td>${p.paymentMode || 'Cash'}</td>
            <td style="color:#94a3b8;font-size:0.82rem;">${rcpt}</td>
            <td><span class="badge-success">Success</span></td>
        </tr>`;
    }).join('');
}

/* ==========================================================================
   SECTION 3: PAYMENT & DATA LOGIC
   (Complex logic to load data and process payments via Razorpay)
   ========================================================================== */

async function loadLoanDetails() {
    // Get Loan ID from the URL bar
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;
    currentLoanId = id;

    // Fetch loan data
    const loan = await fetchApi('/api/customer-portal/loans/' + id);
    if (!loan) return;

    // Update screen
    updateTopBanner(loan);
    updateGoldDetails(loan);
    updateOutstandingSummary(loan);

    // Fetch and update payment history
    const payments = await fetchApi('/api/customer-portal/loans/' + id + '/payments');
    updateHistoryTable(payments);
}

// Automatically switch payment amount based on dropdown choice
document.getElementById('pay-type').addEventListener('change', (e) => {
    const val = e.target.value;
    const pendIntStr  = document.getElementById('dt-pend-interest').textContent.replace(/[^0-9.]+/g, '');
    const totalDueStr = document.getElementById('dt-total-due').textContent.replace(/[^0-9.]+/g, '');
    
    if (val === 'INTEREST') {
        document.getElementById('pay-amount').value = parseFloat(pendIntStr) || 0;
        document.getElementById('pay-amount').disabled = false;
    } else if (val === 'FULL_CLOSURE') {
        document.getElementById('pay-amount').value = parseFloat(totalDueStr) || 0;
        document.getElementById('pay-amount').disabled = true;
    } else {
        document.getElementById('pay-amount').value = '';
        document.getElementById('pay-amount').disabled = false;
    }
});

// Handle clicking the "Pay Securely" button
document.getElementById('pay-btn').addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const type   = document.getElementById('pay-type').value;
    const msgEl  = document.getElementById('pay-msg');

    if (!amount || amount <= 0) {
        msgEl.textContent = 'Please enter a valid amount.';
        msgEl.style.color = '#dc2626';
        return;
    }

    msgEl.textContent = 'Processing...';
    msgEl.style.color = '#3b82f6';
    document.getElementById('pay-btn').disabled = true;

    try {
        // Step 1: Create Order on Backend
        const orderResp = await fetchApi('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, loanId: currentLoanId, type })
        });

        if (!orderResp || !orderResp.orderId) throw new Error('Failed to create order');

        // Step 2: Open Razorpay popup
        const options = {
            key: orderResp.keyId,
            amount: orderResp.amount,
            currency: 'INR',
            name: 'Trust Ledger',
            description: 'Loan Repayment',
            order_id: orderResp.orderId,
            handler: async (response) => {
                msgEl.textContent = 'Verifying payment...';
                try {
                    // Step 3: Verify Payment on Backend
                    const verifyResp = await fetchApi('/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            loanId: currentLoanId, amount, type
                        })
                    });
                    if (verifyResp && verifyResp.status === 'success') {
                        msgEl.textContent = '✓ Payment Successful!';
                        msgEl.style.color = '#16a34a';
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        throw new Error('Verification failed');
                    }
                } catch {
                    msgEl.textContent = 'Payment verification failed. Contact admin.';
                    msgEl.style.color = '#dc2626';
                    document.getElementById('pay-btn').disabled = false;
                }
            },
            prefill: { name: 'Customer', contact: '9999999999' },
            theme: { color: '#c5a059' }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (r) => {
            msgEl.textContent = 'Payment failed: ' + r.error.description;
            msgEl.style.color = '#dc2626';
            document.getElementById('pay-btn').disabled = false;
        });
        rzp.open();

    } catch (err) {
        msgEl.textContent = 'Error initiating payment.';
        msgEl.style.color = '#dc2626';
        document.getElementById('pay-btn').disabled = false;
    }
});

// Run when page loads
document.addEventListener('DOMContentLoaded', () => {
    initTopbar();
    loadLoanDetails();
});

  })();
}

// --- loans.js ---
if (window.location.pathname.includes('loans.html')) {
  (function() {
// js/customer/loans.js
// Handles displaying the customer's loans

/* ==========================================================================
   SECTION 1: UI UPDATERS
   (Functions that update the text and tables on the screen)
   ========================================================================== */

function updateLoansTable(loans) {
    const tbody = document.getElementById('loansBody');
    document.getElementById('loan-count').textContent = loans ? loans.length + ' loan(s)' : '0 loans';
    
    // If no loans exist, show an empty state message
    if (!loans || loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:48px;">No loans found</td></tr>';
        return;
    }
    
    // Loop through loans (newest first) and create table rows
    tbody.innerHTML = [...loans].reverse().map(l => {
        const bal = (l.remainingPrincipal || 0) + (l.totalPendingInterest || 0);
        const sc = l.status === 'OVERDUE' ? 'badge-overdue' : l.status === 'CLOSED' ? 'badge-closed' : 'badge-active';
        return `<tr>
            <td style="font-weight:600;">TLG${String(l.id).padStart(10,'0')}</td>
            <td>${formatCurrency(l.loanAmount)}</td>
            <td>${new Date(l.loanDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
            <td><span class="cp-badge ${sc}">${l.status.charAt(0)+l.status.slice(1).toLowerCase()}</span></td>
            <td>${formatCurrency(bal)}</td>
            <td><a href="./loan-details.html?id=${l.id}" class="cp-view-btn" title="View">
                <svg style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </a></td>
        </tr>`;
    }).join('');
}

/* ==========================================================================
   SECTION 2: DATA FETCHING
   (Complex logic to fetch data from the backend when the page loads)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    initTopbar();
    
    try {
        // Fetch all loans belonging to this customer
        const loans = await fetchApi('/api/customer-portal/loans');
        
        // Update the screen with the fetched data
        updateLoansTable(loans);
        
    } catch(e) { 
        console.error(e); 
    }
});

  })();
}

// --- payments.js ---
if (window.location.pathname.includes('payments.html')) {
  (function() {
// js/customer/payments.js
// Handles displaying the payment history for a customer

/* ==========================================================================
   SECTION 1: UI UPDATERS
   (Functions that update the text and tables on the screen)
   ========================================================================== */

function updatePaymentsTable(payments) {
    const tbody = document.getElementById('paymentsBody');
    
    // If no payments exist, show an empty state message
    if (!payments || payments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">
            <div class="cp-empty">
                <div class="cp-empty-icon">
                    <svg style="width:26px;height:26px;stroke:currentColor;fill:none;stroke-width:2;" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
                <p>No payments recorded yet.</p>
            </div>
        </td></tr>`;
        document.getElementById('pay-total').textContent = 'Total: ₹0';
        return;
    }

    // Calculate total amount paid
    const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    document.getElementById('pay-total').textContent = 'Total: ' + formatCurrency(total);

    // Generate table rows (newest first)
    tbody.innerHTML = [...payments].reverse().map(p => {
        const loanId = (p.loan && p.loan.id) ? 'TLG' + String(p.loan.id).padStart(10,'0') : '—';
        return `<tr>
            <td>${p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
            <td style="font-weight:500;">${loanId}</td>
            <td>${p.paymentType || p.type || '—'}</td>
            <td style="font-weight:600;color:#10b981;">${formatCurrency(p.amount)}</td>
            <td>
                <button onclick="downloadReceipt(${p.id})" style="background:none;border:none;cursor:pointer;color:#c5a059;" title="Download Receipt">
                    <svg style="width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
            </td>
        </tr>`;
    }).join('');
}

/* ==========================================================================
   SECTION 2: DATA FETCHING
   (Complex logic to fetch data from the backend when the page loads)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    initTopbar();
    try {
        // Fetch payment history
        const payments = await fetchApi('/api/customer-portal/payments');
        
        // Update the screen with the fetched data
        updatePaymentsTable(payments);
        
    } catch(e) { 
        console.error(e); 
    }
});

  })();
}

// --- profile.js ---
if (window.location.pathname.includes('profile.html')) {
  (function() {
// js/customer/profile.js
// Handles displaying the customer profile and changing passwords

/* ==========================================================================
   SECTION 1: UI UPDATERS
   (Functions that update the text and forms on the screen)
   ========================================================================== */

function updateProfileData(profile) {
    if (!profile) return;
    
    // Set Profile Photo
    if (profile.photoUrl) {
        document.getElementById('profile-avatar').innerHTML = `<img src="${profile.photoUrl}" alt="Profile Photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    }
    
    // Set Text Fields
    document.getElementById('f-name').textContent = profile.name || '—';
    document.getElementById('f-email').textContent = profile.email || '—';
    document.getElementById('f-address').textContent = [profile.addressLine1, profile.city, profile.state, profile.pinCode].filter(Boolean).join(', ') || '—';
    document.getElementById('f-phone').textContent = profile.phoneNumber || '—';
    document.getElementById('f-aadhaar').textContent = profile.identityProofNumber || '—';
    
    // Set Member Since Date
    document.getElementById('profile-since').textContent = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})
        : '—';
}

/* ==========================================================================
   SECTION 2: PASSWORD CHANGE
   (Handling the password change form submission)
   ========================================================================== */

document.getElementById('changePwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const errEl = document.getElementById('pwError');
    const newPw = document.getElementById('newPw').value;
    const confirmPw = document.getElementById('confirmPw').value;
    
    errEl.style.display = 'none';

    // Basic Validation
    if (newPw.length < 6) { 
        errEl.textContent = 'Password must be at least 6 characters.'; 
        errEl.style.display = 'block'; 
        return; 
    }
    if (newPw !== confirmPw) { 
        errEl.textContent = 'Passwords do not match.'; 
        errEl.style.display = 'block'; 
        return; 
    }

    // Show loading state
    document.getElementById('pwBtn').disabled = true;
    document.getElementById('pwBtn').textContent = 'Updating...';
    
    try {
        // Send request to backend
        await fetchApi('/api/customer-portal/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: newPw })
        });
        
        // Hide form and show success message
        document.getElementById('changePwModal').classList.remove('active');
        document.getElementById('changePwForm').reset();
        document.getElementById('successModal').classList.add('active');
        
    } catch(e) {
        errEl.textContent = 'Failed to update password. Please try again.';
        errEl.style.display = 'block';
    }
    
    // Reset button
    document.getElementById('pwBtn').disabled = false;
    document.getElementById('pwBtn').textContent = 'Update Password';
});

/* ==========================================================================
   SECTION 3: INITIALIZATION
   (What runs when the page first loads)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    initTopbar();
    
    // Set Phone number from local storage token
    const phone = getPhoneFromToken();
    document.getElementById('profile-phone').textContent = phone || '—';

    try {
        // Fetch profile data from backend
        const profile = await fetchApi('/api/customer-portal/profile');
        updateProfileData(profile);
    } catch(e) { 
        console.error(e); 
    }
});

  })();
}

