import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getTourist, clearTourist } from '../utils/storage';
import { signOut } from '../utils/auth';
import T from '../components/Translate';

export default function DigitalID() {
    const navigate = useNavigate();
    const [tourist, setTourist] = useState(null);
    const [showShare, setShowShare] = useState(false);

    useEffect(() => {
        const data = getTourist();
        if (!data) {
            navigate('/tourist/onboarding');
            return;
        }
        setTourist(data);
    }, []);

    if (!tourist) return null;

    const handleReset = () => {
        clearTourist();
        navigate('/tourist/onboarding');
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'SurakshaPath Tourist ID',
                    text: `Tourist ID: ${tourist.id}\nName: ${tourist.name}\nHash: ${tourist.hash}`,
                });
            } catch (e) {
                setShowShare(true);
            }
        } else {
            setShowShare(true);
        }
    };

    const copyQR = () => {
        navigator.clipboard.writeText(tourist.qrPayload);
        setShowShare(false);
        alert('QR data copied to clipboard!');
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1><T>Your Digital ID</T></h1>
                <span className="badge badge-success"><T>ID Ready</T></span>
                <button className="btn btn-ghost btn-sm" onClick={() => { signOut(); navigate('/'); }} style={{ marginLeft: 8 }}>🚪</button>
            </div>

            {/* QR Code */}
            <div className="retro-card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                <p className="text-secondary" style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-md)' }}>
                    <T>Scan to verify offline</T>
                </p>
                <div className="qr-container">
                    <QRCodeSVG
                        value={tourist.qrPayload}
                        size={200}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#0a0f0d"
                        includeMargin={false}
                    />
                </div>
                <p className="text-muted mt-md" style={{ fontSize: '0.75rem' }}>
                    <T>Works offline — no internet needed for verification</T>
                </p>
            </div>

            {/* ID Card */}
            <div className="retro-card id-card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="id-field">
                    <span className="id-label"><T>Name</T></span>
                    <span className="id-value">{tourist.name}</span>
                </div>
                <div className="id-field">
                    <span className="id-label"><T>Tourist ID</T></span>
                    <span className="id-value tourist-id">{tourist.id}</span>
                </div>
                <div className="id-field">
                    <span className="id-label"><T>Valid till</T></span>
                    <span className="id-value">{new Date(tourist.validTill).toLocaleDateString(tourist.language === 'en' ? 'en-IN' : tourist.language, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="id-field">
                    <span className="id-label"><T>Entry Point</T></span>
                    <span className="id-value">{tourist.entryPoint}</span>
                </div>
                <div className="id-field">
                    <span className="id-label"><T>Blockchain hash</T></span>
                    <span className="id-value hash">{tourist.hash.slice(0, 6)}...{tourist.hash.slice(-4)}</span>
                </div>
                <div className="id-field">
                    <span className="id-label"><T>IPFS CID</T></span>
                    <span className="id-value hash" style={{ fontSize: '0.75rem' }}>{tourist.cid.slice(0, 16)}...</span>
                </div>
            </div>

            <button className="btn btn-primary btn-block mb-md" onClick={handleShare}>
                📤 <T>Share with police / hotel</T>
            </button>

            {showShare && (
                <div className="retro-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                    <p className="text-secondary mb-md" style={{ fontSize: '0.875rem' }}>
                        <T>Share this QR data with the verifier:</T>
                    </p>
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        wordBreak: 'break-all',
                        color: 'var(--accent)',
                        marginBottom: 'var(--space-md)',
                        maxHeight: '120px',
                        overflow: 'auto'
                    }}>
                        {tourist.qrPayload}
                    </div>
                    <button className="btn btn-outline btn-block btn-sm" onClick={copyQR}>
                        📋 <T>Copy QR Data</T>
                    </button>
                </div>
            )}

            <button className="btn btn-ghost btn-block" onClick={handleReset} style={{ fontSize: '0.8125rem' }}>
                <T>Reset ID (Dev)</T>
            </button>
        </div>
    );
}
