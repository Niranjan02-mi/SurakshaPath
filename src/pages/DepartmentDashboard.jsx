import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, getAuth } from '../utils/auth';

const MOCK_STATS = {
    totalTourists: 12458,
    activeTourists: 3241,
    alertsToday: 7,
    safetyScore: 94,
};

const MOCK_ZONES = [
    { name: 'Taj Mahal', tourists: 3842, incidents: 0, status: 'safe' },
    { name: 'Goa Beaches', tourists: 2523, incidents: 1, status: 'alert' },
    { name: 'Kaziranga', tourists: 1120, incidents: 2, status: 'alert' },
    { name: 'Ladakh', tourists: 812, incidents: 0, status: 'safe' },
    { name: 'Kerala Backwaters', tourists: 1189, incidents: 0, status: 'safe' },
    { name: 'Varanasi', tourists: 2255, incidents: 0, status: 'safe' },
];

export default function DepartmentDashboard() {
    const navigate = useNavigate();
    const auth = getAuth();
    const [activeTab, setActiveTab] = useState('overview');

    const handleSignOut = () => {
        signOut();
        navigate('/');
    };

    return (
        <div className="page dept-dashboard" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
                <div>
                    <h1>🏛️ SurakshaPath</h1>
                    <span className="header-badge" style={{ display: 'inline-block', marginTop: 'var(--space-xs)' }}>
                        TOURISM DEPARTMENT
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <span className="header-badge" style={{ fontSize: '0.8125rem' }}>
                        Welcome, {auth?.name || 'Dr. Rajesh Kumar'}
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={handleSignOut} style={{ borderRadius: 0 }}>
                        🚪 Sign Out
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="dept-stats-grid">
                <div className="retro-card dept-stat-card">
                    <span className="dept-stat-icon" style={{ background: 'var(--sunshine)', color: 'var(--forest-green)' }}>🧳</span>
                    <div className="dept-stat-info">
                        <span className="dept-stat-value">{MOCK_STATS.totalTourists.toLocaleString()}</span>
                        <span className="dept-stat-label">Total Registered</span>
                    </div>
                </div>
                <div className="retro-card dept-stat-card">
                    <span className="dept-stat-icon" style={{ background: 'var(--kiwi)', color: 'var(--forest-green)' }}>📍</span>
                    <div className="dept-stat-info">
                        <span className="dept-stat-value">{MOCK_STATS.activeTourists.toLocaleString()}</span>
                        <span className="dept-stat-label">Active Now</span>
                    </div>
                </div>
                <div className="retro-card dept-stat-card">
                    <span className="dept-stat-icon" style={{ background: 'var(--danger)', color: 'var(--cream)' }}>⚠️</span>
                    <div className="dept-stat-info">
                        <span className="dept-stat-value">{MOCK_STATS.alertsToday}</span>
                        <span className="dept-stat-label">Alerts Today</span>
                    </div>
                </div>
                <div className="retro-card dept-stat-card">
                    <span className="dept-stat-icon" style={{ background: 'var(--crisp-carrot)', color: 'var(--forest-green)' }}>🛡️</span>
                    <div className="dept-stat-info">
                        <span className="dept-stat-value">{MOCK_STATS.safetyScore}%</span>
                        <span className="dept-stat-label">Safety Score</span>
                    </div>
                </div>
            </div>

            {/* Zone Table */}
            <div style={{ marginTop: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    <span style={{ fontSize: '1.5rem' }}>🗺️</span>
                    <h2 style={{ fontFamily: 'var(--font-main)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--forest-green)' }}>Tourism Zones Overview</h2>
                </div>
                <table className="tourist-table">
                    <thead>
                        <tr>
                            <th>Zone</th>
                            <th>Active Tourists</th>
                            <th>Incidents</th>
                            <th style={{ width: '120px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_ZONES.map(z => (
                            <tr key={z.name}>
                                <td>{z.name}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{z.tourists.toLocaleString()}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{z.incidents}</td>
                                <td>
                                    <div className={`badge ${z.status === 'safe' ? 'badge-success' : 'badge-danger'}`} style={{ width: '100%', textAlign: 'center', padding: '6px' }}>
                                        {z.status === 'safe' ? 'SAFE' : 'ALERT'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
