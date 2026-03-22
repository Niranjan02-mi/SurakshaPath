import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ZONES, DEFAULT_CENTER, DEFAULT_ZOOM, NEARBY_ALERTS } from '../data/zones';
import { computeSafetyScore } from '../utils/anomalyEngine';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function SafetyScoreRing({ score }) {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = score >= 70 ? '#2dd48c' : score >= 40 ? '#ffa502' : '#ff4757';

    return (
        <div className="safety-ring">
            <svg width="80" height="80">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle
                    cx="40" cy="40" r={radius} fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                />
            </svg>
            <span className="score-value" style={{ color }}>{score}</span>
        </div>
    );
}

function ZoneOverlays() {
    return (
        <>
            {ZONES.map(zone => (
                <Circle
                    key={zone.id}
                    center={zone.center}
                    radius={zone.riskScore * 15000}
                    pathOptions={{
                        color: zone.color,
                        fillColor: zone.color,
                        fillOpacity: 0.15,
                        weight: 2,
                        dashArray: zone.type === 'restricted' ? '8, 4' : undefined
                    }}
                >
                    <Popup>
                        <div style={{ color: '#333', fontFamily: 'Inter, sans-serif' }}>
                            <strong>{zone.name}</strong><br />
                            <span style={{ fontSize: '0.8rem' }}>{zone.description}</span><br />
                            <span style={{ fontSize: '0.75rem', color: zone.color }}>
                                Risk: {(zone.riskScore * 100).toFixed(0)}% · {zone.type}
                            </span>
                        </div>
                    </Popup>
                </Circle>
            ))}
        </>
    );
}

export default function SafetyMap() {
    const [userPos, setUserPos] = useState(DEFAULT_CENTER);
    const [safetyScore, setSafetyScore] = useState(67);

    useEffect(() => {
        // Try to get real location, fallback to demo
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    const newPos = [pos.coords.latitude, pos.coords.longitude];
                    setUserPos(newPos);
                    setSafetyScore(computeSafetyScore(newPos[0], newPos[1], 0));
                },
                () => {
                    // Use Shillong as demo location
                    setSafetyScore(computeSafetyScore(DEFAULT_CENTER[0], DEFAULT_CENTER[1], 0));
                }
            );
        }
    }, []);

    const severityBadge = (sev) => {
        const cls = sev === 'restricted' ? 'badge-danger' : sev === 'moderate' ? 'badge-warning' : 'badge-info';
        return <span className={`badge ${cls}`}>{sev}</span>;
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Live Safety Map</h1>
                <span className="header-badge">Live</span>
            </div>

            {/* Map */}
            <div className="map-container" style={{ marginBottom: 'var(--space-lg)' }}>
                <MapContainer center={userPos} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ZoneOverlays />
                    <Marker position={userPos}>
                        <Popup>
                            <span style={{ color: '#333' }}>📍 You are here</span>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>

            {/* Safety Score */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                    <SafetyScoreRing score={safetyScore} />
                    <div>
                        <h3>Safety Score</h3>
                        <p className="text-secondary mt-sm" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>
                            Based on your location, zone risk level, and time of day
                        </p>
                    </div>
                </div>
            </div>

            {/* Nearby Alerts */}
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Nearby Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {NEARBY_ALERTS.map(alert => (
                    <div key={alert.id} className="glass-card" style={{ padding: 'var(--space-md)' }}>
                        <div className="flex-between mb-md">
                            <div>
                                <h4>{alert.title}</h4>
                                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>{alert.distance}</span>
                            </div>
                            {severityBadge(alert.severity)}
                        </div>
                        <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>{alert.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
