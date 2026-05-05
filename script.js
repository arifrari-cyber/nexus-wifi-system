const BASE_URL = 'https://api-three-tawny-22.vercel.app';

// Helper: Save/Get Auth Token
const setToken = (token) => localStorage.setItem('nexus_token', token);
const getToken = () => localStorage.getItem('nexus_token');
const removeToken = () => localStorage.removeItem('nexus_token');

// Axios Instance
const api = axios.create({
    baseURL: BASE_URL,
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

// Response interceptor to handle unauthorized access
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            removeToken();
            if (!window.location.pathname.includes('index.html')) {
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
    const isLoginPage = path.includes('index.html') || path.endsWith('system/') || path.endsWith('system');
    const isRegisterPage = path.includes('register.html');

    if (!token && !isLoginPage && !isRegisterPage) {
        window.location.href = 'index.html';
    } else if (token && (isLoginPage || isRegisterPage)) {
        window.location.href = 'dashboard.html';
    }
};

checkAuth();

// --- Page Specific Logic ---

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('identifier').value;
            const password = document.getElementById('password').value;

            try {
                const res = await api.post('/api/auth/login', { identifier, password });
                if (res.data.success) {
                    setToken(res.data.token);
                    Swal.fire({
                        icon: 'success',
                        title: 'Login Successful',
                        text: 'Welcome to Nexus WiFi!',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'dashboard.html';
                    });
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: err.response?.data?.message || 'Invalid email/mobile or password'
                });
            }
        });
    }

    // Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                mobile: document.getElementById('mobile').value,
                password: document.getElementById('regPassword').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };

            if (data.password !== data.confirmPassword) {
                return Swal.fire('Error', 'Passwords do not match', 'error');
            }

            try {
                const res = await api.post('/api/auth/register', data);
                if (res.data.success) {
                    Swal.fire('Success', 'Registration successful! Please login.', 'success').then(() => {
                        window.location.href = 'index.html';
                    });
                }
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Registration failed', 'error');
            }
        });
    }

    // Dashboard
    if (path.includes('dashboard.html')) {
        loadDashboard();
    }

    // Subscription
    if (path.includes('subscription.html')) {
        loadPackages();
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            removeToken();
            window.location.href = 'index.html';
        });
    }
});

async function loadDashboard() {
    try {
        const res = await api.get('/api/user/profile');
        if (res.data.success) {
            const user = res.data.data.user;
            document.getElementById('userName').innerText = `Welcome, ${user.fullName}`;
            
            const statusEl = document.getElementById('accountStatus');
            statusEl.innerText = `Status: ${user.accountSection}`;
            if (user.accountSection === 'PAID') {
                statusEl.className = 'px-4 py-2 rounded-full text-sm font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
            }

            document.getElementById('expirationDate').innerText = user.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : 'N/A';

            const credsArea = document.getElementById('credentialsArea');
            if (user.accountSection === 'FREE') {
                credsArea.innerHTML = `
                    <div class="col-span-full py-10 text-center space-y-4">
                        <div class="text-slate-500 italic">No credentials yet. Upgrade to PAID to get access.</div>
                        <a href="subscription.html" class="text-sky-400 font-bold hover:underline">View Plans &rarr;</a>
                    </div>
                `;
            } else {
                credsArea.innerHTML = `
                    <div class="space-y-2">
                        <label class="text-xs text-slate-500 uppercase">Username</label>
                        <div class="p-4 bg-white/5 rounded-xl font-mono">${user.pppoe_username}</div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs text-slate-500 uppercase">Password</label>
                        <div class="p-4 bg-white/5 rounded-xl font-mono">${user.pppoe_password}</div>
                    </div>
                `;
            }
        }
    } catch (err) {
        console.error('Dashboard Error:', err);
    }
}

async function loadPackages() {
    const list = document.getElementById('packageList');
    list.innerHTML = '<div class="col-span-full text-center py-20 text-slate-400">Loading packages...</div>';
    
    try {
        const res = await api.get('/api/subscription/packages');
        const packages = res.data.data;
        
        list.innerHTML = packages.map(pkg => `
            <div class="glass p-8 flex flex-col premium-shadow border-2 ${pkg.recommended ? 'border-sky-500 scale-105' : 'border-transparent'}">
                <div class="flex justify-between items-start mb-6">
                    <div class="text-sky-400 font-bold text-lg">${pkg.name}</div>
                    <div class="text-slate-400 text-sm">${pkg.speed}</div>
                </div>
                <div class="flex items-baseline gap-1 mb-8">
                    <span class="text-4xl font-bold">৳${pkg.price}</span>
                    <span class="text-slate-500 text-sm">/month</span>
                </div>
                <button onclick="initiatePayment('${pkg.name}')" class="mt-auto w-full py-3 btn-primary ${pkg.recommended ? '' : 'opacity-80 hover:opacity-100'}">
                    Select Plan
                </button>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<div class="col-span-full text-center py-20 text-red-400">Failed to load packages. Please refresh.</div>';
    }
}

let activeTranId = null;

async function initiatePayment(packageType) {
    Swal.fire({
        title: 'Processing...',
        text: 'Generating payment details',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const res = await api.post('/api/payment/cck-te', { packageType, method: 'BKASH' });
        const data = res.data.data;
        activeTranId = data.tranId;
        
        document.getElementById('merchantNumber').innerText = data.paymentNumber;
        document.getElementById('refId').innerText = data.tranId;
        
        Swal.close();
        document.getElementById('paymentModal').classList.remove('hidden');
        lucide.createIcons();
    } catch (err) {
        Swal.fire('Error', 'Failed to initiate payment', 'error');
    }
}

function closeModal() {
    document.getElementById('paymentModal').classList.add('hidden');
}

document.getElementById('verifyBtn')?.addEventListener('click', async () => {
    const trxId = document.getElementById('trxId').value;
    if (!trxId) return Swal.fire('Warning', 'Please enter TrxID', 'warning');

    Swal.fire({
        title: 'Verifying...',
        text: 'Please wait while we confirm your payment',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const res = await api.post('/api/payment/verify', {
            tranId: activeTranId,
            trxId: trxId,
            method: 'BKASH'
        });
        if (res.data.success) {
            Swal.fire('Success', res.data.message, 'success').then(() => {
                window.location.href = 'dashboard.html';
            });
        }
    } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Verification failed', 'error');
    }
});
