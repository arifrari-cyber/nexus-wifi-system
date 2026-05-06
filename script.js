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

    // Login Form Step 1
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const original = btn.innerHTML;
            
            try {
                btn.disabled = true;
                btn.innerHTML = 'Checking...';
                const identifier = document.getElementById('identifier').value;
                const password = document.getElementById('password').value;

                const res = await api.post('/api/auth/login', { identifier, password });
                
                if (res.data.success) {
                    document.getElementById('loginSection').classList.add('hidden');
                    document.getElementById('otpSection').classList.remove('hidden');
                    document.getElementById('displayEmail').innerText = res.data.data.email;
                    Swal.fire({ icon: 'info', title: 'Code Sent', text: 'Check your email for the verification code', timer: 2000, showConfirmButton: false });
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = original;
                Swal.fire('Error', err.response?.data?.message || 'Login failed', 'error');
            }
        });
    }

    // Login Form Step 2 (Verify OTP)
    const verifyOtpForm = document.getElementById('verifyOtpForm');
    if (verifyOtpForm) {
        verifyOtpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('displayEmail').innerText;
            const otp = document.getElementById('loginOtp').value;

            try {
                Swal.fire({ title: 'Verifying...', didOpen: () => Swal.showLoading() });
                const res = await api.post('/api/auth/verify-login', { email, otp });
                
                if (res.data.success) {
                    const token = res.data.data.token;
                    setToken(token);
                    Swal.fire({ icon: 'success', title: 'Welcome!', timer: 1000, showConfirmButton: false })
                        .then(() => window.location.href = 'dashboard.html');
                }
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Verification failed', 'error');
            }
        });
    }

    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            const original = btn.innerHTML;
            try {
                const pass = document.getElementById('regPassword').value;
                const confirm = document.getElementById('confirmPassword').value;
                if (pass !== confirm) return Swal.fire('Error', 'Passwords do not match', 'error');

                btn.disabled = true;
                btn.innerHTML = 'Registering...';
                
                const data = {\n                    firstName: document.getElementById('firstName').value,\n                    lastName: document.getElementById('lastName').value,\n                    email: document.getElementById('email').value,\n                    mobile: document.getElementById('mobile').value,\n                    password: pass,\n                    confirmPassword: confirm\n                };

                const res = await api.post('/api/auth/register', data);
                if (res.data.success) {
                    Swal.fire('Success', 'Account created! Please login.', 'success').then(() => window.location.href = 'index.html');
                }
            } catch (err) {\n                btn.disabled = false;\n                btn.innerHTML = original;\n                Swal.fire('Error', err.response?.data?.message || 'Registration failed', 'error');\n            }\n        });\n    }\n\n    if (path.includes('dashboard.html')) loadDashboard();\n    if (path.includes('subscription.html')) loadPackages();\n\n    document.getElementById('logoutBtn')?.addEventListener('click', () => {\n        removeToken();\n        window.location.href = 'index.html';\n    });\n}\n\n// Start app\nif (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', init);\n} else {\n    init();\n}\n\nasync function loadDashboard() {\n    try {\n        const res = await api.get('/api/user/profile');\n        if (res.data.success) {\n            const user = res.data.data.user;\n            document.getElementById('userName').innerText = `Welcome, ${user.fullName}`;\n            document.getElementById('accountStatus').innerText = `Status: ${user.accountSection}`;\n            document.getElementById('expirationDate').innerText = user.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : 'N/A';\n            \n            const area = document.getElementById('credentialsArea');\n            if (user.accountSection === 'PAID') {\n                area.innerHTML = `\n                    <div class=\"space-y-1\"><label class=\"text-[10px] text-slate-500 uppercase\">Username</label><div class=\"p-3 bg-white/5 rounded-lg font-mono text-sm border border-white/5\">${user.pppoe_username}</div></div>\n                    <div class=\"space-y-1\"><label class=\"text-[10px] text-slate-500 uppercase\">Password</label><div class=\"p-3 bg-white/5 rounded-lg font-mono text-sm border border-white/5\">${user.pppoe_password}</div></div>\n                `;\n            } else {\n                area.innerHTML = '<div class=\"col-span-full text-center py-10 text-slate-500 italic\">No credentials. Upgrade to PAID.</div>';\n            }\n        }\n    } catch (err) { console.error(\"Dashboard Load Error:\", err); }\n}\n\nasync function loadPackages() {\n    const list = document.getElementById('packageList');\n    if (!list) return;\n    try {\n        const res = await api.get('/api/subscription/packages');\n        const packagesData = res.data.data;\n        const packagesArray = Array.isArray(packagesData) ? packagesData : Object.values(packagesData);\n        \n        list.innerHTML = packagesArray.map(pkg => `\n            <div class=\"glass p-8 flex flex-col border-2 ${pkg.recommended ? 'border-sky-500' : 'border-transparent'}\">\n                <div class=\"text-sky-400 font-bold mb-2\">${pkg.name}</div>\n                <div class=\"text-4xl font-bold mb-6\">৳${pkg.price}</div>\n                <div class=\"text-sm text-slate-400 mb-8\">${pkg.speed} Unlimited</div>\n                <button onclick=\"initiatePayment('${pkg.name}')\" class=\"btn-primary w-full mt-auto\">Select Plan</button>\n            </div>\n        `).join('');\n    } catch (err) { console.error(\"Package Load Error:\", err); }\n}\n\n// Forgot Password Flow\nasync function handleForgotPassword() {\n    const { value: identifier } = await Swal.fire({\n        title: 'Forgot Password',\n        input: 'text',\n        inputLabel: 'Enter Email or Mobile',\n        inputPlaceholder: 'Enter your identifier',\n        showCancelButton: true\n    });\n\n    if (identifier) {\n        try {\n            Swal.fire({ title: 'Sending code...', didOpen: () => Swal.showLoading() });\n            const res = await api.post('/api/auth/forgot-password', { identifier });\n            \n            if (res.data.success) {\n                const { value: formValues } = await Swal.fire({\n                    title: 'Reset Password',\n                    html:\n                        '<input id=\"swal-otp\" class=\"swal2-input\" placeholder=\"Enter OTP\">' +\n                        '<input id=\"swal-pass\" type=\"password\" class=\"swal2-input\" placeholder=\"New Password\">' +\n                        '<input id=\"swal-confirm\" type=\"password\" class=\"swal2-input\" placeholder=\"Confirm Password\">',\n                    focusConfirm: false,\n                    preConfirm: () => {\n                        return [\n                            document.getElementById('swal-otp').value,\n                            document.getElementById('swal-pass').value,\n                            document.getElementById('swal-confirm').value\n                        ]\n                    }\n                });\n\n                if (formValues) {\n                    const [otp, newPassword, confirmPassword] = formValues;\n                    const resetRes = await api.post('/api/auth/reset-password', {\n                        email: res.data.data.email,\n                        otp,\n                        newPassword,\n                        confirmPassword\n                    });\n                    if (resetRes.data.success) {\n                        Swal.fire('Success', 'Password reset successful!', 'success');\n                    }\n                }\n            }\n        } catch (err) {\n            Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');\n        }\n    }\n}\n\n// Restart Account\nasync function handleRestartAccount() {\n    const result = await Swal.fire({\n        title: 'Are you sure?',\n        text: \"This will reset your subscription and credentials!\",\n        icon: 'warning',\n        showCancelButton: true,\n        confirmButtonColor: '#3085d6',\n        cancelButtonColor: '#d33',\n        confirmButtonText: 'Yes, restart!'\n    });\n\n    if (result.isConfirmed) {\n        try {\n            const res = await api.post('/api/user/restart');\n            if (res.data.success) {\n                Swal.fire('Restarted!', res.data.message, 'success').then(() => location.reload());\n            }\n        } catch (err) {\n            Swal.fire('Error', 'Failed to restart account', 'error');\n        }\n    }\n}\n\n// Change Password\nasync function handleChangePassword() {\n    const { value: formValues } = await Swal.fire({\n        title: 'Change Password',\n        html:\n            '<input id=\"old-pass\" type=\"password\" class=\"swal2-input\" placeholder=\"Current Password\">' +\n            '<input id=\"new-pass\" type=\"password\" class=\"swal2-input\" placeholder=\"New Password\">' +\n            '<input id=\"confirm-pass\" type=\"password\" class=\"swal2-input\" placeholder=\"Confirm New Password\">',\n        focusConfirm: false,\n        preConfirm: () => {\n            return [\n                document.getElementById('old-pass').value,\n                document.getElementById('new-pass').value,\n                document.getElementById('confirm-pass').value\n            ]\n        }\n    });\n\n    if (formValues) {\n        try {\n            const [oldPassword, newPassword, confirmPassword] = formValues;\n            const res = await api.post('/api/user/change-password', { oldPassword, newPassword, confirmPassword });\n            if (res.data.success) {\n                Swal.fire('Success', 'Password updated!', 'success');\n            }\n        } catch (err) {\n            Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');\n        }\n    }\n}\n\nlet activeTranId = null;\nasync function initiatePayment(packageType) {\n    try {\n        Swal.fire({ title: 'Requesting...', didOpen: () => Swal.showLoading() });\n        const res = await api.post('/api/payment/cck-te', { packageType, method: 'BKASH' });\n        activeTranId = res.data.data.tranId;\n        document.getElementById('merchantNumber').innerText = res.data.data.paymentNumber;\n        document.getElementById('refId').innerText = res.data.data.tranId;\n        Swal.close();\n        document.getElementById('paymentModal').classList.remove('hidden');\n        lucide.createIcons();\n    } catch (err) { Swal.fire('Error', 'Payment failed', 'error'); }\n}\n\nfunction closeModal() { document.getElementById('paymentModal').classList.add('hidden'); }\n\ndocument.getElementById('verifyBtn')?.addEventListener('click', async () => {\n    const trxId = document.getElementById('trxId').value;\n    if (!trxId) return Swal.fire('Warning', 'Enter TrxID', 'warning');\n    try {\n        Swal.fire({ title: 'Verifying...', didOpen: () => Swal.showLoading() });\n        const res = await api.post('/api/payment/verify', { tranId: activeTranId, trxId, method: 'BKASH' });\n        if (res.data.success) {\n            Swal.fire('Success', res.data.message, 'success').then(() => window.location.href = 'dashboard.html');\n        }\n    } catch (err) { Swal.fire('Error', err.response?.data?.message || 'Failed', 'error'); }\n});\n