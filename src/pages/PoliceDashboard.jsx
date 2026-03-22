import React, { useState, useEffect, useRef } from 'react';
import { verifyQRPayload } from '../utils/crypto';
import { getPendingAlerts, getQueuedAlerts, flushQueue } from '../utils/offlineQueue';

// Mock tourist data for the dashboard
const MOCK_TOURISTS = [
    { id: 'SP-2025-A8F21', name: 'Priya Sharma', status: 'active', zone: 'Shillong', lastSeen: '2 min ago' },
    { id: 'SP-2025-B3C44', name: 'Rahul Verma', status: 'alert', zone: 'Loktak Lake', lastSeen: '2h 14m ago' },
    { id: 'SP-2025-C7D89', name: 'Anita Das', status: 'active', zone: 'Cherrapunji', lastSeen: '15 min ago' },
    { id: 'SP-2025-D1E56', name: 'Vikram Singh', status: 'active', zone: 'Tawang', lastSeen: '45 min ago' },
    { id: 'SP-2025-E9F12', name: 'Meera Nair', status: 'sos', zone: 'Kaziranga', lastSeen: '5 min ago' },
];

export default function PoliceDashboard() {
    const [scanMode, setScanMode] = useState('input'); // 'input' or 'camera'
    const [qrInput, setQrInput] = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [alerts, setAlerts] = useState([]);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scanInterval = useRef(null);

    useEffect(() => {
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        // Load queued alerts
        setAlerts(getQueuedAlerts());

        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
            stopCamera();
        };
    }, []);

    const handleVerify = async (payload) => {
        setIsVerifying(true);
        // Small delay for dramatic effect
        await new Promise(r => setTimeout(r, 800));
        const result = await verifyQRPayload(payload || qrInput);
        setVerifyResult(result);
        setIsVerifying(false);
    };

    const startCamera = async () => {
        setScanMode('camera');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                // Start scanning
                scanInterval.current = setInterval(() => scanFrame(), 500);
            }
        } catch (err) {
            console.error('Camera not available:', err);
            setScanMode('input');
            alert('Camera not available. Use paste mode instead.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        clearInterval(scanInterval.current);
    };

    const scanFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Dynamic import jsQR only when needed
        try {
            const jsQR = (await import('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js')).default;
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
                stopCamera();
                setScanMode('input');
                setQrInput(code.data);
                handleVerify(code.data);
            }
        } catch {
            // jsQR not available, use fallback
        }
    };

    const loadDemoQR = () => {
        // Generate a demo QR payload
        const demoPayload = JSON.stringify({
            id: 'SP-2025-A8F2100',
            name: 'Priya Sharma',
            hash: 'a3f8c2d1e9b7456023f8c2d1e9b745602a3f8c2d1e9b7456023f8c2d1e9b74560',
            validTill: '2025-04-15',
            emergencyContact: '+91 98765 43210',
            entryPoint: 'DEL Airport',
            cid: 'bafybeia3f8c2d1e9b7456023f8c2d1e9b745602a3f8c2d1e9b7456023f8c2d1'
        });
        setQrInput(demoPayload);
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

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        🛡️ SurakshaPath
                        <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                            Police Dashboard
                        </span>
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div className={isOnline ? 'online-banner' : 'offline-banner'}>
                        {isOnline ? '🟢 Online' : '📡 Offline Mode'}
                    </div>
                    <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                        {new Date().toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Scanner Panel */}
                <div className="glass-card panel panel-scanner">
                    <div className="panel-title">
                        <span>🔍</span>
                        <span>QR Verification — Works Offline</span>
                    </div>

                    {/* Mode toggle */}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                        <button
                            className={scanMode === 'input' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                            onClick={() => { stopCamera(); setScanMode('input'); }}
                        >
                            📋 Paste QR Data
                        </button>
                        <button
                            className={scanMode === 'camera' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                            onClick={startCamera}
                        >
                            📷 Scan Camera
                        </button>
                    </div>

                    {scanMode === 'camera' ? (
                        <div className="scanner-area" style={{ marginBottom: 'var(--space-lg)' }}>
                            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div className="scanner-overlay">
                                <div className="scanner-frame" />
                            </div>
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                    ) : (
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <textarea
                                className="input-field"
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.75rem',
                                    resize: 'vertical'
                                }}
                                placeholder='Paste the QR payload JSON here, e.g. {"id":"SP-2025-...","name":"...","hash":"..."}'
                                value={qrInput}
                                onChange={e => setQrInput(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleVerify()}
                                    disabled={!qrInput.trim() || isVerifying}
                                    style={{ flex: 1 }}
                                >
                                    {isVerifying ? '⏳ Verifying...' : '🔐 Verify ID Offline'}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={loadDemoQR}>
                                    Demo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Verification Result */}
                    {verifyResult && (
                        <div className={`verify-result ${verifyResult.verified ? 'verified' : 'tampered'}`}>
                            <span className="verify-icon">
                                {verifyResult.verified ? '✅' : '❌'}
                            </span>
                            <h2>
                                {verifyResult.verified ? 'VERIFIED ✓' : 'VERIFICATION FAILED'}
                            </h2>
                            <p className="text-secondary" style={{ maxWidth: 300 }}>
                                {verifyResult.verified
                                    ? 'Digital Tourist ID is authentic. SHA-256 hash integrity confirmed. No internet was needed.'
                                    : verifyResult.error || 'Hash mismatch or invalid payload. This ID may have been tampered with.'
                                }
                            </p>

                            {verifyResult.verified && verifyResult.payload && (
                                <div style={{
                                    width: '100%',
                                    marginTop: 'var(--space-lg)',
                                    textAlign: 'left'
                                }}>
                                    <div className="id-field">
                                        <span className="id-label">Name</span>
                                        <span className="id-value">{verifyResult.payload.name}</span>
                                    </div>
                                    <div className="id-field">
                                        <span className="id-label">Tourist ID</span>
                                        <span className="id-value tourist-id">{verifyResult.payload.id}</span>
                                    </div>
                                    <div className="id-field">
                                        <span className="id-label">Valid till</span>
                                        <span className="id-value">{verifyResult.payload.validTill}</span>
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
                                        <span className="id-label">SHA-256 Hash</span>
                                        <span className="id-value hash" style={{ fontSize: '0.7rem' }}>
                                            {verifyResult.payload.hash}
                                        </span>
                                    </div>
                                    <div className="id-field">
                                        <span className="id-label">IPFS CID</span>
                                        <span className="id-value hash" style={{ fontSize: '0.7rem' }}>
                                            {verifyResult.payload.cid}
                                        </span>
                                    </div>

                                    {/* Verification checks */}
                                    <div style={{ marginTop: 'var(--space-lg)' }}>
                                        <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '0.8125rem' }}>
                                            Integrity Checks
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div className="flex-between" style={{ fontSize: '0.8125rem' }}>
                                                <span className="text-secondary">SHA-256 format</span>
                                                <span>{verifyResult.checks.hashFormat ? '✅' : '❌'}</span>
                                            </div>
                                            <div className="flex-between" style={{ fontSize: '0.8125rem' }}>
                                                <span className="text-secondary">CID integrity</span>
                                                <span>{verifyResult.checks.cidIntegrity ? '✅' : '❌'}</span>
                                            </div>
                                            <div className="flex-between" style={{ fontSize: '0.8125rem' }}>
                                                <span className="text-secondary">Not expired</span>
                                                <span>{verifyResult.checks.notExpired ? '✅' : '❌'}</span>
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

                    {/* Offline explainer */}
                    <div style={{
                        marginTop: 'var(--space-lg)',
                        padding: 'var(--space-md)',
                        background: 'var(--accent-soft)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8125rem',
                        color: 'var(--accent)',
                        lineHeight: 1.6
                    }}>
                        <strong>💡 How it works:</strong> The QR payload contains the tourist's data + SHA-256 hash.
                        This app recalculates the hash locally and compares it — no server, no internet, no API call.
                        If someone tampers with any field, the hash won't match → verification fails.
                    </div>
                </div>

                {/* Active Tourists Panel */}
                <div className="glass-card panel panel-tourists">
                    <div className="panel-title">
                        <span>👥</span>
                        <span>Active Tourists</span>
                        <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
                            {MOCK_TOURISTS.length} registered
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
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_TOURISTS.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                                            {t.id}
                                        </span>
                                    </td>
                                    <td>{t.name}</td>
                                    <td className="text-secondary">{t.zone}</td>
                                    <td className="text-muted">{t.lastSeen}</td>
                                    <td>{statusBadge(t.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Alert Feed Panel */}
                <div className="glass-card panel panel-alerts">
                    <div className="panel-title">
                        <span>🚨</span>
                        <span>Alert Feed</span>
                        {alerts.length > 0 && (
                            <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>
                                {alerts.filter(a => !a.dispatched).length} pending
                            </span>
                        )}
                    </div>

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
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--space-xl)',
                            color: 'var(--text-muted)'
                        }}>
                            <p style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>✅</p>
                            <p>No active alerts</p>
                            <p style={{ fontSize: '0.8125rem', marginTop: 'var(--space-sm)' }}>
                                SOS and anomaly alerts will appear here
                            </p>
                        </div>
                    )}

                    {alerts.length > 0 && (
                        <button
                            className="btn btn-ghost btn-sm btn-block mt-md"
                            onClick={() => {
                                flushQueue();
                                setAlerts(getQueuedAlerts());
                            }}
                        >
                            Flush Queue → Dispatch All
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
