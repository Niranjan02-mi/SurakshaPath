import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signIn, ROLES } from '../utils/auth';

const ROLE_CONFIG = {
    [ROLES.TOURIST]: {
        icon: '🧳',
        label: 'TOURIST',
        color: 'var(--kiwi)',
        description: 'EXPLORE INDIA',
        fields: [],
    },
    [ROLES.DEPARTMENT]: {
        icon: '🏛️',
        label: 'TOURISM DEPT',
        color: 'var(--info)', // Crisp Carrot
        description: 'GOVERNMENT',
        fields: ['department'],
    },
    [ROLES.POLICE]: {
        icon: '🛡️',
        label: 'POLICE',
        color: 'var(--warning)', // Sunshine
        description: 'LAW ENFORCEMENT',
        fields: ['badgeId'],
    },
};

const PlaneLoader = () => (
    <div className="plane-loader-container">
        <span className="sparkle s1">✨</span>
        <span className="plane-icon">✈️</span>
        <span className="sparkle s2">✨</span>
    </div>
);

export default function AuthPage() {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [selectedRole, setSelectedRole] = useState(ROLES.TOURIST);
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '', badgeId: '', department: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        await new Promise(r => setTimeout(r, 600));

        if (isSignUp) {
            if (form.password !== form.confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }
            if (form.password.length < 6) {
                setError('Password must be 6+ chars');
                setLoading(false);
                return;
            }
            const result = signUp({ ...form, role: selectedRole });
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
        } else {
            const result = signIn({ email: form.email, password: form.password });
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
            navigateByRole(result.user.role);
            return;
        }

        navigateByRole(selectedRole);
    };

    const navigateByRole = (role) => {
        switch (role) {
            case ROLES.POLICE: navigate('/police'); break;
            case ROLES.DEPARTMENT: navigate('/department'); break;
            default: navigate('/tourist/onboarding');
        }
    };

    const DEMO_ACCOUNTS = {
        [ROLES.TOURIST]: { name: 'Priya Sharma', email: 'demo.tourist@surakshapath.in', password: 'demo1234', role: ROLES.TOURIST },
        [ROLES.DEPARTMENT]: { name: 'Dr. Rajesh Kumar', email: 'demo.dept@surakshapath.in', password: 'demo1234', role: ROLES.DEPARTMENT, department: 'Meghalaya Tourism Board' },
        [ROLES.POLICE]: { name: 'Inspector Vikram Singh', email: 'demo.police@surakshapath.in', password: 'demo1234', role: ROLES.POLICE, badgeId: 'IPS-ML-2026-0042' },
    };

    const demoSignIn = async (role) => {
        setLoading(true);
        setError('');
        await new Promise(r => setTimeout(r, 400));
        let result = signIn({ email: DEMO_ACCOUNTS[role].email, password: DEMO_ACCOUNTS[role].password });
        if (!result.success) result = signUp(DEMO_ACCOUNTS[role]);
        if (!result.success) { setError(result.error); setLoading(false); return; }
        navigateByRole(role);
    };

    const roleConfig = ROLE_CONFIG[selectedRole];

    return (
        <div className="retro-auth-layout">
            {/* Left Poster Side */}
            <div className="retro-poster" style={{ backgroundColor: roleConfig.color }}>
                {/* Decorative Animations */}
                <div className="deco-road">
                    {/* Cars driving right */}
                    <img src="/tourist-car-red.png" className="deco-car" style={{ animationDelay: '0s' }} alt="car" />
                    <img src="/tourist-car-red.png" className="deco-car" style={{ animationDelay: '3.3s' }} alt="car" />
                    <img src="/tourist-car-red.png" className="deco-car" style={{ animationDelay: '6.6s' }} alt="car" />
                </div>

                <div className="poster-content" style={{ position: 'relative', zIndex: 10 }}>
                    <h1 className="text-giant poster-title">SURA<br />KSHA<br />PATH</h1>
                    <div className="poster-meta">
                        <span className="badge" style={{ backgroundColor: 'var(--forest-green)', color: 'var(--cream)', border: 'none' }}>
                            {roleConfig.label} SYSTEM
                        </span>
                        <p>EST. 2026 // DIGITAL INDIA INIT.</p>
                    </div>
                </div>
            </div>

            {/* Right Form Side */}
            <div className="retro-form-panel">
                <div className="form-content-inner">
                    
                    {/* Role Selection Tabs */}
                    <div className="retro-role-selector">
                        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                            <button
                                key={role}
                                type="button"
                                className={`retro-role-btn ${selectedRole === role ? 'active' : ''}`}
                                onClick={() => setSelectedRole(role)}
                                style={{
                                    borderBottomColor: selectedRole === role ? config.color : 'transparent',
                                    color: selectedRole === role ? 'var(--forest-green)' : 'var(--text-muted)'
                                }}
                            >
                                <span className="roll-btn-icon">{config.icon}</span>
                                {config.label}
                            </button>
                        ))}
                    </div>

                    <div className="retro-auth-header">
                        <h2>{isSignUp ? 'REGISTER' : 'AUTHORIZE'}</h2>
                        <button type="button" className="btn-ghost btn-sm" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
                            {isSignUp ? 'SWITCH TO SIGN IN →' : 'CREATE NEW ACCOUNT +'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="retro-form">
                        {isSignUp && (
                            <div className="input-group">
                                <label>Full Name</label>
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={e => update('name', e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label>Identification (Email)</label>
                            <input
                                className="input-field"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={e => update('email', e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Access Code (Password)</label>
                            <input
                                className="input-field"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => update('password', e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {isSignUp && (
                            <div className="input-group">
                                <label>Confirm Access Code</label>
                                <input
                                    className="input-field"
                                    type="password"
                                    placeholder="••••••••"
                                    value={form.confirmPassword}
                                    onChange={e => update('confirmPassword', e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {selectedRole === ROLES.POLICE && (
                            <div className="input-group">
                                <label>Badge / Service ID</label>
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder="e.g. IPS-DL-2025"
                                    value={form.badgeId}
                                    onChange={e => update('badgeId', e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {selectedRole === ROLES.DEPARTMENT && (
                            <div className="input-group">
                                <label>Department Branch</label>
                                <input
                                    className="input-field"
                                    type="text"
                                    placeholder="e.g. Tourism Board"
                                    value={form.department}
                                    onChange={e => update('department', e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <div className="retro-error-block">
                                <strong>ERROR:</strong> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn retro-submit-btn"
                            disabled={loading}
                            style={{ backgroundColor: roleConfig.color, color: 'var(--forest-green)' }}
                        >
                            {loading ? <PlaneLoader /> : (isSignUp ? 'REGISTER ID' : 'INITIALIZE SESSION')}
                        </button>
                    </form>

                    {/* Quick Demo Footer */}
                    <div className="retro-demo-footer">
                        <div className="retro-divider"><span>DEMO BYPASS</span></div>
                        <div className="retro-demo-grid">
                            <button type="button" className="btn-ghost" onClick={() => demoSignIn(ROLES.TOURIST)}>
                                {ROLE_CONFIG[ROLES.TOURIST].icon} DEMO TOURIST
                            </button>
                            <button type="button" className="btn-ghost" onClick={() => demoSignIn(ROLES.DEPARTMENT)}>
                                {ROLE_CONFIG[ROLES.DEPARTMENT].icon} DEMO DEPT
                            </button>
                            <button type="button" className="btn-ghost" onClick={() => demoSignIn(ROLES.POLICE)}>
                                {ROLE_CONFIG[ROLES.POLICE].icon} DEMO POLICE
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
