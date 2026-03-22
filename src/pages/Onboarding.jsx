import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTouristRecord } from '../utils/crypto';
import { saveTourist } from '../utils/storage';

export default function Onboarding() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        aadhaar: '',
        entryPoint: 'Guwahati Airport',
        validTill: '2025-04-15',
        emergencyContact: '',
        language: 'en'
    });

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const record = await createTouristRecord(form);
            saveTourist(record);
            setTimeout(() => navigate('/id'), 600);
        } catch (err) {
            console.error('Failed to create tourist record:', err);
            setLoading(false);
        }
    };

    const fillDemo = () => {
        setForm({
            name: 'Priya Sharma',
            aadhaar: 'XXXX XXXX 4892',
            entryPoint: 'DEL Airport',
            validTill: '2025-04-15',
            emergencyContact: '+91 98765 43210',
            language: 'en'
        });
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>🛡️ SurakshaPath</h1>
                    <p className="text-secondary mt-sm" style={{ fontSize: '0.8125rem' }}>
                        Tourist Safety System
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="glass-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Tourist ID Setup</h3>

                    <div className="input-group mb-md">
                        <label>Aadhaar / Passport</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="XXXX XXXX 4892"
                            value={form.aadhaar}
                            onChange={e => update('aadhaar', e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group mb-md">
                        <label>Full Name</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="Priya Sharma"
                            value={form.name}
                            onChange={e => update('name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group mb-md">
                        <label>Entry Point</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="DEL Airport"
                            value={form.entryPoint}
                            onChange={e => update('entryPoint', e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group mb-md">
                        <label>Valid Till</label>
                        <input
                            className="input-field"
                            type="date"
                            value={form.validTill}
                            onChange={e => update('validTill', e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group mb-md">
                        <label>Emergency Contact</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="+91 98XXX XXXXX"
                            value={form.emergencyContact}
                            onChange={e => update('emergencyContact', e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group mb-lg">
                        <label>Language</label>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            {['en', 'hi', 'bn'].map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    className={form.language === lang ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                                    onClick={() => update('language', lang)}
                                >
                                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'বাংলা'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-lg btn-block"
                    disabled={loading}
                    style={{ marginBottom: 'var(--space-md)' }}
                >
                    {loading ? (
                        <span>⏳ Generating Digital ID...</span>
                    ) : (
                        <span>🪪 Generate Digital ID</span>
                    )}
                </button>

                <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={fillDemo}
                >
                    Fill Demo Data
                </button>
            </form>
        </div>
    );
}
