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

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value ?? '';
        return div.innerHTML;
    }

    function statusPillHtml(status) {
        const cls = (status || '').toLowerCase();
        return `<span class="status-pill ${cls}">${escapeHtml(status)}</span>`;
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
    //  ROLE-BASED UI (admin-only Reports / Staff Accounts)
    // =========================================================
    const isAdmin = ApiService.isAdmin();
    const navReports = document.getElementById('navReports');
    const navStaff = document.getElementById('navStaff');
    const quickActionReports = document.getElementById('quickActionReports');
    const ovRevenueCard = document.getElementById('ovRevenueCard');
    if (navReports) navReports.style.display = isAdmin ? '' : 'none';
    if (navStaff) navStaff.style.display = isAdmin ? '' : 'none';
    if (quickActionReports) quickActionReports.style.display = isAdmin ? '' : 'none';
    if (ovRevenueCard) ovRevenueCard.style.display = isAdmin ? '' : 'none';

    const username = ApiService.getUsername() || 'Staff User';
    const userNameEl = document.getElementById('userName');
    const userRoleLabelEl = document.getElementById('userRoleLabel');
    const userAvatarEl = document.getElementById('userAvatar');
    if (userNameEl) userNameEl.textContent = username;
    if (userRoleLabelEl) userRoleLabelEl.textContent = isAdmin ? 'Administrator' : 'Receptionist';
    if (userAvatarEl) userAvatarEl.textContent = username.slice(0, 2).toUpperCase();
    const welcomeRoleBadge = document.getElementById('welcomeRoleBadge');
    if (welcomeRoleBadge) {
        welcomeRoleBadge.innerHTML = `<span class="badge-dot"></span> ${isAdmin ? 'Administrator' : 'Receptionist'}`;
    }

    const welcomeGreeting = document.getElementById('welcomeGreeting');
    const welcomeName = document.getElementById('welcomeName');
    const welcomeDate = document.getElementById('welcomeDate');
    if (welcomeGreeting) {
        const hour = new Date().getHours();
        welcomeGreeting.textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    }
    if (welcomeName) welcomeName.textContent = username;
    if (welcomeDate) {
        welcomeDate.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }


    // =========================================================
    //  SECTION NAVIGATION (shared by sidebar nav + quick actions)
    // =========================================================
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    function activateSection(targetId, title, subtitle) {
        navItems.forEach(nav => nav.classList.toggle('active', nav.getAttribute('data-target') === targetId));

        if (pageTitle) pageTitle.textContent = title || '';
        if (pageSubtitle) pageSubtitle.textContent = subtitle || '';

        sections.forEach(sec => sec.style.display = 'none');
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.style.animation = 'none';
            targetSection.offsetHeight;
            targetSection.style.animation = 'fadeIn 0.3s ease';
        }

        if (targetId === 'overview-section') loadOverview();
        if (targetId === 'search-section') loadAppointmentsTable();
        if (targetId === 'reports-section') loadReports();
        if (targetId === 'staff-section') loadStaff();
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            activateSection(item.getAttribute('data-target'), item.getAttribute('data-title'), item.getAttribute('data-subtitle'));
        });
    });

    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('click', () => {
            activateSection(card.getAttribute('data-target'), card.getAttribute('data-title'), card.getAttribute('data-subtitle'));
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
                            <td><strong style="color: var(--text-primary); font-weight: 600;">${escapeHtml(p.name)}</strong></td>
                            <td>${escapeHtml(p.contactNumber)}</td>
                            <td>${escapeHtml(p.address)}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            }

            const statEl = document.getElementById('statPatients');
            if (statEl) statEl.textContent = patients.length;

            return patients;
        } catch (err) {
            console.error('Failed to load patients', err);
            return [];
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
    //  APPOINTMENT DETAILS + BILL (shared renderer)
    // =========================================================
    let currentAppointment = null;

    function renderAppointmentDetails(appt) {
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

        document.getElementById('cancelAppointmentBtn').style.display = appt.status === 'CANCELLED' ? 'none' : '';

        const detailsDiv = document.getElementById('appointmentDetails');
        document.getElementById('billSection').style.display = 'none';
        document.getElementById('verifyBillResult').style.display = 'none';

        detailsDiv.style.display = 'block';
        detailsDiv.style.animation = 'none';
        detailsDiv.offsetHeight;
        detailsDiv.style.animation = 'fadeIn 0.3s ease';
        detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function goToAppointment(appt) {
        const searchNav = document.querySelector('.nav-item[data-target="search-section"]');
        activateSection('search-section', searchNav.getAttribute('data-title'), searchNav.getAttribute('data-subtitle'));
        document.getElementById('searchError').style.display = 'none';
        renderAppointmentDetails(appt);
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
                renderAppointmentDetails(appt);
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
                updated.patient = currentAppointment.patient;
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
    //  ALL APPOINTMENTS (browse / filter / click-to-load)
    // =========================================================
    function renderAppointmentsTable(tbodySelector, appointments, emptyColspan) {
        const tbody = document.querySelector(tbodySelector);
        if (!tbody) return;

        if (appointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${emptyColspan}">
                        <div class="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <p>No appointments found.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = '';
        appointments.forEach(appt => {
            const tr = document.createElement('tr');
            tr.className = 'table-row-clickable';
            const treatmentCell = emptyColspan === 6 ? `<td>${escapeHtml(appt.treatment?.name || '')}</td>` : '';
            tr.innerHTML = `
                <td><strong style="color: var(--primary); font-weight: 600;">${escapeHtml(appt.appointmentNumber)}</strong></td>
                <td>${escapeHtml(appt.patient.name)}</td>
                <td>${escapeHtml(appt.dentistName)}</td>
                ${treatmentCell}
                <td>${escapeHtml(appt.appointmentDate)} · ${escapeHtml(appt.appointmentTime)}</td>
                <td>${statusPillHtml(appt.status)}</td>
            `;
            tr.addEventListener('click', () => goToAppointment(appt));
            tbody.appendChild(tr);
        });
    }

    async function loadAppointmentsTable() {
        const status = document.getElementById('appointmentStatusFilter')?.value || '';
        try {
            const appointments = await ApiService.listAppointments(status ? { status } : {});
            renderAppointmentsTable('#allAppointmentsTable tbody', appointments, 6);
        } catch (err) {
            console.error('Failed to load appointments', err);
        }
    }

    const statusFilter = document.getElementById('appointmentStatusFilter');
    if (statusFilter) statusFilter.addEventListener('change', loadAppointmentsTable);
    const refreshBtn = document.getElementById('refreshAppointmentsBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAppointmentsTable);


    // =========================================================
    //  OVERVIEW (landing page)
    // =========================================================
    async function loadOverview() {
        try {
            const [patients, appointments] = await Promise.all([
                ApiService.getPatients(),
                ApiService.listAppointments()
            ]);

            const today = new Date().toISOString().split('T')[0];
            const todayCount = appointments.filter(a => a.appointmentDate === today && a.status !== 'CANCELLED').length;
            const upcomingCount = appointments.filter(a => a.appointmentDate >= today && a.status === 'SCHEDULED').length;

            document.getElementById('ovAppointmentsToday').textContent = todayCount;
            document.getElementById('ovTotalPatients').textContent = patients.length;
            document.getElementById('ovUpcoming').textContent = upcomingCount;

            renderAppointmentsTable('#recentAppointmentsTable tbody', appointments.slice(0, 5), 5);

            if (isAdmin) {
                try {
                    const summary = await ApiService.getReportSummary();
                    document.getElementById('ovRevenue').textContent = formatCurrency(summary.revenueThisMonth);
                } catch (err) {
                    console.error('Failed to load revenue summary', err);
                }
            }
        } catch (err) {
            console.error('Failed to load overview', err);
        }
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
    //  STAFF ACCOUNTS (admin only)
    // =========================================================
    async function loadStaff() {
        try {
            const staff = await ApiService.listUsers();
            const tbody = document.querySelector('#staffTable tbody');
            if (!tbody) return;

            if (staff.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><p>No staff accounts found.</p></div></td></tr>`;
                return;
            }

            tbody.innerHTML = '';
            staff.forEach(u => {
                const isSelf = u.username === ApiService.getUsername();
                const roleLabel = u.role === 'ROLE_ADMIN' ? 'Administrator' : 'Receptionist';
                const roleClass = u.role === 'ROLE_ADMIN' ? 'role-pill' : 'role-pill receptionist';
                const created = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong style="color: var(--text-primary); font-weight: 600;">${escapeHtml(u.username)}${isSelf ? ' <span style="color:var(--text-muted); font-weight:400;">(you)</span>' : ''}</strong></td>
                    <td><span class="${roleClass}">${roleLabel}</span></td>
                    <td>${created}</td>
                    <td style="text-align:right;">
                        <button class="btn-icon-danger" title="${isSelf ? 'You cannot delete your own account' : 'Delete account'}" ${isSelf ? 'disabled' : ''} data-id="${u.id}" data-username="${escapeHtml(u.username)}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            tbody.querySelectorAll('.btn-icon-danger:not(:disabled)').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const uname = btn.dataset.username;
                    if (!window.confirm(`Remove staff account "${uname}"? They will no longer be able to sign in.`)) return;
                    try {
                        await ApiService.deleteUser(id);
                        showToast(`Staff account "${uname}" removed.`, 'success');
                        loadStaff();
                    } catch (err) {
                        showToast(err.message || 'Failed to remove staff account.', 'error');
                    }
                });
            });
        } catch (err) {
            console.error('Failed to load staff accounts', err);
        }
    }

    const staffForm = document.getElementById('staffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const staffMsg = document.getElementById('staffMsg');
            const data = {
                username: document.getElementById('newStaffUsername').value,
                password: document.getElementById('newStaffPassword').value,
                role: document.getElementById('newStaffRole').value
            };
            try {
                await ApiService.createUser(data);
                staffMsg.textContent = `Account "${data.username}" created successfully!`;
                staffMsg.className = 'message success';
                staffForm.reset();
                showToast(`Staff account "${data.username}" created.`, 'success');
                loadStaff();
            } catch (err) {
                staffMsg.textContent = err.message;
                staffMsg.className = 'message error';
                showToast(err.message || 'Failed to create staff account.', 'error');
            }
        });
    }


    // =========================================================
    //  REPORTS (admin only) — stat tiles + Chart.js visualisations
    // =========================================================
    let reportsLoaded = false;

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
            new Chart(document.getElementById('revenueChart'), {
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
            new Chart(document.getElementById('trendChart'), {
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
            new Chart(document.getElementById('workloadChart'), {
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


    // =========================================================
    //  INITIAL LOAD (Overview is the default landing section)
    // =========================================================
    loadOverview();

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
