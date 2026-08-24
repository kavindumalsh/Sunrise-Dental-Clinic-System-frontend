document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    //  TOAST NOTIFICATION SYSTEM
    // =========================================================
    function showToast(message, type = 'success', duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : '!'}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }


    // =========================================================
    //  LOGIN PAGE
    // =========================================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        if (ApiService.getToken()) {
            window.location.href = 'dashboard.html';
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');
            const submitBtn = document.getElementById('loginSubmitBtn');

            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';
            submitBtn.disabled = true;

            try {
                const res = await ApiService.login(username, password);
                ApiService.setToken(res.token);
                window.location.href = 'dashboard.html';
            } catch (err) {
                errorDiv.textContent = 'Invalid username or password. Please try again.';
                errorDiv.style.display = 'block';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

                // Shake animation
                const container = document.querySelector('.login-container');
                container.style.animation = 'none';
                container.offsetHeight; // trigger reflow
                container.style.animation = 'shake 0.4s ease';
            }
        });
        return;
    }


    // =========================================================
    //  DASHBOARD — AUTH GUARD
    // =========================================================
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }


    // =========================================================
    //  SIDEBAR NAVIGATION
    // =========================================================
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update header
            if (pageTitle) pageTitle.textContent = item.getAttribute('data-title') || '';
            if (pageSubtitle) pageSubtitle.textContent = item.getAttribute('data-subtitle') || '';

            // Show target section
            sections.forEach(sec => sec.style.display = 'none');
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                // Re-trigger animation
                targetSection.style.animation = 'none';
                targetSection.offsetHeight;
                targetSection.style.animation = 'fadeIn 0.3s ease';
            }
        });
    });


    // =========================================================
    //  LOGOUT
    // =========================================================
    document.getElementById('logoutBtn').addEventListener('click', () => {
        ApiService.removeToken();
        window.location.href = 'index.html';
    });


    // =========================================================
    //  LOAD TREATMENTS
    // =========================================================
    const treatmentSelect = document.getElementById('treatmentType');
    if (treatmentSelect) {
        ApiService.getTreatments().then(treatments => {
            treatments.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.name;
                treatmentSelect.appendChild(option);
            });
            // Update stat
            const statEl = document.getElementById('statTreatments');
            if (statEl) statEl.textContent = treatments.length;
        }).catch(err => console.error('Failed to load treatments', err));
    }


    // =========================================================
    //  LOAD PATIENTS (Dropdown + Table)
    // =========================================================
    const loadPatients = async () => {
        try {
            const patients = await ApiService.getPatients();

            // Populate Dropdown
            const patientSelect = document.getElementById('patientSelect');
            if (patientSelect) {
                patientSelect.innerHTML = '<option value="">Select Patient...</option>';
                patients.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = `${p.id} — ${p.name}`;
                    patientSelect.appendChild(option);
                });
            }

            // Populate Table
            const tbody = document.querySelector('#patientsTable tbody');
            if (tbody) {
                if (patients.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="4">
                                <div class="empty-state">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                    <p>No patients registered yet.</p>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    tbody.innerHTML = '';
                    patients.forEach(p => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong style="color: var(--primary); font-weight: 600;">#${p.id}</strong></td>
                            <td><strong style="color: var(--text-primary); font-weight: 600;">${p.name}</strong></td>
                            <td>${p.contactNumber}</td>
                            <td>${p.address}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            }

            // Update stat
            const statEl = document.getElementById('statPatients');
            if (statEl) statEl.textContent = patients.length;

        } catch (err) {
            console.error('Failed to load patients', err);
        }
    };
    loadPatients();


    // =========================================================
    //  REGISTER PATIENT
    // =========================================================
    const patientForm = document.getElementById('patientForm');
    const patientMsg = document.getElementById('patientMsg');
    if (patientForm) {
        patientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('newPatientName').value,
                contactNumber: document.getElementById('newContactNumber').value,
                address: document.getElementById('newAddress').value
            };

            try {
                await ApiService.createPatient(data);
                patientMsg.textContent = 'Patient registered successfully!';
                patientMsg.className = 'message success';
                patientForm.reset();
                loadPatients();
                showToast(`Patient "${data.name}" registered successfully!`, 'success');
            } catch (err) {
                patientMsg.textContent = err.message;
                patientMsg.className = 'message error';
                showToast('Failed to register patient.', 'error');
            }
        });
    }


    // =========================================================
    //  REGISTER APPOINTMENT
    // =========================================================
    const registerForm = document.getElementById('registerForm');
    const registerMsg = document.getElementById('registerMsg');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const data = {
                patientId: parseInt(document.getElementById('patientSelect').value),
                dentistName: document.getElementById('dentistName').value,
                treatmentTypeId: parseInt(document.getElementById('treatmentType').value),
                appointmentDate: document.getElementById('appointmentDate').value,
                appointmentTime: document.getElementById('appointmentTime').value + ':00' // backend expects HH:mm:ss
            };

            try {
                const appt = await ApiService.registerAppointment(data);
                registerMsg.textContent = `Appointment booked! Number: ${appt.appointmentNumber}`;
                registerMsg.className = 'message success';
                registerForm.reset();
                showToast(`Appointment ${appt.appointmentNumber} created!`, 'success');
            } catch (err) {
                registerMsg.textContent = err.message;
                registerMsg.className = 'message error';
                showToast('Failed to register appointment.', 'error');
            }
        });
    }


    // =========================================================
    //  SEARCH APPOINTMENT
    // =========================================================
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        const doSearch = async () => {
            const input = document.getElementById('searchInput').value.trim();
            const errDiv = document.getElementById('searchError');
            const detailsDiv = document.getElementById('appointmentDetails');
            const billDiv = document.getElementById('billSection');

            errDiv.style.display = 'none';
            detailsDiv.style.display = 'none';
            billDiv.style.display = 'none';

            if (!input) {
                errDiv.textContent = 'Please enter an appointment number.';
                errDiv.style.display = 'block';
                return;
            }

            try {
                const appt = await ApiService.getAppointment(input);
                document.getElementById('dtl-number').textContent = appt.appointmentNumber;
                document.getElementById('dtl-name').textContent = appt.patientName;
                document.getElementById('dtl-contact').textContent = appt.contactNumber;
                document.getElementById('dtl-dentist').textContent = appt.dentistName;
                document.getElementById('dtl-date').textContent = appt.appointmentDate;
                document.getElementById('dtl-time').textContent = appt.appointmentTime;

                detailsDiv.style.display = 'block';
                detailsDiv.style.animation = 'none';
                detailsDiv.offsetHeight;
                detailsDiv.style.animation = 'fadeIn 0.3s ease';
            } catch (err) {
                errDiv.textContent = 'Appointment not found. Please verify the number.';
                errDiv.style.display = 'block';
                showToast('Appointment not found.', 'error');
            }
        };

        searchBtn.addEventListener('click', doSearch);

        // Also search on Enter key
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    doSearch();
                }
            });
        }
    }


    // =========================================================
    //  GENERATE BILL
    // =========================================================
    const generateBillBtn = document.getElementById('generateBillBtn');
    if (generateBillBtn) {
        generateBillBtn.addEventListener('click', async () => {
            const appNo = document.getElementById('dtl-number').textContent;
            try {
                const bill = await ApiService.getBill(appNo);

                document.getElementById('bill-appno').textContent = bill.appointmentNumber;
                document.getElementById('bill-name').textContent = bill.patientName;
                document.getElementById('bill-treatment').textContent = bill.treatmentName;
                document.getElementById('bill-tcost').textContent = `LKR ${parseFloat(bill.treatmentCost).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
                document.getElementById('bill-cfee').textContent = `LKR ${parseFloat(bill.consultationFee).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
                document.getElementById('bill-total').textContent = `LKR ${parseFloat(bill.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

                const billSection = document.getElementById('billSection');
                billSection.style.display = 'block';
                billSection.style.animation = 'none';
                billSection.offsetHeight;
                billSection.style.animation = 'fadeIn 0.3s ease';

                showToast('Invoice generated successfully!', 'success');
            } catch (err) {
                showToast('Failed to generate invoice.', 'error');
            }
        });
    }


    // =========================================================
    //  SET DEFAULT DATE TO TODAY
    // =========================================================
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;
    }

});


// =========================================================
//  SHAKE ANIMATION (for login errors)
// =========================================================
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);
