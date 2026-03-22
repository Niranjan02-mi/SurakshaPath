import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { hasTourist } from './utils/storage';
import Onboarding from './pages/Onboarding';
import DigitalID from './pages/DigitalID';
import SafetyMap from './pages/SafetyMap';
import AnomalyAlert from './pages/AnomalyAlert';
import SOSPage from './pages/SOSPage';
import PoliceDashboard from './pages/PoliceDashboard';
import TabBar from './components/TabBar';

function TouristLayout() {
    return (
        <div className="app-container">
            <Routes>
                <Route path="/" element={hasTourist() ? <Navigate to="/id" /> : <Onboarding />} />
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
            <Routes>
                <Route path="/police" element={<PoliceDashboard />} />
                <Route path="/*" element={<TouristLayout />} />
            </Routes>
        </BrowserRouter>
    );
}
