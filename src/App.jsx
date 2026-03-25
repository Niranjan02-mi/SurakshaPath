import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { hasTourist } from './utils/storage';
import { isAuthenticated, getRole, ROLES } from './utils/auth';
import AuthPage from './pages/AuthPage';
import Onboarding from './pages/Onboarding';
import DigitalID from './pages/DigitalID';
import SafetyMap from './pages/SafetyMap';
import AnomalyAlert from './pages/AnomalyAlert';
import SOSPage from './pages/SOSPage';
import PoliceDashboard from './pages/PoliceDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import TabBar from './components/TabBar';

function ProtectedRoute({ children, allowedRoles }) {
    if (!isAuthenticated()) {
        return <Navigate to="/" />;
    }
    const role = getRole();
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" />;
    }
    return children;
}

function TouristLayout() {
    return (
        <div className="app-container">
            <Routes>
                <Route path="/" element={hasTourist() ? <Navigate to="/tourist/id" /> : <Onboarding />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/id" element={<DigitalID />} />
                <Route path="/map" element={<SafetyMap />} />
                <Route path="/safety" element={<AnomalyAlert />} />
                <Route path="/sos" element={<SOSPage />} />
            </Routes>
            <TabBar />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <SpeedInsights />
            <Routes>
                {/* Auth — the landing page */}
                <Route path="/" element={
                    isAuthenticated()
                        ? <Navigate to={
                            getRole() === ROLES.POLICE ? '/police'
                                : getRole() === ROLES.DEPARTMENT ? '/department'
                                    : '/tourist'
                        } />
                        : <AuthPage />
                } />

                {/* Police Dashboard */}
                <Route path="/police" element={
                    <ProtectedRoute allowedRoles={[ROLES.POLICE]}>
                        <PoliceDashboard />
                    </ProtectedRoute>
                } />

                {/* Department Dashboard */}
                <Route path="/department" element={
                    <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT]}>
                        <DepartmentDashboard />
                    </ProtectedRoute>
                } />

                {/* Tourist app routes */}
                <Route path="/tourist/*" element={
                    <ProtectedRoute allowedRoles={[ROLES.TOURIST]}>
                        <TouristLayout />
                    </ProtectedRoute>
                } />

                {/* Legacy direct links */}
                <Route path="/onboarding" element={<Navigate to="/tourist/onboarding" />} />
                <Route path="/id" element={<Navigate to="/tourist/id" />} />
            </Routes>
        </BrowserRouter>
    );
}
