// Auth utility — localStorage-based auth for Tourist, Tourist Department, Police
const AUTH_KEY = 'surakshapath_auth';
const USERS_KEY = 'surakshapath_users';

const ROLES = {
    TOURIST: 'tourist',
    DEPARTMENT: 'department',
    POLICE: 'police',
};

// Get all registered users
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Sign up a new user
export async function signUp({ name, email, password, role, badgeId, department }) {
    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, role }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.message || 'Registration failed' };
        }

        // If backend auto-verifies (e.g., Demo accounts), it will return a token directly.
        if (data.token && data.user) {
            const user = { ...data.user, role, badgeId: badgeId || null, department: department || null };
            setAuth(user);
            localStorage.setItem('surakshapath_token', data.token);
            return { success: true, user, autoVerified: true };
        }

        // Standard user flow: NOT verified yet!
        return { success: true, email };
    } catch (error) {
        return { success: false, error: 'Cannot connect to server.' };
    }
}

// Verify OTP
export async function verifyOTP(email, otp) {
    try {
        const response = await fetch('http://localhost:5000/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.message || 'Verification failed' };
        }

        const user = { ...data.user, badgeId: null, department: null }; 
        setAuth(user);
        localStorage.setItem('surakshapath_token', data.token);

        return { success: true, user };
    } catch (error) {
        return { success: false, error: 'Cannot connect to server.' };
    }
}

// Resend OTP
export async function resendOTP(email) {
    try {
        const response = await fetch('http://localhost:5000/api/resend-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.message || 'Failed to resend code.' };
        }

        return { success: true, message: data.message };
    } catch (error) {
        return { success: false, error: 'Cannot connect to server.' };
    }
}

// Sign in
export async function signIn({ email, password }) {
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.message || 'Login failed' };
        }

        const user = { ...data.user, badgeId: null, department: null }; 
        setAuth(user);
        localStorage.setItem('surakshapath_token', data.token);

        return { success: true, user };
    } catch (error) {
        return { success: false, error: 'Cannot connect to server. Is Docker running?' };
    }
}

// Auth session helpers
function setAuth(user) {
    const { password, ...safeUser } = user;
    localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));
}

export function getAuth() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY));
    } catch {
        return null;
    }
}

export function isAuthenticated() {
    return !!getAuth();
}

export function getRole() {
    const auth = getAuth();
    return auth?.role || null;
}

export function signOut() {
    localStorage.removeItem(AUTH_KEY);
}

export { ROLES };
