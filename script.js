const BASE_URL = 'https://api-three-tawny-22.vercel.app';

// Helper: Save/Get Auth Token
const setToken = (token) => localStorage.setItem('nexus_token', token);
const getToken = () => localStorage.getItem('nexus_token');
const removeToken = () => localStorage.removeItem('nexus_token');

// Axios Instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor
api.interceptors.request.use(config => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response && err.response.status === 401) {
            removeToken();
            if (!window.location.href.includes('index.html')) window.location.href = 'index.html';
        }
        return Promise.reject(err);
    }
);

// Auth Guard
const checkAuth = () => {
    const token = getToken();
    const path = window.location.pathname;
    const isLoginPage = path.includes('index.html') || path.endsWith('/') || path.endsWith('/nexus-wifi-system/') || path.endsWith('/nexus-wifi-system');
    const isRegisterPage = path.includes('register.html');

    if (token && (isLoginPage || isRegisterPage)) {
        window.location.href = 'dashboard.html';
    } else if (!token && !isLoginPage && !isRegisterPage) {
        window.location.href = 'index.html';
    }
};

// Main Initialization
function init() {
    checkAuth();
    
    const path = window.location.pathname;

    // Login Form (Direct Login)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const original = btn.innerHTML;
            
            try {
                btn.disabled = true;
                btn.innerHTML = 'Signing in...';
                const identifier = document.getElementById('identifier').value;
                const password = document.getElementById('password').value;

                const res = await api.post('/api/auth/login', { identifier, password });
                
                if (res.data.success) {
                    const token = res.data.data?.token || res.data.token;
                    if (token) setToken(token);
                    
                    Swal.fire({ icon: 'success', title: 'Login Success', timer: 1000, showConfirmButton: false })
                        .then(() => window.location.href = 'dashboard.html');
                } else {
                    throw new Error(res.data.message || "Invalid credentials");
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = original;
                const errorMsg = err.response?.data?.message || err.message || 'Login failed';
                Swal.fire('Error', errorMsg, 'error');
            }
        });
    }

    // Register Form (With OTP)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            const original = btn.innerHTML;
            try {
                const pass = document.getElementById('regPassword').value;
                const confirm = document.getElementById('confirmPassword').value;
                const email = document.getElementById('email').value;
                const mobile = document.getElementById('mobile').value;

                if (pass !== confirm) return Swal.fire('Error', 'Passwords do not match', 'error');

                btn.disabled = true;
                btn.innerHTML = 'Sending OTP...';
                
                // Step 1: Send OTP
                const otpRes = await api.post('/api/auth/send-register-otp', { email, mobile });
                
                if (otpRes.data.success) {
                    const { value: otp } = await Swal.fire({
                        title: 'Verify Email',
                        text: `A 6-digit code has been sent to ${email}`,
                        input: 'text',
                        inputPlaceholder: 'Enter OTP',
                        showCancelButton: true,
                        confirmButtonText: 'Verify & Register',
                        inputValidator: (value) => {
                            if (!value) return 'You need to enter the code!';
                            if (value.length !== 6) return 'Code must be 6 digits';
                        }
                    });

                    if (otp) {
                        btn.innerHTML = 'Creating Account...';
                        const data = {
                            firstName: document.getElementById('firstName').value,
                            lastName: document.getElementById('lastName').value,
                            email,
                            mobile,
                            password: pass,
                            confirmPassword: confirm,
                            otp
                        };

                        const res = await api.post('/api/auth/register', data);
                        if (res.data.success) {
                            Swal.fire('Success', 'Account created! You can now login.', 'success')
                                .then(() => window.location.href = 'index.html');
                        }
                    } else {
                        btn.disabled = false;
                        btn.innerHTML = original;
                    }
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = original;
                Swal.fire('Error', err.response?.data?.message || 'Registration failed', 'error');
            }
        });
    }

    // Forgot Password Flow
    document.getElementById('forgotPasswordLink')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { value: identifier } = await Swal.fire({
            title: 'Forgot Password',
            text: 'Enter your email or mobile to receive a reset code',
            input: 'text',
            inputPlaceholder: 'Email or Mobile',
            showCancelButton: true
        });

        if (identifier) {
            try {
                Swal.fire({ title: 'Sending...', didOpen: () => Swal.showLoading() });
                const res = await api.post('/api/auth/forgot-password', { identifier });
                
                if (res.data.success) {
                    const email = res.data.data.email;
                    const { value: formValues } = await Swal.fire({
                        title: 'Reset Password',
                        html:
                            `<p class="text-sm mb-4">Code sent to ${email}</p>` +
                            '<input id="swal-otp" class="swal2-input" placeholder="6-digit Code">' +
                            '<input id="swal-pass" type="password" class="swal2-input" placeholder="New Password">' +
                            '<input id="swal-confirm" type="password" class="swal2-input" placeholder="Confirm Password">',
                        focusConfirm: false,
                        showCancelButton: true,
                        preConfirm: () => {
                            return {
                                otp: document.getElementById('swal-otp').value,
                                newPassword: document.getElementById('swal-pass').value,
                                confirmPassword: document.getElementById('swal-confirm').value
                            }
                        }
                    });

                    if (formValues) {
                        const resetRes = await api.post('/api/auth/reset-password', {
                            email,
                            ...formValues
                        });
                        if (resetRes.data.success) {
                            Swal.fire('Success', 'Password reset successfully!', 'success');
                        }
                    }
                }
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Failed to send code', 'error');
            }
        }
    });

    if (path.includes('dashboard.html')) loadDashboard();
    if (path.includes('subscription.html')) loadPackages();

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        removeToken();
        window.location.href = 'index.html';
    });
}

// Start app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function loadDashboard() {
    try {
        const res = await api.get('/api/user/profile');
        if (res.data.success) {
            const user = res.data.data.user;
            document.getElementById('userName').innerText = `Welcome, ${user.fullName}`;
            document.getElementById('accountStatus').innerText = `Status: ${user.accountSection}`;
            document.getElementById('expirationDate').innerText = user.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : 'N/A';
            
            const area = document.getElementById('credentialsArea');
            if (user.accountSection === 'PAID') {
                area.innerHTML = `
                    <div class="space-y-1"><label class="text-[10px] text-slate-500 uppercase">Username</label><div class="p-3 bg-white/5 rounded-lg font-mono text-sm border border-white/5">${user.pppoe_username}</div></div>
                    <div class="space-y-1"><label class="text-[10px] text-slate-500 uppercase">Password</label><div class="p-3 bg-white/5 rounded-lg font-mono text-sm border border-white/5">${user.pppoe_password}</div></div>
                `;
            } else {
                area.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500 italic">No credentials. Upgrade to PAID.</div>';
            }
        }
    } catch (err) { console.error("Dashboard Load Error:", err); }
}

async function loadPackages() {
    const list = document.getElementById('packageList');
    if (!list) return;
    try {
        const res = await api.get('/api/subscription/packages');
        const packagesData = res.data.data;
        const packagesArray = Array.isArray(packagesData) ? packagesData : Object.values(packagesData);
        
        list.innerHTML = packagesArray.map(pkg => `
            <div class="glass p-8 flex flex-col border-2 ${pkg.recommended ? 'border-sky-500' : 'border-transparent'}">
                <div class="text-sky-400 font-bold mb-2">${pkg.name}</div>
                <div class="text-4xl font-bold mb-6">৳${pkg.price}</div>
                <div class="text-sm text-slate-400 mb-8">${pkg.speed} Unlimited</div>
                <button onclick="initiatePayment('${pkg.name}')" class="btn-primary w-full mt-auto">Select Plan</button>
            </div>
        `).join('');
    } catch (err) { console.error("Package Load Error:", err); }
}

// User Actions: Restart Account & Change Password
async function handleRestartAccount() {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will reset your subscription and credentials!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, restart!'
    });

    if (result.isConfirmed) {
        try {
            const res = await api.post('/api/user/restart');
            if (res.data.success) {
                Swal.fire('Restarted!', res.data.message, 'success').then(() => location.reload());
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to restart account', 'error');
        }
    }
}

async function handleChangePassword() {
    const { value: formValues } = await Swal.fire({
        title: 'Change Password',
        html:
            '<input id="old-pass" type="password" class="swal2-input" placeholder="Current Password">' +
            '<input id="new-pass" type="password" class="swal2-input" placeholder="New Password">' +
            '<input id="confirm-pass" type="password" class="swal2-input" placeholder="Confirm New Password">',
        focusConfirm: false,
        preConfirm: () => {
            return [
                document.getElementById('old-pass').value,
                document.getElementById('new-pass').value,
                document.getElementById('confirm-pass').value
            ]
        }
    });

    if (formValues) {
        try {
            const [oldPassword, newPassword, confirmPassword] = formValues;
            const res = await api.post('/api/user/change-password', { oldPassword, newPassword, confirmPassword });
            if (res.data.success) {
                Swal.fire('Success', 'Password updated!', 'success');
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
        }
    }
}

let activeTranId = null;
async function initiatePayment(packageType) {
    try {
        Swal.fire({ title: 'Requesting...', didOpen: () => Swal.showLoading() });
        const res = await api.post('/api/payment/cck-te', { packageType, method: 'BKASH' });
        activeTranId = res.data.data.tranId;
        document.getElementById('merchantNumber').innerText = res.data.data.paymentNumber;
        document.getElementById('refId').innerText = res.data.data.tranId;
        Swal.close();
        document.getElementById('paymentModal').classList.remove('hidden');
        lucide.createIcons();
    } catch (err) { Swal.fire('Error', 'Payment failed', 'error'); }
}

function closeModal() { document.getElementById('paymentModal').classList.add('hidden'); }

document.getElementById('verifyBtn')?.addEventListener('click', async () => {
    const trxId = document.getElementById('trxId').value;
    if (!trxId) return Swal.fire('Warning', 'Enter TrxID', 'warning');
    try {
        Swal.fire({ title: 'Verifying...', didOpen: () => Swal.showLoading() });
        const res = await api.post('/api/payment/verify', { tranId: activeTranId, trxId, method: 'BKASH' });
        if (res.data.success) {
            Swal.fire('Success', res.data.message, 'success').then(() => window.location.href = 'dashboard.html');
        }
    } catch (err) { Swal.fire('Error', err.response?.data?.message || 'Failed', 'error'); }
});
