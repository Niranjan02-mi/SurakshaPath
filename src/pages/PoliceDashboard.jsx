import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { verifyQRPayload, generateHash, generateMockCID } from '../utils/crypto';
import { getPendingAlerts, getQueuedAlerts, flushQueue } from '../utils/offlineQueue';
import { getTourist } from '../utils/storage';
import { signOut, getAuth } from '../utils/auth';
import jsQR from 'jsqr';

// Fix default marker icons for react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
function createCustomIcon(color, emoji) {
    return L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="
            width:36px;height:36px;border-radius:50%;
            background:${color};border:3px solid white;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;box-shadow:0 2px 12px ${color}88;
        ">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
}

const ICON_ACTIVE = createCustomIcon('#2dd48c', '🧳');
const ICON_ALERT = createCustomIcon('#ffa502', '⚠️');
const ICON_SOS = createCustomIcon('#ff4757', '🚨');
const ICON_POLICE = createCustomIcon('#3498db', '🛡️');

// Mock tourist data with GPS coordinates (Pan-India distribution)
const MOCK_TOURISTS = [
    { id: 'SP-2025-A8F21', name: 'Priya Sharma', status: 'active', zone: 'Taj Mahal', lastSeen: '2 min ago', lat: 27.1751, lng: 78.0421, activity: 'Exploring main mausoleum' },
    { id: 'SP-2025-B3C44', name: 'Rahul Verma', status: 'alert', zone: 'Ladakh', lastSeen: '2h 14m ago', lat: 33.7595, lng: 78.6674, activity: 'Stationary — 2h+ in remote altitude' },
    { id: 'SP-2025-C7D89', name: 'Anita Das', status: 'active', zone: 'Goa Beaches', lastSeen: '15 min ago', lat: 15.5523, lng: 73.7517, activity: 'Water sports' },
    { id: 'SP-2025-D1E56', name: 'Vikram Singh', status: 'active', zone: 'Kerala Backwaters', lastSeen: '45 min ago', lat: 9.4981, lng: 76.3388, activity: 'Houseboat cruise route' },
    { id: 'SP-2025-E9F12', name: 'Meera Nair', status: 'sos', zone: 'Ranthambore', lastSeen: '5 min ago', lat: 26.0173, lng: 76.5026, activity: 'SOS triggered — emergency' },
    { id: 'SP-2025-F2G78', name: 'David Chen', status: 'active', zone: 'Varanasi', lastSeen: '8 min ago', lat: 25.3076, lng: 83.0062, activity: 'Ghat evening aarti' },
    { id: 'SP-2025-G4H90', name: 'Sara Wilson', status: 'active', zone: 'Kaziranga', lastSeen: '22 min ago', lat: 26.6000, lng: 93.4500, activity: 'Safari route 3' },
    { id: 'SP-2025-H5I23', name: 'Arjun Patel', status: 'alert', zone: 'Jaisalmer Desert', lastSeen: '1h 45m ago', lat: 26.8200, lng: 70.5200, activity: 'Off-trail in high-temp zone' },
];

// Police station mock position
const POLICE_STATION = { lat: 28.6139, lng: 77.2090, name: 'National Command Center (Delhi)' };

// Map center (Pan-India overview)
const MAP_CENTER = [22.9, 79.2];
const MAP_ZOOM = 4.5;

// Component to animate map to a tourist
function FlyToMarker({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 12, { duration: 1.5 });
        }
    }, [position, map]);
    return null;
}

// Simulated real-time location updates
function useSimulatedLocations(tourists) {
    const [locations, setLocations] = useState(tourists);
    useEffect(() => {
        const interval = setInterval(() => {
            setLocations(prev => prev.map(t => ({
                ...t,
                lat: t.lat + (Math.random() - 0.5) * 0.002,
                lng: t.lng + (Math.random() - 0.5) * 0.002,
            })));
        }, 3000);
        return () => clearInterval(interval);
    }, []);
    return locations;
}

export default function PoliceDashboard() {
    const navigate = useNavigate();
    const auth = getAuth();
    const [scanMode, setScanMode] = useState('input');
    const [qrInput, setQrInput] = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [alerts, setAlerts] = useState([]);
    const [activePanel, setActivePanel] = useState('map');
    const [focusTourist, setFocusTourist] = useState(null);
    const [mapFilter, setMapFilter] = useState('all');
    const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'detected', 'error'
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scanAnimRef = useRef(null);
    const streamRef = useRef(null);

    const tourists = useSimulatedLocations(MOCK_TOURISTS);

    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        setAlerts(getQueuedAlerts());
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
            stopCamera();
        };
    }, []);

    const filteredTourists = mapFilter === 'all'
        ? tourists
        : tourists.filter(t => t.status === mapFilter);

    const handleVerify = async (payload) => {
        setIsVerifying(true);
        await new Promise(r => setTimeout(r, 800));
        const result = await verifyQRPayload(payload || qrInput);
        setVerifyResult(result);
        setIsVerifying(false);
    };

    // ===== CAMERA QR SCANNING =====
    const startCamera = async () => {
        setScanMode('camera');
        setScanStatus('idle');
        setCameraError('');
        setVerifyResult(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                }
            });
            streamRef.current = stream;

            // Wait for the video element to be in the DOM
            await new Promise(r => setTimeout(r, 100));

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', true);
                await videoRef.current.play();
                setScanStatus('scanning');
                requestAnimationFrame(scanLoop);
            }
        } catch (err) {
            console.error('Camera access failed:', err);
            setCameraError(
                err.name === 'NotAllowedError'
                    ? 'Camera permission denied. Please allow camera access in your browser settings.'
                    : err.name === 'NotFoundError'
                        ? 'No camera found on this device.'
                        : `Camera error: ${err.message}`
            );
            setScanMode('input');
        }
    };

    const stopCamera = () => {
        // Stop animation loop
        if (scanAnimRef.current) {
            cancelAnimationFrame(scanAnimRef.current);
            scanAnimRef.current = null;
        }
        // Stop camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setScanStatus('idle');
    };

    const scanLoop = () => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

        const video = videoRef.current;
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            scanAnimRef.current = requestAnimationFrame(scanLoop);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
            // QR code detected!
            setScanStatus('detected');
            stopCamera();
            setScanMode('input');
            setQrInput(code.data);

            // Play a quick beep sound
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = 880;
                gain.gain.value = 0.3;
                osc.start();
                osc.stop(audioCtx.currentTime + 0.15);
            } catch (e) { /* audio not available */ }

            // Auto-verify the scanned data
            handleVerify(code.data);
            return;
        }

        // Keep scanning
        scanAnimRef.current = requestAnimationFrame(scanLoop);
    };

    const loadDemoQR = async () => {
        // Generate a cryptographically valid demo payload
        const demoRecord = {
            name: 'Priya Sharma',
            aadhaar: 'XXXX XXXX 4892',
            entryPoint: 'DEL Airport',
            validTill: '2027-04-15',
            emergencyContact: '+91 98765 43210',
            language: 'en',
            timestamp: 1711500000000
        };
        const hash = await generateHash(demoRecord);
        const cid = generateMockCID(hash);
        const demoPayload = JSON.stringify({
            id: 'SP-2025-A8F21',
            name: demoRecord.name,
            hash,
            validTill: demoRecord.validTill,
            emergencyContact: demoRecord.emergencyContact,
            entryPoint: demoRecord.entryPoint,
            cid
        });
        setQrInput(demoPayload);
        setVerifyResult(null);
    };

    const loadTouristQR = () => {
        // Load real tourist QR data from localStorage (if a tourist is registered on this device)
        const tourist = getTourist();
        if (tourist && tourist.qrPayload) {
            setQrInput(tourist.qrPayload);
            setVerifyResult(null);
        } else {
            alert('No tourist registered on this device. Please register a tourist first by signing in as Tourist.');
        }
    };

    const statusBadge = (status) => {
        const map = {
            active: { cls: 'badge-success', label: 'Active' },
            alert: { cls: 'badge-warning', label: 'Alert' },
            sos: { cls: 'badge-danger', label: 'SOS' }
        };
        const s = map[status] || map.active;
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
    };

    const getMarkerIcon = (status) => {
        switch (status) {
            case 'sos': return ICON_SOS;
            case 'alert': return ICON_ALERT;
            default: return ICON_ACTIVE;
        }
    };

    const handleSignOut = () => {
        signOut();
        navigate('/');
    };

    const counters = {
        total: tourists.length,
        active: tourists.filter(t => t.status === 'active').length,
        alert: tourists.filter(t => t.status === 'alert').length,
        sos: tourists.filter(t => t.status === 'sos').length,
    };

    return (
        <div className="police-dashboard">
            {/* Sidebar */}
            <aside className="pd-sidebar">
                <div className="pd-sidebar-brand">
                    <span className="pd-brand-icon">🛡️</span>
                    <div>
                        <div className="pd-brand-name">SurakshaPath</div>
                        <div className="pd-brand-sub">Police Command</div>
                    </div>
                </div>

                <nav className="pd-sidebar-nav">
                    <button
                        className={`pd-nav-item ${activePanel === 'map' ? 'active' : ''}`}
                        onClick={() => setActivePanel('map')}
                    >
                        <span>🗺️</span><span>Live Map</span>
                    </button>
                    <button
                        className={`pd-nav-item ${activePanel === 'scanner' ? 'active' : ''}`}
                        onClick={() => setActivePanel('scanner')}
                    >
                        <span>🔍</span><span>QR Scanner</span>
                    </button>
                    <button
                        className={`pd-nav-item ${activePanel === 'tourists' ? 'active' : ''}`}
                        onClick={() => setActivePanel('tourists')}
                    >
                        <span>👥</span><span>Tourists</span>
                        <span className="pd-nav-badge">{counters.total}</span>
                    </button>
                    <button
                        className={`pd-nav-item ${activePanel === 'alerts' ? 'active' : ''}`}
                        onClick={() => setActivePanel('alerts')}
                    >
                        <span>🚨</span><span>Alerts</span>
                        {counters.sos > 0 && <span className="pd-nav-badge sos">{counters.sos}</span>}
                    </button>
                </nav>

                <div className="pd-sidebar-footer">
                    <div className={isOnline ? 'online-banner' : 'offline-banner'}>
                        {isOnline ? '🟢 Online' : '📡 Offline'}
                    </div>
                    <div className="pd-user-info">
                        <span className="pd-avatar">👮</span>
                        <div>
                            <div className="pd-user-name">{auth?.name || 'Officer'}</div>
                            <div className="pd-user-role">{auth?.badgeId || 'Police'}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm btn-block" onClick={handleSignOut}>
                        🚪 Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="pd-main">
                {/* Top Bar */}
                <header className="pd-topbar">
                    <h2 className="pd-topbar-title">
                        {activePanel === 'map' && '🗺️ Live Tourist Tracking'}
                        {activePanel === 'scanner' && '🔍 QR Verification — Works Offline'}
                        {activePanel === 'tourists' && '👥 Registered Tourists'}
                        {activePanel === 'alerts' && '🚨 Alert Feed'}
                    </h2>
                    <div className="pd-topbar-stats">
                        <div className="pd-stat-chip active" onClick={() => { setMapFilter('active'); setActivePanel('map'); }}>
                            <span className="pd-stat-dot" style={{ background: '#2dd48c' }} />
                            <span>{counters.active} Active</span>
                        </div>
                        <div className="pd-stat-chip alert" onClick={() => { setMapFilter('alert'); setActivePanel('map'); }}>
                            <span className="pd-stat-dot" style={{ background: '#ffa502' }} />
                            <span>{counters.alert} Alert</span>
                        </div>
                        <div className="pd-stat-chip sos" onClick={() => { setMapFilter('sos'); setActivePanel('map'); }}>
                            <span className="pd-stat-dot" style={{ background: '#ff4757' }} />
                            <span>{counters.sos} SOS</span>
                        </div>
                        <div className="pd-stat-chip" onClick={() => { setMapFilter('all'); setActivePanel('map'); }}>
                            <span>All</span>
                        </div>
                    </div>
                </header>

                {/* ===================== MAP PANEL ===================== */}
                {activePanel === 'map' && (
                    <div className="pd-map-panel">
                        <div className="pd-map-container">
                            <MapContainer
                                center={MAP_CENTER}
                                zoom={MAP_ZOOM}
                                className="pd-leaflet-map"
                                zoomControl={false}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                />
                                {focusTourist && <FlyToMarker position={[focusTourist.lat, focusTourist.lng]} />}

                                {/* Police station */}
                                <Marker position={[POLICE_STATION.lat, POLICE_STATION.lng]} icon={ICON_POLICE}>
                                    <Popup>
                                        <div style={{ textAlign: 'center' }}>
                                            <strong>🛡️ {POLICE_STATION.name}</strong><br />
                                            <small>Police Command Center</small>
                                        </div>
                                    </Popup>
                                </Marker>

                                {/* Tourist markers */}
                                {filteredTourists.map(t => (
                                    <React.Fragment key={t.id}>
                                        <Marker position={[t.lat, t.lng]} icon={getMarkerIcon(t.status)}>
                                            <Popup>
                                                <div className="map-popup">
                                                    <strong>{t.name}</strong>
                                                    <span className={`map-popup-status ${t.status}`}>{t.status.toUpperCase()}</span>
                                                    <small>📍 {t.zone}</small>
                                                    <small>🕐 {t.lastSeen}</small>
                                                    <small>🎯 {t.activity}</small>
                                                    <small className="mono">{t.id}</small>
                                                </div>
                                            </Popup>
                                        </Marker>
                                        {/* Danger/alert radius */}
                                        {t.status === 'sos' && (
                                            <Circle center={[t.lat, t.lng]} radius={5000}
                                                pathOptions={{ color: '#ff4757', fillColor: '#ff4757', fillOpacity: 0.1, weight: 2, dashArray: '8 4' }}
                                            />
                                        )}
                                        {t.status === 'alert' && (
                                            <Circle center={[t.lat, t.lng]} radius={3000}
                                                pathOptions={{ color: '#ffa502', fillColor: '#ffa502', fillOpacity: 0.08, weight: 1, dashArray: '6 4' }}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </MapContainer>

                            {/* Live indicator */}
                            <div className="pd-live-badge">
                                <span className="pd-live-dot" />
                                LIVE
                            </div>
                        </div>

                        {/* Tourist sidebar list on map */}
                        <div className="pd-map-sidebar">
                            <h4 className="pd-map-sidebar-title">Tourist Locations</h4>
                            <div className="pd-tourist-list">
                                {filteredTourists.map(t => (
                                    <button
                                        key={t.id}
                                        className={`pd-tourist-card ${t.status} ${focusTourist?.id === t.id ? 'focused' : ''}`}
                                        onClick={() => setFocusTourist(t)}
                                    >
                                        <div className="pd-tourist-card-header">
                                            <span className="pd-tourist-name">{t.name}</span>
                                            {statusBadge(t.status)}
                                        </div>
                                        <div className="pd-tourist-card-details">
                                            <span>📍 {t.zone}</span>
                                            <span>🕐 {t.lastSeen}</span>
                                        </div>
                                        <div className="pd-tourist-card-activity">{t.activity}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== SCANNER PANEL ===================== */}
                {activePanel === 'scanner' && (
                    <div className="pd-scanner-panel">
                        <div className="retro-card panel" style={{ maxWidth: 600, margin: '0 auto' }}>
                            <div className="panel-title">
                                <span>🔍</span>
                                <span>QR Verification — Works Offline</span>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                                <button
                                    className={scanMode === 'input' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                                    onClick={() => { stopCamera(); setScanMode('input'); }}
                                >📋 Paste QR Data</button>
                                <button
                                    className={scanMode === 'camera' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                                    onClick={startCamera}
                                >📷 Scan Camera</button>
                            </div>

                            {scanMode === 'camera' ? (
                                <div style={{ marginBottom: 'var(--space-lg)' }}>
                                    {/* Camera error message */}
                                    {cameraError && (
                                        <div className="auth-error" style={{ marginBottom: 'var(--space-md)' }}>
                                            <span>⚠️</span>
                                            <span>{cameraError}</span>
                                        </div>
                                    )}
                                    <div className="scanner-area" style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                        <video
                                            ref={videoRef}
                                            style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block', background: '#000' }}
                                            playsInline
                                            muted
                                        />
                                        {/* Scan frame overlay */}
                                        <div className="scanner-overlay">
                                            <div className="scanner-frame" />
                                            {scanStatus === 'scanning' && (
                                                <div className="scanner-laser" />
                                            )}
                                        </div>
                                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    </div>

                                    {/* Scanning status */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)',
                                        background: scanStatus === 'detected' ? 'rgba(45,212,140,0.1)' : 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)', fontSize: '0.8125rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                            {scanStatus === 'scanning' && (
                                                <>
                                                    <span className="pd-live-dot" style={{ width: 8, height: 8 }} />
                                                    <span style={{ color: 'var(--accent)' }}>Scanning — Point camera at QR code...</span>
                                                </>
                                            )}
                                            {scanStatus === 'detected' && (
                                                <>
                                                    <span>✅</span>
                                                    <span style={{ color: '#2dd48c', fontWeight: 700 }}>QR Code Detected!</span>
                                                </>
                                            )}
                                            {scanStatus === 'idle' && (
                                                <>
                                                    <span>📷</span>
                                                    <span className="text-muted">Camera initializing...</span>
                                                </>
                                            )}
                                        </div>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => { stopCamera(); setScanMode('input'); }}
                                            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                                        >
                                            ✖ Stop
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 'var(--space-lg)' }}>
                                    {/* Quick-load buttons */}
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                                        <button className="btn btn-outline btn-sm" onClick={loadDemoQR} style={{ flex: 1 }}>
                                            📋 Load Demo Tourist
                                        </button>
                                        <button className="btn btn-outline btn-sm" onClick={loadTouristQR} style={{ flex: 1 }}>
                                            🧳 Load Registered Tourist
                                        </button>
                                    </div>

                                    <textarea
                                        className="input-field"
                                        style={{ width: '100%', minHeight: '120px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', resize: 'vertical' }}
                                        placeholder='Paste the QR payload JSON here or click a button above to load...'
                                        value={qrInput}
                                        onChange={e => setQrInput(e.target.value)}
                                    />
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                        <button className="btn btn-primary btn-lg btn-block" onClick={() => handleVerify()} disabled={!qrInput.trim() || isVerifying}>
                                            {isVerifying ? '⏳ Verifying...' : '🔐 Verify Tourist ID'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ===== VERIFICATION RESULT ===== */}
                            {verifyResult && (
                                <div className={`verify-result ${verifyResult.verified ? 'verified' : 'tampered'}`}>
                                    <span className="verify-icon">{verifyResult.verified ? '✅' : '❌'}</span>
                                    <h2>{verifyResult.verified ? 'VERIFIED — Tourist ID Authentic' : 'VERIFICATION FAILED'}</h2>
                                    <p className="text-secondary" style={{ maxWidth: 400 }}>
                                        {verifyResult.verified
                                            ? 'SHA-256 hash & IPFS CID integrity confirmed. No internet was needed for this verification.'
                                            : verifyResult.error || 'Hash mismatch or invalid payload. This ID may have been tampered with.'}
                                    </p>

                                    {verifyResult.verified && verifyResult.payload && (
                                        <div className="retro-card" style={{ width: '100%', marginTop: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
                                            <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                <span>🪪</span> Tourist Information
                                            </h3>
                                            <div className="id-field">
                                                <span className="id-label">Full Name</span>
                                                <span className="id-value" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{verifyResult.payload.name}</span>
                                            </div>
                                            <div className="id-field">
                                                <span className="id-label">Tourist ID</span>
                                                <span className="id-value tourist-id">{verifyResult.payload.id}</span>
                                            </div>
                                            <div className="id-field">
                                                <span className="id-label">Valid Till</span>
                                                <span className="id-value">
                                                    {new Date(verifyResult.payload.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    {verifyResult.checks.notExpired
                                                        ? <span className="badge badge-success" style={{ marginLeft: 8 }}>Valid</span>
                                                        : <span className="badge badge-danger" style={{ marginLeft: 8 }}>Expired</span>
                                                    }
                                                </span>
                                            </div>
                                            <div className="id-field">
                                                <span className="id-label">Entry Point</span>
                                                <span className="id-value">{verifyResult.payload.entryPoint}</span>
                                            </div>
                                            <div className="id-field">
                                                <span className="id-label">Emergency Contact</span>
                                                <span className="id-value">{verifyResult.payload.emergencyContact}</span>
                                            </div>
                                            <div className="id-field">
                                                <span className="id-label">Blockchain Hash</span>
                                                <span className="id-value hash" style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>{verifyResult.payload.hash}</span>
                                            </div>
                                            <div className="id-field">
                                                <span className="id-label">IPFS CID</span>
                                                <span className="id-value hash" style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>{verifyResult.payload.cid}</span>
                                            </div>

                                            {/* Integrity Checks */}
                                            <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--bg-glass-border)' }}>
                                                <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '0.8125rem' }}>Integrity Checks</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div className="flex-between" style={{ fontSize: '0.8125rem' }}>
                                                        <span className="text-secondary">SHA-256 format</span>
                                                        <span>{verifyResult.checks.hashFormat ? '✅ Pass' : '❌ Fail'}</span>
                                                    </div>
                                                    <div className="flex-between" style={{ fontSize: '0.8125rem' }}>
                                                        <span className="text-secondary">CID integrity</span>
                                                        <span>{verifyResult.checks.cidIntegrity ? '✅ Pass' : '❌ Fail'}</span>
                                                    </div>
                                                    <div className="flex-between" style={{ fontSize: '0.8125rem' }}>
                                                        <span className="text-secondary">Not expired</span>
                                                        <span>{verifyResult.checks.notExpired ? '✅ Valid' : '⚠️ Expired'}</span>
                                                    </div>
                                                    <div className="flex-between" style={{ fontSize: '0.8125rem' }}>
                                                        <span className="text-secondary">Network required</span>
                                                        <span className="text-accent">None ✨</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--accent)', lineHeight: 1.6 }}>
                                <strong>💡 How it works:</strong> The QR payload contains the tourist's data + SHA-256 hash.
                                This app recalculates the hash locally and compares — no server, no internet, no API call.
                                If someone tampers with any field, the hash won't match → verification fails.
                            </div>
                        </div>
                    </div>
                )}

                {/* ===================== TOURISTS PANEL ===================== */}
                {activePanel === 'tourists' && (
                    <div className="pd-tourists-panel">
                        <div className="glass-card panel">
                            <div className="panel-title">
                                <span>👥</span>
                                <span>Active Tourists</span>
                                <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
                                    {tourists.length} registered
                                </span>
                            </div>
                            <table className="tourist-table">
                                <thead>
                                    <tr>
                                        <th>Tourist ID</th>
                                        <th>Name</th>
                                        <th>Zone</th>
                                        <th>Last Seen</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tourists.map(t => (
                                        <tr key={t.id}>
                                            <td><span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{t.id}</span></td>
                                            <td>{t.name}</td>
                                            <td className="text-secondary">{t.zone}</td>
                                            <td className="text-muted">{t.lastSeen}</td>
                                            <td>{statusBadge(t.status)}</td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm"
                                                    onClick={() => { setFocusTourist(t); setActivePanel('map'); }}
                                                >📍 Locate</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===================== ALERTS PANEL ===================== */}
                {activePanel === 'alerts' && (
                    <div className="pd-alerts-panel">
                        <div className="glass-card panel">
                            <div className="panel-title">
                                <span>🚨</span>
                                <span>Alert Feed</span>
                                {alerts.length > 0 && (
                                    <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>
                                        {alerts.filter(a => !a.dispatched).length} pending
                                    </span>
                                )}
                            </div>

                            {/* Always show SOS tourists as top-level alerts */}
                            {tourists.filter(t => t.status === 'sos' || t.status === 'alert').map(t => (
                                <div key={t.id} className="alert-card glass-card" style={{
                                    borderLeftColor: t.status === 'sos' ? 'var(--danger)' : 'var(--warning)',
                                    marginBottom: 'var(--space-md)',
                                }}>
                                    <div className="flex-between mb-md">
                                        <span className="alert-title" style={{ fontSize: '0.875rem' }}>
                                            {t.status === 'sos' ? '🚨 SOS EMERGENCY' : '⚠️ Anomaly Detected'}
                                        </span>
                                        {statusBadge(t.status)}
                                    </div>
                                    <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                                        <strong>{t.name}</strong> ({t.id})<br />
                                        📍 {t.zone} — {t.activity}
                                    </p>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                        <button className="btn btn-primary btn-sm"
                                            onClick={() => { setFocusTourist(t); setActivePanel('map'); }}
                                        >📍 Locate on Map</button>
                                        <button className="btn btn-ghost btn-sm">📞 Contact</button>
                                    </div>
                                </div>
                            ))}

                            {alerts.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxHeight: '300px', overflowY: 'auto' }}>
                                    {alerts.slice().reverse().map((alert, i) => (
                                        <div key={alert.id || i} className="alert-card glass-card" style={{
                                            borderLeftColor: alert.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'
                                        }}>
                                            <div className="flex-between mb-md">
                                                <span className="alert-title" style={{ fontSize: '0.875rem' }}>
                                                    {alert.type === 'PANIC_SOS' ? '🚨 PANIC SOS' : '⚠️ Anomaly Alert'}
                                                </span>
                                                <span className={`badge ${alert.dispatched ? 'badge-success' : 'badge-warning'}`}>
                                                    {alert.dispatched ? 'Sent' : 'Queued'}
                                                </span>
                                            </div>
                                            <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                                                <strong>{alert.name}</strong> ({alert.touristId})<br />
                                                {alert.reason}
                                            </p>
                                            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                                {new Date(alert.queuedAt).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : tourists.filter(t => t.status === 'sos' || t.status === 'alert').length === 0 && (
                                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>✅</p>
                                    <p>No active alerts</p>
                                </div>
                            )}

                            {alerts.length > 0 && (
                                <button className="btn btn-ghost btn-sm btn-block mt-md"
                                    onClick={() => { flushQueue(); setAlerts(getQueuedAlerts()); }}
                                >Flush Queue → Dispatch All</button>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
