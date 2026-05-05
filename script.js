const BASE_URL = 'https://api-three-tawny-22.vercel.app';

// Helper: Save/Get Auth Token
const setToken = (token) => {
    localStorage.setItem('nexus_token', token);
    console.log("Token saved to localStorage");
};
const getToken = () => localStorage.getItem('nexus_token');
const removeToken = () => localStorage.removeItem('nexus_token');

// Axios Instance
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor to add token
api.interceptors.request.use(config => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            console.warn("401 Unauthorized detected");
            // Only redirect if NOT on login/register pages
            const path = window.location.pathname;
            if (!path.includes('index.html') && !path.includes('register.html') && !path.endsWith('/nexus-wifi-system/') && !path.endsWith('/')) {
                removeToken();
                window.location.href = 'index.html';
            }
        }
        return Promise.reject(error);
    }
);

// --- Auth Guard ---
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

// --- Page Specific Logic ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    const path = window.location.pathname;

    // Login
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
                
                if (res.data.success && res.data.token) {
                    setToken(res.data.token);
                    Swal.fire({
                        icon: 'success',
                        title: 'Login Success',
                        timer: 1000,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'dashboard.html';
                    });
                } else {
                    throw new Error("Token missing from response");
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = original;
                Swal.fire('Error', err.response?.data?.message || 'Login failed', 'error');
            }
        });
    }

    // Register
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
                
                const data = {
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    email: document.getElementById('email').value,
                    mobile: document.getElementById('mobile').value,
                    password: pass,
                    confirmPassword: confirm
                };

                const res = await api.post('/api/auth/register', data);
                if (res.data.success) {
                    Swal.fire('Success', 'Account created!', 'success').then(() => {
                        window.location.href = 'index.html';
                    });
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = original;
                Swal.fire('Error', err.response?.data?.message || 'Registration failed', 'error');
            }
        });
    }

    if (path.includes('dashboard.html')) loadDashboard();
    if (path.includes('subscription.html')) loadPackages();

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        removeToken();
        window.location.href = 'index.html';
    });
});

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
    } catch (err) {
        console.error("Dashboard Load Error:", err);
    }
}

async function loadPackages() {
    const list = document.getElementById('packageList');
    if (!list) return;
    try {
        const res = await api.get('/api/subscription/packages');
        list.innerHTML = res.data.data.map(pkg => `
            <div class="glass p-8 flex flex-col border-2 ${pkg.recommended ? 'border-sky-500' : 'border-transparent'}">
                <div class="text-sky-400 font-bold mb-2">${pkg.name}</div>
                <div class="text-4xl font-bold mb-6">৳${pkg.price}</div>
                <div class="text-sm text-slate-400 mb-8">${pkg.speed} Unlimited</div>
                <button onclick="initiatePayment('${pkg.name}')" class="btn-primary w-full mt-auto">Select Plan</button>
            </div>
        `).join('');
    } catch (err) { console.error(err); }
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
