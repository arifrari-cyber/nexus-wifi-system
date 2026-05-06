const BASE_URL = 'https://api-three-tawny-22.vercel.app';

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAe0CaNkka-RG-LiR4Krndg8VDCcVJwC9I",
    authDomain: "argon-magnet-467304-n4.firebaseapp.com",
    projectId: "argon-magnet-467304-n4",
    storageBucket: "argon-magnet-467304-n4.firebasestorage.app",
    messagingSenderId: "590674512395",
    appId: "1:590674512395:web:2c6d7b9c201fa53164d50e"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// Helper: Save/Get Auth Token
const setToken = (token) => localStorage.setItem('token', token);
const getToken = () => localStorage.getItem('token');
const removeToken = () => localStorage.removeItem('token');

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

// Global Helpers
const showLoading = () => Swal.fire({ title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
const hideLoading = () => Swal.close();

// Main Initialization
function init() {
    checkAuth();
    
    // Load Dashboard Data if on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboard();
    }

    // Load Subscription Packages if on subscription page or index
    if (document.getElementById('packageList')) {
        loadPackages();
    }

    // Update User Info in UI
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            userNameEl.innerText = user.fullName;
            if (document.getElementById('user-email')) document.getElementById('user-email').innerText = user.email;
            if (document.getElementById('user-mobile')) document.getElementById('user-mobile').innerText = user.mobile;
        }
    }

    // Attach Listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Forgot Password
    const forgotLink = document.getElementById('forgotPasswordLink');
    if (forgotLink) {
        forgotLink.addEventListener('click', handleForgotPassword);
    }

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        removeToken();
        auth.signOut();
        window.location.href = 'index.html';
    });
}

// --- Auth Handlers ---

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.confirmPassword) {
        return Swal.fire('Error', 'Passwords do not match', 'error');
    }

    showLoading();
    try {
        // 1. Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password);
        const user = userCredential.user;

        // 2. Send Custom Verification Email via our Backend
        await api.post('/api/auth/send-verification', { email: data.email });

        // 3. Save additional info in our backend/Firestore
        await api.post('/api/auth/register', {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            mobile: data.mobile,
            uid: user.uid
        });

        hideLoading();
        Swal.fire({
            title: 'Verify Your Email',
            text: 'A verification link has been sent to your email. Please verify and then log in.',
            icon: 'success'
        }).then(() => {
            window.location.href = 'index.html';
        });
    } catch (error) {
        hideLoading();
        Swal.fire('Registration Failed', error.message, 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    showLoading();
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            hideLoading();
            await auth.signOut();
            return Swal.fire({
                title: 'Email Not Verified',
                text: 'Please verify your email before logging in.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Resend Email',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await api.post('/api/auth/send-verification', { email: user.email });
                    Swal.fire('Sent!', 'Verification email resent.', 'success');
                }
            });
        }

        console.log("Firebase Login Successful, getting ID Token...");
        const idToken = await user.getIdToken(true); // Force refresh token
        console.log("ID Token received, sending to backend...");
        
        const response = await api.post('/api/auth/login', { idToken });

        if (response.data.success) {
            setToken(response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
            hideLoading();
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        hideLoading();
        Swal.fire('Login Failed', error.message, 'error');
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const { value: email } = await Swal.fire({
        title: 'Reset Password',
        input: 'email',
        inputLabel: 'Enter your registered email address',
        inputPlaceholder: 'email@example.com',
        showCancelButton: true
    });

    if (email) {
        showLoading();
        try {
            await api.post('/api/auth/forgot-password', { email });
            hideLoading();
            Swal.fire('Success', 'Password reset link sent to your email!', 'success');
        } catch (error) {
            hideLoading();
            Swal.fire('Error', error.message, 'error');
        }
    }
}

// --- Dashboard & Subscription Logic ---

async function loadDashboard() {
    try {
        const res = await api.get('/api/user/profile');
        if (res.data.success) {
            const user = res.data.data.user;
            if (document.getElementById('userName')) document.getElementById('userName').innerText = `Welcome, ${user.fullName}`;
            if (document.getElementById('accountStatus')) document.getElementById('accountStatus').innerText = `Status: ${user.accountSection}`;
            if (document.getElementById('expirationDate')) document.getElementById('expirationDate').innerText = user.expirationDate ? new Date(user.expirationDate).toLocaleDateString() : 'N/A';
            
            const area = document.getElementById('credentialsArea');
            if (area) {
                if (user.accountSection === 'PAID') {
                    area.innerHTML = `
                        <div class="space-y-1"><label class="text-[10px] text-slate-500 uppercase">Username</label><div class="p-3 bg-white/5 rounded-lg font-mono text-sm border border-white/5">${user.pppoe_username}</div></div>
                        <div class="space-y-1"><label class="text-[10px] text-slate-500 uppercase">Password</label><div class="p-3 bg-white/5 rounded-lg font-mono text-sm border border-white/5">${user.pppoe_password}</div></div>
                    `;
                } else {
                    area.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500 italic">No credentials. Upgrade to PAID.</div>';
                }
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

let activeTranId = null;
async function initiatePayment(packageType) {
    try {
        Swal.fire({ title: 'Requesting...', didOpen: () => Swal.showLoading() });
        const res = await api.post('/api/payment/cck-te', { packageType, method: 'BKASH' });
        activeTranId = res.data.data.tranId;
        const modal = document.getElementById('paymentModal');
        if (modal) {
            document.getElementById('merchantNumber').innerText = res.data.data.paymentNumber;
            document.getElementById('refId').innerText = res.data.data.tranId;
            Swal.close();
            modal.classList.remove('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } catch (err) { Swal.fire('Error', 'Payment failed', 'error'); }
}

function closeModal() { document.getElementById('paymentModal')?.classList.add('hidden'); }

document.getElementById('verifyBtn')?.addEventListener('click', async () => {
    const trxId = document.getElementById('trxId').value;
    if (!trxId) return Swal.fire('Warning', 'Enter TrxID', 'warning');
    try {
        showLoading();
        const res = await api.post('/api/payment/verify', { tranId: activeTranId, trxId, method: 'BKASH' });
        if (res.data.success) {
            Swal.fire('Success', res.data.message, 'success').then(() => window.location.href = 'dashboard.html');
        }
    } catch (err) { 
        hideLoading();
        Swal.fire('Error', err.response?.data?.message || 'Verification failed', 'error'); 
    }
});

// App Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
