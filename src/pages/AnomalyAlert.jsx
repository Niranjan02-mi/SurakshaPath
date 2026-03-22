import React, { useState, useEffect, useRef } from 'react';
import { detectAnomaly } from '../utils/anomalyEngine';
import { queueAlert, getPendingAlerts } from '../utils/offlineQueue';
import { getTourist, getLastLocation } from '../utils/storage';

export default function AnomalyAlert() {
    const [anomalyResult, setAnomalyResult] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [sosSent, setSosSent] = useState(false);
    const [simulatedTime, setSimulatedTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [pendingAlerts, setPendingAlerts] = useState([]);
    const intervalRef = useRef(null);

    const tourist = getTourist();

    // Demo location — Loktak Lake trail (moderate-high risk zone)
    const demoLocation = {
        lat: 24.53,
        lng: 93.78,
        speed: 0,
        timeSinceLastMove: simulatedTime,
        timestamp: Date.now()
    };

    useEffect(() => {
        setPendingAlerts(getPendingAlerts());
    }, []);

    useEffect(() => {
        if (simulatedTime > 0) {
            const result = detectAnomaly({ ...demoLocation, timeSinceLastMove: simulatedTime });
            setAnomalyResult(result);
        }
    }, [simulatedTime]);

    const startSimulation = () => {
        setIsRunning(true);
        setDismissed(false);
        setSosSent(false);
        setSimulatedTime(0);

        // Accelerated simulation: 1 second = 10 minutes of "real time"
        intervalRef.current = setInterval(() => {
            setSimulatedTime(prev => {
                const next = prev + 600; // +10 minutes every second
                if (next >= 9000) { // Stop at 2.5 hours
                    clearInterval(intervalRef.current);
                    setIsRunning(false);
                }
                return next;
            });
        }, 1000);
    };

    const stopSimulation = () => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
    };

    const handleDismiss = () => {
        setDismissed(true);
        setAnomalyResult(null);
        stopSimulation();
    };

    const handleSOS = () => {
        setSosSent(true);
        const alert = queueAlert({
            type: 'SOS_ANOMALY',
            touristId: tourist?.id || 'UNKNOWN',
            name: tourist?.name || 'Unknown',
            lat: demoLocation.lat,
            lng: demoLocation.lng,
            reason: anomalyResult?.topAnomaly?.reason || 'Anomaly detected',
            severity: 'high'
        });
        setPendingAlerts(getPendingAlerts());
        stopSimulation();
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const hasAnomaly = anomalyResult?.isAnomaly && !dismissed && !sosSent;

    return (
        <div className="page">
            <div className="page-header">
                <h1>AI Safety Monitor</h1>
                <span className={`badge ${hasAnomaly ? 'badge-danger' : 'badge-success'}`}>
                    {hasAnomaly ? '⚠ Alert' : '✓ Safe'}
                </span>
            </div>

            {/* Simulation Controls */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ marginBottom: 'var(--space-sm)' }}>🧪 Anomaly Detection Simulator</h4>
                <p className="text-secondary" style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
                    Simulates a tourist stationary in Loktak Lake trail zone. Watch the AI engine detect the anomaly in real-time.
                </p>

                <div className="flex-between mb-md">
                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Simulated stationary time:</span>
                    <span className="mono text-accent" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                        {formatTime(simulatedTime)}
                    </span>
                </div>

                {/* Progress bar */}
                <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '3px',
                    marginBottom: 'var(--space-md)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${Math.min(100, (simulatedTime / 7200) * 100)}%`,
                        height: '100%',
                        background: simulatedTime >= 7200
                            ? 'linear-gradient(90deg, var(--warning), var(--danger))'
                            : 'linear-gradient(90deg, var(--accent), var(--accent-dim))',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>

                <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-md)' }}>
                    Threshold: 2 hours in zone with risk &gt; 0.6 → triggers alert
                </p>

                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {!isRunning ? (
                        <button className="btn btn-primary btn-sm" onClick={startSimulation}>
                            ▶ Start Simulation
                        </button>
                    ) : (
                        <button className="btn btn-outline btn-sm" onClick={stopSimulation}>
                            ⏸ Pause
                        </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                        stopSimulation();
                        setSimulatedTime(7500); // Jump to trigger
                    }}>
                        ⏩ Skip to Alert
                    </button>
                </div>
            </div>

            {/* Anomaly Alert Card */}
            {hasAnomaly && (
                <div className="glass-card alert-card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="alert-title text-danger" style={{ fontSize: '1rem' }}>
                        ⚠️ AI Anomaly Detected
                    </div>
                    <p className="alert-desc">
                        {anomalyResult.topAnomaly.reason}. Are you okay?
                    </p>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                            Respond to dismiss alert
                        </span>
                    </div>
                    <div className="alert-actions">
                        <button className="btn btn-primary btn-sm" onClick={handleDismiss}>
                            ✅ Yes, I am safe
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={handleSOS}>
                            🚨 Send SOS to police
                        </button>
                    </div>
                </div>
            )}

            {/* Dismissed state */}
            {dismissed && (
                <div className="glass-card verify-result verified" style={{ marginBottom: 'var(--space-lg)' }}>
                    <span className="verify-icon">✅</span>
                    <h3>Alert Dismissed</h3>
                    <p className="text-secondary">Your safety status has been updated. Stay safe!</p>
                </div>
            )}

            {/* SOS sent state */}
            {sosSent && (
                <div className="glass-card alert-card" style={{ borderLeftColor: 'var(--warning)', marginBottom: 'var(--space-lg)' }}>
                    <div className="alert-title" style={{ color: 'var(--warning)' }}>
                        🚨 SOS Alert Queued
                    </div>
                    <p className="alert-desc">
                        Alert queued — will auto-dispatch if no response in 10 min
                    </p>
                    <div className="flex-between">
                        <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Loktak Lake trail, {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        {navigator.onLine ? (
                            <span className="badge badge-success">Sent ✓</span>
                        ) : (
                            <span className="badge badge-warning">Queued</span>
                        )}
                    </div>
                </div>
            )}

            {/* Last known location */}
            <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ marginBottom: 'var(--space-md)' }}>Last Known Location</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div className="pulse-dot" style={{ background: anomalyResult?.isAnomaly ? 'var(--danger)' : 'var(--accent)' }} />
                    <div>
                        <p style={{ fontSize: '0.875rem' }}>Loktak Lake trail</p>
                        <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
                            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {demoLocation.lat.toFixed(4)}, {demoLocation.lng.toFixed(4)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Queue status */}
            {pendingAlerts.length > 0 && (
                <div className={navigator.onLine ? 'online-banner' : 'offline-banner'}>
                    {navigator.onLine ? '🟢' : '📡'} {pendingAlerts.length} alert(s) in queue
                    {!navigator.onLine && ' — will fire when connection returns'}
                </div>
            )}
        </div>
    );
}
