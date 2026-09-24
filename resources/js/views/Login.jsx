import React, { useState } from 'react';
import { LockKeyhole, LogIn, ScanLine } from 'lucide-react';
import api from '../utils/api';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await api.post('/auth/login', { username, password });
            localStorage.setItem('grosir_auth_token', response.token);
            localStorage.setItem('grosir_auth_user', JSON.stringify(response.user));
            onLogin(response.user);
        } catch (requestError) {
            setError(requestError.message || 'Login gagal. Periksa username dan password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-linear-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-xl shadow-amber-500/20 mb-4">
                        <ScanLine className="w-9 h-9" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">GROSIR <span className="text-amber-600">EKI</span></h1>
                    <p className="text-sm text-slate-500 mt-1">Aplikasi Kasir & Stok Grosir</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/95 border border-emerald-100 rounded-2xl p-6 sm:p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                            <LockKeyhole className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">Masuk ke Sistem</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Gunakan akun administrator untuk melanjutkan.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block">
                            <span className="block text-sm font-semibold text-slate-700 mb-1.5">Username</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                autoComplete="username"
                                required
                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                            />
                        </label>

                        <label className="block">
                            <span className="block text-sm font-semibold text-slate-700 mb-1.5">Password</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                required
                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                            />
                        </label>
                    </div>

                    {error && (
                        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-6 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-4 h-4" />
                        {isSubmitting ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>
            </div>
        </main>
    );
}
