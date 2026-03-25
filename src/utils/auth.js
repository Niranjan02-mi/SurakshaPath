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
export function signUp({ name, email, password, role, badgeId, department }) {
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        return { success: false, error: 'Email already registered' };
    }
    const user = {
        id: `SP-${Date.now().toString(36).toUpperCase()}`,
        name,
        email,
        password, // In production, this would be hashed
        role,
        badgeId: badgeId || null,
        department: department || null,
        createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    setAuth(user);
    return { success: true, user };
}

// Sign in
export function signIn({ email, password }) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return { success: false, error: 'Invalid email or password' };
    }
    setAuth(user);
    return { success: true, user };
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
