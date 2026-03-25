import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTouristRecord } from '../utils/crypto';
import { saveTourist } from '../utils/storage';
import T from '../components/Translate';

export default function Onboarding() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        aadhaar: '',
        entryPoint: 'Guwahati Airport',
        validTill: '2027-04-15',
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
            setTimeout(() => navigate('/tourist/id'), 600);
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
            validTill: '2027-04-15',
            emergencyContact: '+91 98765 43210',
            language: 'en'
        });
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>🛡️ <T>SurakshaPath</T></h1>
                    <p className="text-secondary mt-sm" style={{ fontSize: '0.8125rem' }}>
                        <T>Tourist Safety System</T>
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="retro-card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}><T>Tourist ID Setup</T></h3>

                    <div className="input-group mb-md">
                        <label><T>Aadhaar / Passport</T></label>
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
                        <label><T>Full Name</T></label>
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
                        <label><T>Entry Point</T></label>
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
                        <label><T>Valid Till</T></label>
                        <input
                            className="input-field"
                            type="date"
                            value={form.validTill}
                            onChange={e => update('validTill', e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group mb-md">
                        <label><T>Emergency Contact</T></label>
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
                        <label><T>Language</T></label>
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
                        <span>⏳ <T>Generating Digital ID...</T></span>
                    ) : (
                        <span>🪪 <T>Generate Digital ID</T></span>
                    )}
                </button>

                <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={fillDemo}
                >
                    <T>Fill Demo Data</T>
                </button>
            </form>
        </div>
    );
}
