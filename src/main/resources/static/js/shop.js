// shop.js - Combined Shop Owner scripts

// --- add-customer.js ---
if (window.location.pathname.includes('add-customer.html')) {
  (function() {
// js/shop-owner/add-customer.js
// Handles adding a new customer, including photo upload and temporary password modal

/* ==========================================================================
   SECTION 1: STATE & VARIABLES
   ========================================================================== */
let selectedFile = null;

/* ==========================================================================
   SECTION 2: UI UPDATERS & RENDERERS
   ========================================================================== */

function showCredentialModal(password) {
    const modal = document.getElementById('credentialModal');
    const passwordEl = document.getElementById('credentialPassword');
    const copyBtn = document.getElementById('copyCredentialBtn');
    const doneBtn = document.getElementById('credentialDoneBtn');

    passwordEl.textContent = password;
    modal.classList.add('active');

    copyBtn.onclick = async () => {
        try {
            await navigator.clipboard.writeText(password);
            copyBtn.textContent = 'Copied';
        } catch {
            copyBtn.textContent = 'Copy failed';
        }
        setTimeout(() => copyBtn.textContent = 'Copy', 1400);
    };

    doneBtn.onclick = () => {
        window.location.href = './customers.html';
    };
}

/* ==========================================================================
   SECTION 3: FORM HANDLING & EVENT LISTENERS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTopbar();

    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.getElementById('photoPreview');
    const photoPlaceholder = document.getElementById('photoPlaceholder');

    // Handle photo selection
    photoInput.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
            selectedFile = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
                photoPlaceholder.style.opacity = '0';
            };
            reader.readAsDataURL(selectedFile);
        }
    });

    // Handle form submission
    document.getElementById('customerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('saveBtn');
        const err = document.getElementById('errorMsg');
        
        btn.disabled = true;
        btn.innerHTML = 'Saving...';
        err.style.display = 'none';

        try {
            let photoUrl = null;
            
            // Upload photo if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                
                const token = getToken();
                const uploadRes = await fetch('/api/files/upload', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token },
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload photo');
                photoUrl = uploadData.url;
            }

            // Gather customer data
            const cData = {
                name: document.getElementById('cName').value,
                phoneNumber: document.getElementById('cPhone').value,
                email: document.getElementById('cEmail').value,
                dateOfBirth: document.getElementById('cDob').value,
                gender: document.getElementById('cGender').value,
                maritalStatus: document.getElementById('cMarital').value,
                addressLine1: document.getElementById('cAddress1').value,
                addressLine2: document.getElementById('cAddress2').value,
                city: document.getElementById('cCity').value,
                state: document.getElementById('cState').value,
                pinCode: document.getElementById('cPin').value,
                occupation: document.getElementById('cOcc').value,
                monthlyIncome: document.getElementById('cInc').value,
                identityProofType: document.getElementById('cIdType').value,
                identityProofNumber: document.getElementById('cIdNum').value,
                remarks: document.getElementById('cRem').value,
                photoUrl: photoUrl
            };

            // Save customer
            const savedCustomer = await fetchApi('/api/customers', {
                method: 'POST',
                body: JSON.stringify(cData)
            });

            // Handle temporary password
            const tempPwd = savedCustomer.tempPassword || 'TL' + cData.phoneNumber.slice(-4);
            
            // NEW FEATURE: Send email logic would go here if implemented on backend,
            // or we could trigger an API endpoint here to send the email.
            // Currently, the backend should ideally send this email during creation.

            showCredentialModal(tempPwd);
            
        } catch (error) {
            err.textContent = error.message;
            err.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = `<svg class="stroke-icon" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Customer`;
        }
    });
});

  })();
}

// --- add-loan.js ---
if (window.location.pathname.includes('add-loan.html')) {
  (function() {
// js/shop-owner/add-loan.js
// Handles adding a new loan and uploading related documents and photos

/* ==========================================================================
   SECTION 1: STATE & VARIABLES
   ========================================================================== */
let goldPhotoFiles = [];
let docFiles = [];

/* ==========================================================================
   SECTION 2: UI UPDATERS & RENDERERS
   ========================================================================== */

function renderFilePreview(container, fileArray) {
    container.innerHTML = '';
    fileArray.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';
        item.innerHTML = `
            <span>${file.name}</span>
            <span class="remove-file" data-index="${index}">&times;</span>
        `;
        
        item.querySelector('.remove-file').addEventListener('click', () => {
            fileArray.splice(index, 1);
            renderFilePreview(container, fileArray);
        });
        
        container.appendChild(item);
    });
}

function setupFileUpload(inputId, previewId, fileArray, maxFiles, allowedTypes) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    input.addEventListener('change', () => {
        const newFiles = Array.from(input.files);
        for (const file of newFiles) {
            if (fileArray.length >= maxFiles) {
                alert(`Maximum ${maxFiles} files allowed.`);
                break;
            }
            if (!allowedTypes.includes(file.type)) {
                alert(`File type not allowed: ${file.name}`);
                continue;
            }
            fileArray.push(file);
        }
        input.value = ''; // Clear input so same file can be added again if removed
        renderFilePreview(preview, fileArray);
    });
}

/* ==========================================================================
   SECTION 3: FORM HANDLING & INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    initTopbar();

    // Set default loan date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lDate').value = today;

    // Load customers for dropdown
    const customerSelect = document.getElementById('lCustomer');
    try {
        const customers = await fetchApi('/api/customers');
        customerSelect.innerHTML = '<option value="">Select a customer</option>';
        if(customers) {
            customers.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.name} - ${c.phoneNumber}`;
                customerSelect.appendChild(opt);
            });
        }
    } catch (e) {
        customerSelect.innerHTML = '<option value="">Failed to load customers</option>';
    }

    // Auto-calculate Due Date based on Loan Date and Period
    document.getElementById('lPeriod').addEventListener('change', () => {
        const loanDate = document.getElementById('lDate').value;
        const period = document.getElementById('lPeriod').value;
        if (loanDate && period) {
            const date = new Date(loanDate);
            const months = parseInt(period);
            date.setMonth(date.getMonth() + months);
            document.getElementById('lDueDate').value = date.toISOString().split('T')[0];
        }
    });

    document.getElementById('lDate').addEventListener('change', () => {
        const period = document.getElementById('lPeriod').value;
        if (period) {
            document.getElementById('lPeriod').dispatchEvent(new Event('change'));
        }
    });

    // Update remarks character count
    document.getElementById('lRemarks').addEventListener('input', (e) => {
        document.getElementById('remarkCount').textContent = e.target.value.length;
    });

    // Setup file uploads for Gold Photos and Documents
    setupFileUpload('goldPhotoInput', 'goldPhotoPreview', goldPhotoFiles, 5, ['image/png', 'image/jpeg', 'image/jpg']);
    setupFileUpload('docInput', 'docPreview', docFiles, 5, ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']);

    // Handle form submission
    document.getElementById('loanForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('saveBtn');
        const err = document.getElementById('errorMsg');
        
        btn.disabled = true;
        btn.innerHTML = 'Saving...';
        err.style.display = 'none';

        try {
            const formData = new FormData();
            
            // Append basic info
            formData.append('customerId', document.getElementById('lCustomer').value);
            formData.append('itemType', document.getElementById('lItemType').value);
            formData.append('numberOfItems', document.getElementById('lNumItems').value);
            formData.append('grossWeight', document.getElementById('lWeight').value);
            formData.append('weight', document.getElementById('lWeight').value);
            formData.append('purity', document.getElementById('lPurity').value);
            
            const estVal = document.getElementById('lEstValue').value;
            if (estVal) formData.append('estimatedValue', estVal);

            formData.append('loanAmount', document.getElementById('lAmount').value);
            formData.append('interestPercentage', document.getElementById('lInterest').value);
            formData.append('loanDate', document.getElementById('lDate').value);
            formData.append('loanPeriod', document.getElementById('lPeriod').value);
            formData.append('dueDate', document.getElementById('lDueDate').value);
            
            const remarks = document.getElementById('lRemarks').value;
            if (remarks) formData.append('remarks', remarks);

            // Append gold photos
            goldPhotoFiles.forEach(file => {
                formData.append('goldPhotos', file);
            });

            // Append documents
            docFiles.forEach(file => {
                formData.append('documents', file);
            });

            // Send as multipart request
            const token = getToken();
            const response = await fetch('/api/loans/create', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Request failed (${response.status})`);
            }

            // Redirect on success
            window.location.href = './loans.html';
            
        } catch (error) {
            err.textContent = error.message;
            err.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = `<svg class="stroke-icon" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Loan`;
        }
    });
});

  })();
}

// --- customer-details.js ---
if (window.location.pathname.includes('customer-details.html')) {
  (function() {
// js/shop-owner/customer-details.js
// Handles displaying the details of a single customer and their loans

/* ==========================================================================
   SECTION 1: UI MODAL LOGIC
   (Functions that handle the image popup modal)
   ========================================================================== */

function setupImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const closeBtn = document.getElementById('modalCloseBtn');
    
    // Global function used by HTML onclick
    window.openModal = function(imgSrc) {
        modalImg.src = imgSrc;
        modal.classList.add('active');
    };
    
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => modalImg.src = '', 300);
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

/* ==========================================================================
   SECTION 2: UI UPDATERS
   (Functions that update the text and tables on the screen)
   ========================================================================== */

function populateCustomerDetails(customer) {
    if (!customer) return;

    document.title = `Trust Ledger - Customer ${customer.name}`;
    
    // Populate Banner
    document.getElementById('c-id').textContent = `CUST${String(customer.id).padStart(4, '0')}`;
    document.getElementById('c-name').textContent = customer.name;
    document.getElementById('c-phone').textContent = customer.phoneNumber;
    document.getElementById('c-email').textContent = customer.email || '—';

    // Populate Personal Details
    if (customer.photoUrl) {
        document.getElementById('c-photo').src = customer.photoUrl;
    }
    if (customer.dateOfBirth) {
        document.getElementById('c-dob').textContent = new Date(customer.dateOfBirth).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
    }
    document.getElementById('c-gender').textContent = customer.gender || '—';
    document.getElementById('c-marital').textContent = customer.maritalStatus || '—';

    // Populate Address
    document.getElementById('c-addr1').textContent = customer.addressLine1 || '—';
    document.getElementById('c-addr2').textContent = customer.addressLine2 || '—';
    document.getElementById('c-city').textContent = customer.city || '—';
    document.getElementById('c-state').textContent = customer.state || '—';
    document.getElementById('c-pin').textContent = customer.pinCode || '—';

    // Populate Identity & Employment
    document.getElementById('c-occupation').textContent = customer.occupation || '—';
    document.getElementById('c-income').textContent = customer.monthlyIncome ? formatCurrency(customer.monthlyIncome) : '—';
    document.getElementById('c-idtype').textContent = customer.identityProofType || '—';
    document.getElementById('c-idnumber').textContent = customer.identityProofNumber || '—';

    // Populate Remarks
    if (customer.remarks && customer.remarks.trim() !== '') {
        document.getElementById('remarks-card').style.display = 'block';
        document.getElementById('c-remarks').textContent = customer.remarks;
    }
}

function renderCustomerLoans(customerLoans) {
    const tbody = document.getElementById('loansTable');
    
    if (!customerLoans || customerLoans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:36px;color:#94a3b8;">No loans found for this customer.</td></tr>`;
        return;
    }

    tbody.innerHTML = customerLoans.map(loan => {
        const loanIdStr = 'TLG' + String(loan.id).padStart(9, '0');
        const totalDue = (loan.remainingPrincipal || 0) + (loan.totalPendingInterest || 0);
        
        let badgeClass = 'badge-active';
        if (loan.status === 'CLOSED') badgeClass = 'badge-closed';
        else if (loan.status === 'OVERDUE') badgeClass = 'badge-overdue';

        return `<tr>
            <td style="font-weight:600;color:#c5a059;">${loanIdStr}</td>
            <td>${loan.itemType || '—'}</td>
            <td>${loan.weight ? loan.weight + 'g' : '—'}</td>
            <td style="font-weight:600; color:#1e293b;">${formatCurrency(loan.loanAmount)}</td>
            <td style="font-weight:700; color:#dc2626;">${formatCurrency(totalDue)}</td>
            <td><span class="cp-badge ${badgeClass}" style="font-size:0.7rem;padding:3px 8px;">${loan.status}</span></td>
            <td style="text-align:center;">
                <a href="./loan-details.html?id=${loan.id}" class="cp-view-btn" title="View Details" style="display:inline-flex; width:28px; height:28px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; align-items:center; justify-content:center; color:#64748b; transition:all 0.2s;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </a>
            </td>
        </tr>`;
    }).join('');
}

/* ==========================================================================
   SECTION 3: DATA FETCHING
   (Complex logic to fetch data from the backend when the page loads)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    initTopbar();
    setupImageModal();

    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('id');

    if (!customerId) {
        alert("Customer ID missing");
        window.location.href = './customers.html';
        return;
    }

    try {
        // Fetch customer details
        const customer = await fetchApi(`/api/customers/${customerId}`);
        if (!customer) throw new Error("Customer not found");
        
        populateCustomerDetails(customer);

        // Fetch loans and filter by customer
        const allLoans = await fetchApi('/api/loans');
        const customerLoans = allLoans.filter(l => l.customer && String(l.customer.id) === String(customerId));
        
        renderCustomerLoans(customerLoans);
        
    } catch (e) {
        console.error(e);
        alert("Error loading customer details");
        window.location.href = './customers.html';
    }
});

  })();
}

// --- customers.js ---
if (window.location.pathname.includes('customers.html')) {
  (function() {
// js/shop-owner/customers.js
// Handles displaying and filtering the list of all customers

/* ==========================================================================
   SECTION 1: STATE & VARIABLES
   (Variables used to store data locally so we don't have to fetch it repeatedly)
   ========================================================================== */
let allCustomers = [];

/* ==========================================================================
   SECTION 2: UI UPDATERS & RENDERERS
   (Functions that update the text and tables on the screen)
   ========================================================================== */

function renderTable(data) {
    const tbody = document.getElementById('customersBody');
    
    // If no customers exist matching the filter, show empty message
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;">No customers found</td></tr>`;
        return;
    }

    // Generate table rows for each customer
    tbody.innerHTML = data.map(c => {
        const custId = 'CUST' + String(c.id).padStart(4, '0');
        const totalLoans = c.totalLoans || 0;
        const outstanding = c.totalOutstanding || 0;
        const status = c.status || 'Active'; // Placeholder
        const badgeClass = status === 'Active' ? 'badge-active' : 'badge-closed';
        
        return `<tr>
            <td style="font-weight:500;">${custId}</td>
            <td>${c.name}</td>
            <td>${c.phoneNumber}</td>
            <td style="color:var(--cp-text-muted);">${c.email || '—'}</td>
            <td style="text-align:center;">${totalLoans}</td>
            <td style="text-align:right; font-weight:600;">${totalLoans > 0 ? formatCurrency(outstanding) : '₹0'}</td>
            <td style="text-align:center;"><span class="cp-badge ${badgeClass}">${status}</span></td>
            <td style="text-align:center;">
                <a href="./customer-details.html?id=${c.id}" class="cp-view-btn" title="View Details">
                    <svg class="stroke-icon" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </a>
            </td>
        </tr>`;
    }).join('');
}

function filterCustomers(query = '') {
    let filtered = allCustomers;
    
    // Filter by name, phone, or email if query exists
    if (query) {
        const q = query.toLowerCase();
        filtered = allCustomers.filter(c => 
            (c.name && c.name.toLowerCase().includes(q)) || 
            (c.phoneNumber && c.phoneNumber.includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
    }
    
    // Render the filtered data and update total count
    renderTable(filtered);
    document.getElementById('totalCount').textContent = filtered.length;
}

/* ==========================================================================
   SECTION 3: DATA FETCHING & EVENT LISTENERS
   (Complex logic to fetch data from the backend when the page loads)
   ========================================================================== */

async function fetchAllCustomers() {
    const tbody = document.getElementById('customersBody');
    try {
        allCustomers = await fetchApi('/api/customers');
        filterCustomers('');
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--danger);padding:30px;">Failed to load customers</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initTopbar();
    
    const searchInput = document.getElementById('searchInput');
    
    // Filter as the user types
    searchInput.addEventListener('input', (e) => {
        filterCustomers(e.target.value);
    });

    fetchAllCustomers();
});

  })();
}

// --- dashboard.js ---
if (window.location.pathname.includes('dashboard.html')) {
  (function() {
// js/shop-owner/dashboard.js
// Handles displaying the shop owner dashboard overview

/* ==========================================================================
   SECTION 1: UI UPDATERS
   (Functions that update the text and tables on the screen)
   ========================================================================== */

function updateDashboardStats(summary, loans) {
    if (summary) {
        document.getElementById('stat-customers').textContent = summary.totalCustomers || 0;
        document.getElementById('stat-loans').textContent = summary.activeLoans || 0;
        document.getElementById('stat-principal').textContent = formatCurrency(summary.totalDisbursed || 0);
    }

    let totalPendingInterest = 0;
    if (loans && loans.length > 0) {
        loans.forEach(l => {
            if (l.status !== 'CLOSED') {
                totalPendingInterest += (l.totalPendingInterest || 0);
            }
        });
    }
    document.getElementById('stat-interest').textContent = formatCurrency(totalPendingInterest);
}

function updateRecentLoansTable(loans) {
    const loansBody = document.getElementById('recentLoansBody');
    if (!loans || loans.length === 0) {
        loansBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:36px;color:#94a3b8;">No recent loans found.</td></tr>`;
        return;
    }
    
    loansBody.innerHTML = loans.slice(0, 5).map(l => {
        const id = 'TLG' + String(l.id).padStart(9, '0');
        const badgeClass = l.status === 'ACTIVE' ? 'badge-active' : (l.status === 'CLOSED' ? 'badge-closed' : 'badge-overdue');
        const amt = l.loanAmount || 0;
        
        // Mock balance computation for display
        const balance = l.status === 'CLOSED' ? 0 : amt * 0.45;
        
        return `<tr>
            <td style="font-weight:500;">${id}</td>
            <td>${l.customer ? l.customer.name : 'Unknown'}</td>
            <td style="font-weight:600;color:var(--cp-text);">${formatCurrency(amt)}</td>
            <td>${new Date(l.loanDate || Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</td>
            <td style="text-align:center;"><span class="cp-badge ${badgeClass}">${l.status || 'Active'}</span></td>
            <td style="text-align:right; font-weight:600;">${formatCurrency(balance)}</td>
            <td style="text-align:center;">
                <a href="loan-details.html?id=${l.id}" class="cp-view-btn"><svg class="stroke-icon" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></a>
            </td>
        </tr>`;
    }).join('');
}

function updateRecentPaymentsTable(payments) {
    const payBody = document.getElementById('recentPaymentsBody');
    if (!payments || payments.length === 0) {
        payBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:36px;color:#94a3b8;">No recent payments found.</td></tr>`;
        return;
    } 
    
    payBody.innerHTML = payments.slice(0, 5).map(p => {
        const id = 'PAY' + String(p.id).padStart(9, '0');
        return `<tr>
            <td style="font-weight:500;">${id}</td>
            <td>${p.loan ? (p.loan.customer ? p.loan.customer.name : 'Unknown') : 'Unknown'}</td>
            <td style="font-weight:600;color:var(--cp-text);">${formatCurrency(p.amount || 0)}</td>
            <td>${new Date(p.paymentDate || Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</td>
            <td style="text-align:center;"><span class="cp-badge" style="background:transparent;border:1px solid #e2e8f0;color:var(--cp-text-muted);">${p.paymentType || 'UPI'}</span></td>
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
        // Fetch all required data simultaneously
        const [summary, loans, payments] = await Promise.all([
            fetchApi('/api/dashboard/summary'),
            fetchApi('/api/loans'),
            fetchApi('/api/payments')
        ]);

        // Update the screen with the fetched data
        updateDashboardStats(summary, loans);
        updateRecentLoansTable(loans);
        updateRecentPaymentsTable(payments);

    } catch (e) {
        console.error(e);
        document.getElementById('recentLoansBody').innerHTML = `<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--danger);">Error loading data</td></tr>`;
        document.getElementById('recentPaymentsBody').innerHTML = `<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--danger);">Error loading data</td></tr>`;
    }
});

  })();
}

// --- loan-details.js ---
if (window.location.pathname.includes('loan-details.html')) {
  (function() {
// js/shop-owner/loan-details.js
// Handles displaying the details of a single loan and recording payments

/* ==========================================================================
   SECTION 1: UI MODALS
   (Functions for image popups and custom confirmation dialogs)
   ========================================================================== */

let confirmCallback = null;

function setupModals() {
    // Image Modal
    const imgModal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    const imgCloseBtn = document.getElementById('modalCloseBtn');
    
    window.openModal = function(imgSrc) {
        modalImg.src = imgSrc;
        imgModal.classList.add('active');
    };
    
    function closeImgModal() {
        imgModal.classList.remove('active');
        setTimeout(() => modalImg.src = '', 300);
    }
    
    if (imgCloseBtn) imgCloseBtn.addEventListener('click', closeImgModal);
    if (imgModal) {
        imgModal.addEventListener('click', (e) => {
            if (e.target === imgModal) closeImgModal();
        });
    }

    // Custom Confirm Modal
    const ccModal = document.getElementById('customConfirm');
    const ccNoBtn = document.getElementById('ccNoBtn');
    const ccYesBtn = document.getElementById('ccYesBtn');

    window.closeCustomModal = function() {
        ccModal.classList.remove('active');
    };

    if (ccNoBtn) {
        ccNoBtn.addEventListener('click', () => {
            closeCustomModal();
        });
    }

    if (ccYesBtn) {
        ccYesBtn.addEventListener('click', () => {
            closeCustomModal();
            if (confirmCallback) confirmCallback();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (imgModal && imgModal.classList.contains('active')) closeImgModal();
            if (ccModal && ccModal.classList.contains('active')) closeCustomModal();
        }
    });
}

function showCustomModal(type, title, msg, callback) {
    const ccModal = document.getElementById('customConfirm');
    const ccIcon = document.getElementById('ccIcon');
    const ccTitle = document.getElementById('ccTitle');
    const ccMsg = document.getElementById('ccMsg');
    const ccActions = document.getElementById('ccActions');
    const ccYesBtn = document.getElementById('ccYesBtn');
    const ccNoBtn = document.getElementById('ccNoBtn');

    ccTitle.textContent = title;
    ccMsg.textContent = msg;
    
    if (type === 'confirm') {
        ccIcon.className = 'confirm-icon';
        ccIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        ccActions.innerHTML = '';
        ccActions.appendChild(ccNoBtn);
        ccActions.appendChild(ccYesBtn);
        ccNoBtn.textContent = 'Cancel';
        ccYesBtn.textContent = 'Yes, Record';
        ccYesBtn.style.display = 'flex';
    } else if (type === 'success') {
        ccIcon.className = 'confirm-icon success';
        ccIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        ccActions.innerHTML = '';
        ccActions.appendChild(ccNoBtn);
        ccNoBtn.textContent = 'OK';
    } else {
        ccIcon.className = 'confirm-icon error';
        ccIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        ccActions.innerHTML = '';
        ccActions.appendChild(ccNoBtn);
        ccNoBtn.textContent = 'OK';
    }

    confirmCallback = callback;
    ccModal.classList.add('active');
}

/* ==========================================================================
   SECTION 2: DATA FETCHING & POPULATION
   ========================================================================== */

let currentLoanId = null;

async function loadData() {
    try {
        const loan = await fetchApi(`/api/loans/${currentLoanId}`);
        if (!loan) throw new Error("Loan not found");

        document.title = `Trust Ledger - Loan TLG${String(loan.id).padStart(9, '0')}`;
        
        // Banner Info
        document.getElementById('dt-id').textContent = `TLG${String(loan.id).padStart(9, '0')}`;
        document.getElementById('dt-cname').textContent = loan.customer ? loan.customer.name : 'Unknown Customer';
        document.getElementById('dt-date').textContent = new Date(loan.loanDate || Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
        
        if (loan.dueDate) {
            const dueDate = new Date(loan.dueDate);
            document.getElementById('dt-duedate').textContent = dueDate.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
            const daysDiff = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
            const dueHighlight = document.getElementById('dt-due-highlight');
            if (loan.status === 'CLOSED') {
                dueHighlight.textContent = '';
            } else if (daysDiff < 0) {
                dueHighlight.textContent = `${Math.abs(daysDiff)} days overdue`;
                dueHighlight.style.color = '#dc2626';
            } else if (daysDiff <= 7) {
                dueHighlight.textContent = `Due in ${daysDiff} days`;
            } else {
                dueHighlight.textContent = '';
            }
        }

        const badge = document.getElementById('dt-status-badge');
        badge.textContent = loan.status;
        badge.className = loan.status === 'ACTIVE' ? 'badge-active' : (loan.status === 'CLOSED' ? 'badge-closed' : 'badge-overdue');

        if (loan.status === 'CLOSED') {
            document.getElementById('addPaymentSection').style.display = 'none';
        }

        // Gold Details Card
        document.getElementById('dt-item').textContent = loan.itemType || '—';
        document.getElementById('dt-numitems').textContent = loan.numberOfItems || '1';
        document.getElementById('dt-weight').textContent = loan.weight ? `${loan.weight}g` : '—';
        document.getElementById('dt-purity').textContent = loan.purity || '—';
        document.getElementById('dt-estvalue').textContent = loan.estimatedValue ? formatCurrency(loan.estimatedValue) : '—';

        // Summary Card
        document.getElementById('dt-principal').textContent = formatCurrency(loan.loanAmount);
        document.getElementById('dt-rate-display').textContent = `${loan.interestPercentage || 0}% p.m.`;
        document.getElementById('dt-period').textContent = loan.loanPeriod ? `${loan.loanPeriod} Months` : '—';
        
        document.getElementById('dt-rem-principal').textContent = formatCurrency(loan.remainingPrincipal);
        document.getElementById('dt-pend-interest').textContent = formatCurrency(loan.totalPendingInterest);
        const totalDue = (loan.remainingPrincipal || 0) + (loan.totalPendingInterest || 0);
        document.getElementById('dt-total-due').textContent = formatCurrency(totalDue);

        // Remarks
        if (loan.remarks && loan.remarks.trim()) {
            document.getElementById('dt-remarks-section').style.display = 'block';
            document.getElementById('dt-remarks').textContent = loan.remarks;
        }

        // Gold Photos
        if (loan.goldPhotoUrls) {
            const photos = loan.goldPhotoUrls.split(',').filter(u => u.trim());
            if (photos.length > 0) {
                document.getElementById('dt-gold-photos-section').style.display = 'block';
                const container = document.getElementById('dt-gold-photos');
                container.innerHTML = photos.map(url => `<img src="${url}" class="photo-thumb" alt="Gold Photo" onclick="openModal('${url}')">`).join('');
            }
        }

        // Documents
        if (loan.documentUrls) {
            const docs = loan.documentUrls.split(',').filter(u => u.trim());
            if (docs.length > 0) {
                document.getElementById('dt-docs-section').style.display = 'block';
                const container = document.getElementById('dt-docs');
                container.innerHTML = docs.map(url => `<img src="${url}" class="photo-thumb" alt="Document" onclick="openModal('${url}')">`).join('');
            }
        }

        // Payment History
        const payments = await fetchApi(`/api/payments/loan/${currentLoanId}`);
        const tbody = document.getElementById('paymentsTable');
        if (!payments || payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:36px;color:#94a3b8;">No payments found.</td></tr>`;
        } else {
            const sortedPayments = [...payments].reverse();
            tbody.innerHTML = sortedPayments.map(p => {
                const pid = 'PAY' + String(p.id).padStart(9, '0');
                const isPrincipal = p.type === 'PRINCIPAL' || p.type === 'FULL_CLOSURE';
                const typeBadge = isPrincipal ? `<span class="badge-active" style="background:#e0e7ff;color:#4f46e5;">${p.type}</span>` : `<span class="badge-active" style="background:#fef3c7;color:#d97706;">${p.type}</span>`;
                return `<tr>
                    <td style="font-weight:600;color:#c5a059;">${pid}</td>
                    <td style="font-weight:700;color:#1e293b;">${formatCurrency(p.amount)}</td>
                    <td>${typeBadge}</td>
                    <td><span style="display:inline-block;padding:2px 8px;border-radius:6px;background:#f1f5f9;font-size:0.75rem;font-weight:600;color:#64748b;">${p.paymentMode || 'CASH'}</span></td>
                    <td style="color:#64748b;font-weight:500;">${new Date(p.paymentDate || Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</td>
                </tr>`;
            }).join('');
        }
    } catch (e) {
        console.error(e);
        alert("Error loading loan details");
    }
}

/* ==========================================================================
   SECTION 3: INITIALIZATION & EVENT LISTENERS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    initTopbar();

    const urlParams = new URLSearchParams(window.location.search);
    currentLoanId = urlParams.get('id');

    if (!currentLoanId) {
        alert("Loan ID missing");
        window.location.href = './loans.html';
        return;
    }

    setupModals();
    loadData();

    // Payment Form Submission
    document.getElementById('paymentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const amt = document.getElementById('pAmount').value;
        const type = document.getElementById('pType').value;

        showCustomModal(
            'confirm',
            'Record Payment',
            `Are you sure you want to record an offline payment of ${formatCurrency(amt)} for this loan?`,
            async () => {
                const btn = document.querySelector('#paymentForm button[type="submit"]');
                const origText = btn.innerHTML;
                btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Processing...`;
                btn.disabled = true;

                try {
                    await fetchApi(`/api/payments/loan/${currentLoanId}`, {
                        method: 'POST',
                        body: JSON.stringify({ amount: amt, type: type })
                    });
                    
                    showCustomModal('success', 'Payment Recorded!', `The payment of ${formatCurrency(amt)} has been successfully logged.`);
                    loadData(); // reload page data
                    document.getElementById('pAmount').value = ''; // clear input
                } catch (error) {
                    showCustomModal('error', 'Payment Failed', error.message);
                } finally {
                    btn.innerHTML = origText;
                    btn.disabled = false;
                }
            }
        );
    });
});

  })();
}

// --- loans.js ---
if (window.location.pathname.includes('loans.html')) {
  (function() {
// js/shop-owner/loans.js
// Handles displaying and filtering loans on the shop owner loans page

/* ==========================================================================
   SECTION 1: STATE & VARIABLES
   ========================================================================== */
let allLoans = [];

/* ==========================================================================
   SECTION 2: DATA FETCHING & FILTERING
   ========================================================================== */

async function fetchAllLoans() {
    try {
        allLoans = await fetchApi('/api/loans');
        filterLoans();
    } catch (e) {
        console.error(e);
        document.getElementById('loansTable').innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--danger);padding:30px;">Failed to load loans</td></tr>`;
    }
}

function filterLoans() {
    const tbody = document.getElementById('loansTable');
    const filter = document.getElementById('statusFilter').value;
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allLoans;
    
    if (filter) {
        filtered = filtered.filter(l => l.status === filter);
    }
    
    if (query) {
        filtered = filtered.filter(l => {
            const idStr = 'tlg' + String(l.id).padStart(9, '0');
            const cName = l.customer && l.customer.name ? l.customer.name.toLowerCase() : '';
            return idStr.includes(query) || cName.includes(query);
        });
    }

    document.getElementById('totalCount').textContent = filtered.length;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">No loans found</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(l => {
        const id = 'TLG' + String(l.id).padStart(9, '0');
        const badgeClass = l.status === 'ACTIVE' ? 'badge-active' : (l.status === 'CLOSED' ? 'badge-closed' : 'badge-overdue');
        
        return `<tr>
            <td style="font-weight:500;">${id}</td>
            <td>${l.customer ? l.customer.name : 'Unknown'}</td>
            <td>${l.itemType || 'Gold'} (${l.weight}g)</td>
            <td style="text-align:right; font-weight:600;">${formatCurrency(l.remainingPrincipal || 0)}</td>
            <td style="text-align:right; color:var(--danger); font-weight:500;">${formatCurrency(l.totalPendingInterest || 0)}</td>
            <td style="text-align:center;"><span class="cp-badge ${badgeClass}">${l.status || 'ACTIVE'}</span></td>
            <td style="text-align:center;">
                <a href="./loan-details.html?id=${l.id}" class="cp-view-btn" title="View Details">
                    <svg class="stroke-icon" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </a>
            </td>
        </tr>`;
    }).join('');
}

/* ==========================================================================
   SECTION 3: INITIALIZATION & EVENT LISTENERS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTopbar();
    fetchAllLoans();
    
    document.getElementById('searchInput').addEventListener('input', filterLoans);
    document.getElementById('statusFilter').addEventListener('change', filterLoans);
});

  })();
}

// --- payments.js ---
if (window.location.pathname.includes('payments.html')) {
  (function() {
// js/shop-owner/payments.js
// Handles displaying the payments list for the shop owner

document.addEventListener('DOMContentLoaded', async () => {
    initTopbar();
    
    const tbody = document.getElementById('paymentsBody');
    
    try {
        const payments = await fetchApi('/api/payments');
        
        if (!payments || payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:#94a3b8;">No payments found</td></tr>`;
            return;
        }

        document.getElementById('totalCount').textContent = payments.length;

        const sortedPayments = [...payments].reverse();
        tbody.innerHTML = sortedPayments.map(p => {
            const id = 'PAY' + String(p.id).padStart(9, '0');
            const custName = p.loan && p.loan.customer ? p.loan.customer.name : 'Unknown';
            return `<tr>
                <td style="font-weight:500;">${id}</td>
                <td>${custName}</td>
                <td style="font-weight:600;color:var(--cp-text);">${formatCurrency(p.amount || 0)}</td>
                <td style="color:var(--cp-text-muted);">${p.type || 'INTEREST'}</td>
                <td>${new Date(p.paymentDate || Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</td>
                <td style="text-align:center;"><span class="cp-badge" style="background:transparent;border:1px solid #e2e8f0;color:var(--cp-text-muted);">${p.paymentMode || 'CASH'}</span></td>
                <td style="text-align:center;">
                    <button onclick="downloadReceipt(${p.id})" style="background:none;border:none;cursor:pointer;color:#c5a059;" title="Download Receipt">
                        <svg style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                </td>
            </tr>`;
        }).join('');
        
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--danger);padding:30px;">Failed to load payments</td></tr>`;
    }
});

  })();
}

// --- reset-password.js ---
if (window.location.pathname.includes('reset-password.html')) {
  (function() {
// js/shop-owner/reset-password.js
// Handles the password reset functionality

document.addEventListener('DOMContentLoaded', () => {
    // Read token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');

    if (!resetToken) {
        document.getElementById('resetFormView').style.display = 'none';
        document.getElementById('invalidView').style.display = 'block';
    }

    // Password strength indicator
    document.getElementById('newPassword').addEventListener('input', function() {
        const val = this.value;
        const fill = document.getElementById('strengthFill');
        let strength = 0;
        if (val.length >= 6) strength++;
        if (val.length >= 10) strength++;
        if (/[A-Z]/.test(val)) strength++;
        if (/[0-9]/.test(val)) strength++;
        if (/[^A-Za-z0-9]/.test(val)) strength++;
        const pct = (strength / 5) * 100;
        fill.style.width = pct + '%';
        fill.style.background = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#10b981';
    });

    // Toggle password visibility
    document.getElementById('togglePw1').addEventListener('click', () => {
        const el = document.getElementById('newPassword');
        el.type = el.type === 'password' ? 'text' : 'password';
    });
    document.getElementById('togglePw2').addEventListener('click', () => {
        const el = document.getElementById('confirmPassword');
        el.type = el.type === 'password' ? 'text' : 'password';
    });

    // Handle form submission
    document.getElementById('resetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('errorMsg');
        const btn = document.getElementById('resetBtn');
        errEl.style.display = 'none';

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword.length < 6) {
            errEl.textContent = 'Password must be at least 6 characters.';
            errEl.style.display = 'block';
            return;
        }
        if (newPassword !== confirmPassword) {
            errEl.textContent = 'Passwords do not match.';
            errEl.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = 'Updating...';

        try {
            const resp = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, newPassword })
            });

            const data = await resp.json();

            if (resp.ok) {
                document.getElementById('resetFormView').style.display = 'none';
                document.getElementById('successView').style.display = 'block';
            } else {
                errEl.textContent = data.error || 'Reset failed. The link may have expired.';
                errEl.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = `<svg class="stroke-icon" style="width:18px;height:18px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Set New Password`;
                if (resp.status === 400 && data.error && data.error.includes('expired')) {
                    document.getElementById('resetFormView').style.display = 'none';
                    document.getElementById('invalidView').style.display = 'block';
                }
            }
        } catch (err) {
            errEl.textContent = 'Something went wrong. Please try again.';
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = `<svg class="stroke-icon" style="width:18px;height:18px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Set New Password`;
        }
    });
});

  })();
}

// --- shop-login.js ---
if (window.location.pathname.includes('shop-login.html')) {
  (function() {
// js/shop-owner/shop-login.js
// Handles login logic for shop owner

// Redirect if already logged in
document.addEventListener('DOMContentLoaded', redirectIfAuthenticated);

// Password toggle
document.getElementById('togglePassword').addEventListener('click', function() {
    const pw = document.getElementById('password');
    pw.type = pw.type === 'password' ? 'text' : 'password';
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('errorMsg');
    const btn = document.getElementById('loginBtn');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Logging in...';

    try {
        const data = await login(
            document.getElementById('username').value.trim(),
            document.getElementById('password').value
        );
        
        if (data.role === 'ROLE_CUSTOMER') {
            window.location.href = data.isFirstLogin ? '/customer/first-login.html' : '/customer/dashboard.html';
        } else {
            window.location.href = '/shop-owner/dashboard.html';
        }
    } catch (err) {
        errEl.textContent = err.message || 'Invalid username or password';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = `<svg class="stroke-icon" style="width:18px;height:18px;" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> Login`;
    }
});

  })();
}

