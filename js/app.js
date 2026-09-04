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

    function formatCurrency(value) {
        return `LKR ${parseFloat(value).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
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

            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';
            submitBtn.disabled = true;

            try {
                const res = await ApiService.login(username, password);
                ApiService.setToken(res.token);
                ApiService.setRole(res.role);
                ApiService.setUsername(res.username);
                window.location.href = 'dashboard.html';
            } catch (err) {
                errorDiv.textContent = 'Invalid username or password. Please try again.';
                errorDiv.style.display = 'block';
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;

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
    //  ROLE-BASED UI (admin-only Reports nav + treatment form)
    // =========================================================
    const isAdmin = ApiService.isAdmin();
    const navReports = document.getElementById('navReports');
    if (navReports) navReports.style.display = isAdmin ? '' : 'none';

    const userNameEl = document.getElementById('userName');
    const userRoleLabelEl = document.getElementById('userRoleLabel');
    const userAvatarEl = document.getElementById('userAvatar');
    const username = ApiService.getUsername() || 'Staff User';
    if (userNameEl) userNameEl.textContent = username;
    if (userRoleLabelEl) userRoleLabelEl.textContent = isAdmin ? 'Administrator' : 'Receptionist';
    if (userAvatarEl) userAvatarEl.textContent = username.slice(0, 2).toUpperCase();


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

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            if (pageTitle) pageTitle.textContent = item.getAttribute('data-title') || '';
            if (pageSubtitle) pageSubtitle.textContent = item.getAttribute('data-subtitle') || '';

            sections.forEach(sec => sec.style.display = 'none');
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.style.animation = 'none';
                targetSection.offsetHeight;
                targetSection.style.animation = 'fadeIn 0.3s ease';
            }

            if (targetId === 'reports-section') {
                loadReports();
            }
        });
    });


    // =========================================================
    //  LOGOUT
    // =========================================================
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await ApiService.logout();
        ApiService.clearSession();
        window.location.href = 'index.html';
    });


    // =========================================================
    //  LOAD TREATMENTS
    // =========================================================
    const treatmentSelect = document.getElementById('treatmentType');
    const loadTreatments = () => {
        return ApiService.getTreatments().then(treatments => {
            if (treatmentSelect) {
                treatmentSelect.innerHTML = '<option value="">Select Treatment...</option>';
                treatments.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.id;
                    option.textContent = `${t.name} — ${formatCurrency(t.cost)}`;
                    treatmentSelect.appendChild(option);
                });
            }
            const statEl = document.getElementById('statTreatments');
            if (statEl) statEl.textContent = treatments.length;
            return treatments;
        }).catch(err => console.error('Failed to load treatments', err));
    };
    loadTreatments();


    // =========================================================
    //  LOAD PATIENTS (Dropdown + Table)
    // =========================================================
    const loadPatients = async () => {
        try {
            const patients = await ApiService.getPatients();

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
                address: document.getElementById('newAddress').value,
                email: document.getElementById('newEmail').value || null
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
                showToast(err.message || 'Failed to register patient.', 'error');
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
                showToast(`Appointment ${appt.appointmentNumber} created! A confirmation was sent to the patient.`, 'success');
            } catch (err) {
                registerMsg.textContent = err.message;
                registerMsg.className = 'message error';
                showToast(err.message || 'Failed to register appointment.', 'error');
            }
        });
    }


    // =========================================================
    //  SEARCH APPOINTMENT
    // =========================================================
    let currentAppointment = null;

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
            document.getElementById('verifyBillResult').style.display = 'none';

            if (!input) {
                errDiv.textContent = 'Please enter an appointment number.';
                errDiv.style.display = 'block';
                return;
            }

            try {
                const appt = await ApiService.getAppointment(input);
                currentAppointment = appt;

                document.getElementById('dtl-number').textContent = appt.appointmentNumber;
                document.getElementById('dtl-name').textContent = appt.patient.name;
                document.getElementById('dtl-contact').textContent = appt.patient.contactNumber;
                document.getElementById('dtl-dentist').textContent = appt.dentistName;
                document.getElementById('dtl-date').textContent = appt.appointmentDate;
                document.getElementById('dtl-time').textContent = appt.appointmentTime;

                const statusEl = document.getElementById('dtl-status');
                statusEl.textContent = appt.status;
                statusEl.className = `badge ${appt.status === 'CANCELLED' ? 'badge-danger' : 'badge-success'}`;

                const cancelBtn = document.getElementById('cancelAppointmentBtn');
                cancelBtn.style.display = appt.status === 'CANCELLED' ? 'none' : '';

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
    //  CANCEL APPOINTMENT
    // =========================================================
    const cancelBtn = document.getElementById('cancelAppointmentBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            if (!currentAppointment) return;
            const confirmed = window.confirm(
                `Cancel appointment ${currentAppointment.appointmentNumber} for ${currentAppointment.patient.name}? This cannot be undone.`);
            if (!confirmed) return;

            try {
                const updated = await ApiService.cancelAppointment(currentAppointment.appointmentNumber);
                currentAppointment = updated;

                const statusEl = document.getElementById('dtl-status');
                statusEl.textContent = updated.status;
                statusEl.className = 'badge badge-danger';
                cancelBtn.style.display = 'none';

                showToast(`Appointment ${updated.appointmentNumber} cancelled. The patient has been notified.`, 'success');
            } catch (err) {
                showToast(err.message || 'Failed to cancel appointment.', 'error');
            }
        });
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
                document.getElementById('bill-tcost').textContent = formatCurrency(bill.treatmentCost);
                document.getElementById('bill-cfee').textContent = formatCurrency(bill.consultationFee);
                document.getElementById('bill-total').textContent = formatCurrency(bill.totalAmount);

                const discountRow = document.getElementById('bill-discount-row');
                if (bill.discountAmount && parseFloat(bill.discountAmount) > 0) {
                    document.getElementById('bill-discount-label').textContent = bill.discountDescription;
                    document.getElementById('bill-discount').textContent = `- ${formatCurrency(bill.discountAmount)}`;
                    discountRow.style.display = 'flex';
                } else {
                    discountRow.style.display = 'none';
                }

                const verifyBtn = document.getElementById('verifyBillBtn');
                verifyBtn.style.display = isAdmin ? '' : 'none';
                verifyBtn.dataset.appNo = appNo;
                document.getElementById('verifyBillResult').style.display = 'none';

                const billSection = document.getElementById('billSection');
                billSection.style.display = 'block';
                billSection.style.animation = 'none';
                billSection.offsetHeight;
                billSection.style.animation = 'fadeIn 0.3s ease';

                showToast('Invoice generated successfully!', 'success');
            } catch (err) {
                showToast(err.message || 'Failed to generate invoice.', 'error');
            }
        });
    }


    // =========================================================
    //  VERIFY BILL VIA STORED PROCEDURE (admin only)
    // =========================================================
    const verifyBillBtn = document.getElementById('verifyBillBtn');
    if (verifyBillBtn) {
        verifyBillBtn.addEventListener('click', async () => {
            const appNo = verifyBillBtn.dataset.appNo;
            const resultEl = document.getElementById('verifyBillResult');
            try {
                const result = await ApiService.verifyBill(appNo);
                resultEl.textContent =
                    `Database (sp_calculate_bill) computed: treatment ${formatCurrency(result.treatmentCost)} + ` +
                    `consultation ${formatCurrency(result.consultationFee)} - discount ${formatCurrency(result.discountAmount)} ` +
                    `= ${formatCurrency(result.totalAmount)}. This matches the Java-side calculation above.`;
                resultEl.style.display = 'block';
            } catch (err) {
                showToast(err.message || 'Stored procedure verification failed.', 'error');
            }
        });
    }


    // =========================================================
    //  ADD TREATMENT (admin only)
    // =========================================================
    const treatmentForm = document.getElementById('treatmentForm');
    if (treatmentForm) {
        treatmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const treatmentMsg = document.getElementById('treatmentMsg');
            const data = {
                name: document.getElementById('newTreatmentName').value,
                cost: parseFloat(document.getElementById('newTreatmentCost').value)
            };
            try {
                await ApiService.createTreatment(data);
                treatmentMsg.textContent = 'Treatment added successfully!';
                treatmentMsg.className = 'message success';
                treatmentForm.reset();
                showToast(`Treatment "${data.name}" added to the price list.`, 'success');
                loadTreatments();
            } catch (err) {
                treatmentMsg.textContent = err.message;
                treatmentMsg.className = 'message error';
                showToast(err.message || 'Failed to add treatment.', 'error');
            }
        });
    }


    // =========================================================
    //  REPORTS (admin only) — stat tiles + Chart.js visualisations
    // =========================================================
    let reportsLoaded = false;
    let revenueChart, trendChart, workloadChart;

    async function loadReports() {
        if (!isAdmin || reportsLoaded) return;
        reportsLoaded = true;

        try {
            const summary = await ApiService.getReportSummary();
            document.getElementById('repAppointmentsToday').textContent = summary.appointmentsToday;
            document.getElementById('repUpcoming').textContent = summary.upcomingAppointments;
            document.getElementById('repRevenue').textContent = formatCurrency(summary.revenueThisMonth);
        } catch (err) {
            console.error('Failed to load report summary', err);
        }

        const chartTextColor = getComputedStyle(document.body).getPropertyValue('--text-secondary') || '#475569';
        Chart.defaults.color = chartTextColor.trim() || '#475569';
        Chart.defaults.font.family = "'Inter', sans-serif";

        try {
            const revenue = await ApiService.getRevenueByTreatment();
            revenueChart = new Chart(document.getElementById('revenueChart'), {
                type: 'bar',
                data: {
                    labels: revenue.map(r => r.treatmentName),
                    datasets: [{
                        label: 'Revenue (LKR)',
                        data: revenue.map(r => r.totalRevenue),
                        backgroundColor: '#7c3aed'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        } catch (err) {
            console.error('Failed to load revenue report', err);
        }

        try {
            const trend = await ApiService.getAppointmentsByDay(14);
            trendChart = new Chart(document.getElementById('trendChart'), {
                type: 'line',
                data: {
                    labels: trend.map(t => t.date),
                    datasets: [{
                        label: 'Appointments',
                        data: trend.map(t => t.appointmentCount),
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13, 148, 136, 0.15)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        } catch (err) {
            console.error('Failed to load appointment trend report', err);
        }

        try {
            const workload = await ApiService.getDentistWorkload();
            workloadChart = new Chart(document.getElementById('workloadChart'), {
                type: 'bar',
                data: {
                    labels: workload.map(w => w.dentistName),
                    datasets: [{
                        label: 'Appointments',
                        data: workload.map(w => w.appointmentCount),
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        } catch (err) {
            console.error('Failed to load dentist workload report', err);
        }
    }


    // =========================================================
    //  SET DEFAULT DATE TO TOMORROW (clinic requires future booking)
    // =========================================================
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const iso = tomorrow.toISOString().split('T')[0];
        dateInput.value = iso;
        dateInput.min = iso;
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
