document.addEventListener('DOMContentLoaded', () => {

    // --- Login Logic ---
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

            try {
                const res = await ApiService.login(username, password);
                ApiService.setToken(res.token);
                window.location.href = 'dashboard.html';
            } catch (err) {
                errorDiv.textContent = 'Invalid username or password';
                errorDiv.style.display = 'block';
            }
        });
        return; // Stop execution on login page
    }

    // --- Dashboard Logic ---
    if (!ApiService.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    // Sidebar Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.style.display = 'none');
            
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        ApiService.removeToken();
        window.location.href = 'index.html';
    });

    // Populate Treatments
    const treatmentSelect = document.getElementById('treatmentType');
    if (treatmentSelect) {
        ApiService.getTreatments().then(treatments => {
            treatments.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.name;
                treatmentSelect.appendChild(option);
            });
        }).catch(err => console.error('Failed to load treatments', err));
    }

    // Load Patients for Dropdown and Table
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
                    option.textContent = `${p.id} - ${p.name}`;
                    patientSelect.appendChild(option);
                });
            }

            // Populate Table
            const tbody = document.querySelector('#patientsTable tbody');
            if (tbody) {
                tbody.innerHTML = '';
                patients.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${p.id}</td>
                        <td>${p.name}</td>
                        <td>${p.contactNumber}</td>
                        <td>${p.address}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (err) {
            console.error('Failed to load patients', err);
        }
    };
    loadPatients(); // Initial load

    // Register Patient
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
                loadPatients(); // Reload the lists
            } catch (err) {
                patientMsg.textContent = err.message;
                patientMsg.className = 'message error';
            }
        });
    }

    // Register Appointment
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
                registerMsg.textContent = `Success! Appointment Number: ${appt.appointmentNumber}`;
                registerMsg.className = 'message success';
                registerForm.reset();
            } catch (err) {
                registerMsg.textContent = err.message;
                registerMsg.className = 'message error';
            }
        });
    }

    // Search Appointment
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const input = document.getElementById('searchInput').value;
            const errDiv = document.getElementById('searchError');
            const detailsDiv = document.getElementById('appointmentDetails');
            const billDiv = document.getElementById('billSection');

            errDiv.style.display = 'none';
            detailsDiv.style.display = 'none';
            billDiv.style.display = 'none';

            if (!input) {
                errDiv.textContent = 'Please enter an appointment number';
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
            } catch (err) {
                errDiv.textContent = 'Appointment not found.';
                errDiv.style.display = 'block';
            }
        });
    }

    // Generate Bill
    const generateBillBtn = document.getElementById('generateBillBtn');
    if (generateBillBtn) {
        generateBillBtn.addEventListener('click', async () => {
            const appNo = document.getElementById('dtl-number').textContent;
            try {
                const bill = await ApiService.getBill(appNo);
                
                document.getElementById('bill-appno').textContent = bill.appointmentNumber;
                document.getElementById('bill-name').textContent = bill.patientName;
                document.getElementById('bill-treatment').textContent = bill.treatmentName;
                document.getElementById('bill-tcost').textContent = `LKR ${bill.treatmentCost}`;
                document.getElementById('bill-cfee').textContent = `LKR ${bill.consultationFee}`;
                document.getElementById('bill-total').textContent = `LKR ${bill.totalAmount}`;

                document.getElementById('billSection').style.display = 'block';
            } catch (err) {
                alert('Failed to generate bill');
            }
        });
    }
});
