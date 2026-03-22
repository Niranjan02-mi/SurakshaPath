import React, { useState, useEffect, useRef } from 'react';
import { queueAlert, getPendingAlerts, getQueueStats, flushQueue } from '../utils/offlineQueue';
import { getTourist } from '../utils/storage';

export default function SOSPage() {
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [activated, setActivated] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queueStats, setQueueStats] = useState(getQueueStats());
    const holdTimer = useRef(null);
    const progressTimer = useRef(null);
    const tourist = getTourist();

    useEffect(() => {
        const onOnline = () => { setIsOnline(true); setQueueStats(getQueueStats()); };
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    const startHold = () => {
        setIsHolding(true);
        setHoldProgress(0);

        let progress = 0;
        progressTimer.current = setInterval(() => {
            progress += 3.33; // 3 seconds to fill
            setHoldProgress(Math.min(100, progress));
        }, 100);

        holdTimer.current = setTimeout(() => {
            clearInterval(progressTimer.current);
            setIsHolding(false);
            setHoldProgress(100);
            activateSOS();
        }, 3000);
    };

    const endHold = () => {
        clearTimeout(holdTimer.current);
        clearInterval(progressTimer.current);
        setIsHolding(false);
        setHoldProgress(0);
    };

    const activateSOS = () => {
        setActivated(true);

        // Queue the SOS alert
        queueAlert({
            type: 'PANIC_SOS',
            touristId: tourist?.id || 'UNKNOWN',
            name: tourist?.name || 'Unknown Tourist',
            lat: 25.5788,
            lng: 91.8933,
            reason: 'Manual PANIC SOS activated by tourist',
            severity: 'critical',
            emergencyContact: tourist?.emergencyContact || 'N/A'
        });

        setQueueStats(getQueueStats());
    };

    const resetSOS = () => {
        setActivated(false);
        setHoldProgress(0);
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>Emergency SOS</h1>
                <span className={`badge ${activated ? 'badge-danger' : 'badge-info'}`}>
                    {activated ? 'SOS Active' : 'Standby'}
                </span>
            </div>

            {!activated ? (
                <>
                    {/* SOS Button */}
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                        <button
                            className={`sos-button ${isHolding ? 'active' : ''}`}
                            onMouseDown={startHold}
                            onMouseUp={endHold}
                            onMouseLeave={endHold}
                            onTouchStart={startHold}
                            onTouchEnd={endHold}
                            style={{
                                background: isHolding
                                    ? `conic-gradient(var(--danger) ${holdProgress}%, var(--danger-bg) ${holdProgress}%)`
                                    : undefined
                            }}
                        >
                            <span style={{ fontSize: '2rem' }}>🚨</span>
                            <span>PANIC<br />SOS</span>
                            <span className="sos-sub">Hold 3 seconds to activate</span>
                        </button>
                    </div>

                    {/* Status info */}
                    <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                        <h4 style={{ marginBottom: 'var(--space-lg)' }}>On activation</h4>
                        <div className="sos-status-list">
                            <div className="sos-status-item">
                                <span className="sos-status-label">Live location broadcast</span>
                                <span className="badge badge-success">Ready</span>
                            </div>
                            <div className="sos-status-item">
                                <span className="sos-status-label">Nearest police unit</span>
                                <span className="badge badge-info">Standby</span>
                            </div>
                            <div className="sos-status-item">
                                <span className="sos-status-label">Emergency contact</span>
                                <span className="badge badge-info">
                                    {tourist?.emergencyContact ? 'Configured' : 'Not set'}
                                </span>
                            </div>
                            <div className="sos-status-item">
                                <span className="sos-status-label">Offline queue</span>
                                <span className={`badge ${isOnline ? 'badge-success' : 'badge-warning'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Activated state */}
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--space-xl)',
                        marginBottom: 'var(--space-lg)',
                        animation: 'verifyPulse 0.5s ease-out'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            marginBottom: 'var(--space-md)',
                            animation: 'sosPulse 1s infinite'
                        }}>
                            🚨
                        </div>
                        <h2 className="text-danger" style={{ marginBottom: 'var(--space-sm)' }}>
                            SOS ACTIVATED
                        </h2>
                        <p className="text-secondary">
                            Emergency alerts are being dispatched
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                        <div className="sos-status-list">
                            <div className="sos-status-item">
                                <span className="sos-status-label">Live location broadcast</span>
                                <span className="badge badge-success">On</span>
                            </div>
                            <div className="sos-status-item">
                                <span className="sos-status-label">Nearest police unit</span>
                                <span className={`badge ${isOnline ? 'badge-success' : 'badge-warning'}`}>
                                    {isOnline ? 'Notified' : 'Queued'}
                                </span>
                            </div>
                            <div className="sos-status-item">
                                <span className="sos-status-label">Emergency contact</span>
                                <span className={`badge ${isOnline ? 'badge-success' : 'badge-warning'}`}>
                                    {isOnline ? 'SMS sent' : 'Queued'}
                                </span>
                            </div>
                            <div className="sos-status-item">
                                <span className="sos-status-label">Offline queue</span>
                                <span className={`badge ${isOnline ? 'badge-success' : 'badge-warning'}`}>
                                    {isOnline ? `${queueStats.dispatched} sent` : `${queueStats.pending} pending`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {!isOnline && (
                        <div className="offline-banner" style={{ marginBottom: 'var(--space-lg)' }}>
                            📡 No signal? Alert is queued and will fire when connection returns
                        </div>
                    )}

                    <button className="btn btn-ghost btn-block" onClick={resetSOS}>
                        Cancel SOS (Dev)
                    </button>
                </>
            )}

            {/* Queue stats */}
            {queueStats.total > 0 && (
                <div className="glass-card" style={{ padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                    <div className="flex-between">
                        <span className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                            Queue: {queueStats.pending} pending · {queueStats.dispatched} sent
                        </span>
                        {isOnline && queueStats.pending > 0 && (
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                                flushQueue();
                                setQueueStats(getQueueStats());
                            }}>
                                Flush Queue
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
