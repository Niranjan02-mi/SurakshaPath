import React from 'react';
import { NavLink } from 'react-router-dom';

export default function TabBar() {
    return (
        <nav className="tab-bar">
            <NavLink to="/tourist/id" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
                <span className="tab-icon">🪪</span>
                <span>ID</span>
            </NavLink>
            <NavLink to="/tourist/map" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
                <span className="tab-icon">🗺️</span>
                <span>Map</span>
            </NavLink>
            <NavLink to="/tourist/safety" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
                <span className="tab-icon">🛡️</span>
                <span>Safety</span>
            </NavLink>
            <NavLink to="/tourist/sos" className={({ isActive }) => `tab-item sos-tab ${isActive ? 'active' : ''}`}>
                <span className="tab-icon">🆘</span>
                <span>SOS</span>
            </NavLink>
        </nav>
    );
}
