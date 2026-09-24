import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import KasirScanner from './views/KasirScanner';
import MasterBarang from './views/MasterBarang';
import RiwayatTransaksi from './views/RiwayatTransaksi';
import Dashboard from './views/Dashboard';
import Login from './views/Login';
import api from './utils/api';

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('grosir_auth_token')));
    // Current active view tab
    const [activeTab, setActiveTab] = useState(() => {
        const saved = localStorage.getItem('grosir_active_tab');
        return saved || 'kasir';
    });

    // Sound toggle state
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('grosir_sound_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Toast notifications
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success') => {
        const id = Date.now() + Math.random().toString(36).substring(2, 5);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, 4000);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Sesi lokal tetap dihapus meskipun server tidak dapat dihubungi.
        }
        localStorage.removeItem('grosir_auth_token');
        localStorage.removeItem('grosir_auth_user');
        setIsAuthenticated(false);
    };

    // Save activeTab & sound preferences
    useEffect(() => {
        localStorage.setItem('grosir_active_tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('grosir_sound_enabled', JSON.stringify(soundEnabled));
    }, [soundEnabled]);

    // Keyboard Shortcuts (F1: Kasir, F2: Master, F3: Riwayat, F4: Dashboard)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                setActiveTab('kasir');
            } else if (e.key === 'F2') {
                e.preventDefault();
                setActiveTab('barang');
            } else if (e.key === 'F3') {
                e.preventDefault();
                setActiveTab('transaksi');
            } else if (e.key === 'F4') {
                e.preventDefault();
                setActiveTab('dashboard');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isAuthenticated) {
        return <Login onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
            {/* Header Navigation */}
            <Navbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <main className="flex-1 pb-12">
                {activeTab === 'kasir' && (
                    <KasirScanner
                        soundEnabled={soundEnabled}
                        addToast={addToast}
                    />
                )}
                {activeTab === 'barang' && (
                    <MasterBarang
                        soundEnabled={soundEnabled}
                        addToast={addToast}
                        setActiveTab={setActiveTab}
                    />
                )}
                {activeTab === 'transaksi' && (
                    <RiwayatTransaksi
                        soundEnabled={soundEnabled}
                        addToast={addToast}
                    />
                )}
                {activeTab === 'dashboard' && (
                    <Dashboard
                        setActiveTab={setActiveTab}
                    />
                )}
            </main>

            {/* Toast Notifications */}
            <Toast toasts={toasts} removeToast={removeToast} />

            {/* Bottom Keyboard Hint Bar */}
            <footer className="bg-slate-950/80 border-t border-slate-900 py-3 px-4 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <span>Aplikasi Kasir Grosir Desktop / Web</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">● Sistem Siap Scan</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono">
                        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">F1</kbd> Kasir</span>
                        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">F2</kbd> Master Barang</span>
                        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">F3</kbd> Riwayat Scan</span>
                        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">F4</kbd> Dashboard</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
