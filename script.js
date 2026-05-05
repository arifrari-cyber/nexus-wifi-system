const BASE_URL = 'https://api-three-tawny-22.vercel.app';

// Helper: Save/Get Auth Token
const setToken = (token) => {
    console.log("Saving token:", token);
    localStorage.setItem('nexus_token', token);
};
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
        console.error("API Error:", error.response);
        if (error.response && error.response.status === 401) {
            console.warn("Unauthorized! Redirecting to login...");
            removeToken();
            if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
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
    
    // Check if current page is Login or Register
    const isAuthPage = path.includes('index.html') || path.includes('register.html') || path.endsWith('/') || path.endsWith('/nexus-wifi-system/');

    if (!token && !isAuthPage) {
        console.log("No token found. Redirecting to login...");
        window.location.href = 'index.html';
    } else if (token && isAuthPage) {
        console.log("User is already logged in. Redirecting to dashboard...");
        window.location.href = 'dashboard.html';
    }
};

// --- Page Specific Logic ---

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    const path = window.location.pathname;

    // Login Form Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('identifier').value;
            const password = document.getElementById('password').value;

            try {
                Swal.fire({ title: 'Signing in...', didOpen: () => Swal.showLoading() });
                const res = await api.post('/api/auth/login', { identifier, password });
                
                if (res.data.success) {
                    setToken(res.data.token);
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Welcome back.',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = 'dashboard.html';
                    });
                }
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Invalid credentials', 'error');
            }
        });
    }

    // Register Form Logic
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

            if (data.password !== data.confirmPassword) return Swal.fire('Error', 'Passwords do not match', 'error');

            try {
                Swal.fire({ title: 'Creating account...', didOpen: () => Swal.showLoading() });
                const res = await api.post('/api/auth/register', data);
                if (res.data.success) {
                    Swal.fire('Success', 'Account created! Please login.', 'success').then(() => {
                        window.location.href = 'index.html';
                    });
                }
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Registration failed', 'error');
            }
        });
    }

    // Dashboard Data Logic
    if (path.includes('dashboard.html')) {
        loadDashboard();
    }

    // Subscription Logic
    if (path.includes('subscription.html')) {
        loadPackages();
    }

    // Logout
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
            
            const statusEl = document.getElementById('accountStatus');
            statusEl.innerText = `Status: ${user.accountSection}`;
            if (user.accountSection === 'PAID') {
                statusEl.className = 'px-4 py-2 rounded-full text-sm font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
            }

            document.getElementById('expirationDate').innerText = user.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : 'N/A';

            const credsArea = document.getElementById('credentialsArea');
            if (user.accountSection === 'FREE') {
                credsArea.innerHTML = `<div class="col-span-full py-10 text-center italic text-slate-500">No active credentials. Please upgrade your plan.</div>`;
            } else {
                credsArea.innerHTML = `
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase text-slate-500">PPPoE Username</label>
                        <div class="p-3 bg-white/5 rounded-lg font-mono text-sm border border-white/5">${user.pppoe_username}</div>
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] uppercase text-slate-500">PPPoE Password</label>
                        <div class="p-3 bg-white/5 rounded-lg font-mono text-sm border border-white/5">${user.pppoe_password}</div>
                    </div>
                `;
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
        const packages = res.data.data;
        list.innerHTML = packages.map(pkg => `
            <div class="glass p-8 flex flex-col border-2 ${pkg.recommended ? 'border-sky-500' : 'border-transparent'}">
                <div class="text-sky-400 font-bold mb-2">${pkg.name}</div>
                <div class="text-4xl font-bold mb-6">৳${pkg.price}<span class="text-xs text-slate-500 font-normal">/mo</span></div>
                <div class="text-sm text-slate-400 mb-8">${pkg.speed} Unlimited Data</div>
                <button onclick="initiatePayment('${pkg.name}')" class="btn-primary w-full mt-auto">Choose Plan</button>
            </div>
        `).join('');
    } catch (err) {
        console.error("Package Load Error:", err);
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
    } catch (err) {
        Swal.fire('Error', 'Payment initiation failed', 'error');
    }
}

function closeModal() {
    document.getElementById('paymentModal').classList.add('hidden');
}

document.getElementById('verifyBtn')?.addEventListener('click', async () => {
    const trxId = document.getElementById('trxId').value;
    if (!trxId) return Swal.fire('Warning', 'Enter TrxID', 'warning');
    
    try {
        Swal.fire({ title: 'Verifying...', didOpen: () => Swal.showLoading() });
        const res = await api.post('/api/payment/verify', { tranId: activeTranId, trxId, method: 'BKASH' });
        if (res.data.success) {
            Swal.fire('Success', res.data.message, 'success').then(() => window.location.href = 'dashboard.html');
        }
    } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Verification failed', 'error');
    }
});
