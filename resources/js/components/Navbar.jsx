import React, { useState, useEffect } from 'react';
import {
    ScanLine,
    Package,
    History,
    LayoutDashboard,
    Volume2,
    VolumeX,
    Maximize2,
    Minimize2,
    Clock,
    Sparkles,
    LogOut
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, soundEnabled, setSoundEnabled, onLogout }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.log(err));
                setIsFullscreen(false);
            }
        }
    };

    const navItems = [
        { id: 'kasir', label: 'Kasir Scanner', shortcut: 'F1', icon: ScanLine, color: 'text-amber-400' },
        { id: 'barang', label: 'Master Barang', shortcut: 'F2', icon: Package, color: 'text-sky-400' },
        { id: 'transaksi', label: 'Riwayat Transaksi', shortcut: 'F3', icon: History, color: 'text-emerald-400' },
        { id: 'dashboard', label: 'Dashboard', shortcut: 'F4', icon: LayoutDashboard, color: 'text-purple-400' },
    ];

    const formattedTime = currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const formattedDate = currentTime.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Brand */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
                            <ScanLine className="w-6 h-6 text-slate-950" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-lg tracking-tight text-white">
                                    GROSIR <span className="text-amber-400">EKI</span>
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">Aplikasi Kasir & Stok Grosir</p>
                        </div>
                    </div>

                    {/* Nav Tabs */}
                    <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                        isActive
                                            ? 'bg-slate-800 text-white shadow-md'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700/60">
                                        {item.shortcut}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Right Tools: Clock, Sound, Fullscreen */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Live Clock */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-300 font-mono text-xs">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-semibold text-slate-100">{formattedTime}</span>
                            <span className="text-slate-400">| {formattedDate}</span>
                        </div>

                        {/* Sound Toggle */}
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            title={soundEnabled ? 'Suara Scanner Aktif (Klik untuk bisukan)' : 'Suara Scanner Mati (Klik untuk nyalakan)'}
                            className={`p-2 rounded-lg border transition-colors ${
                                soundEnabled
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>

                        {/* Fullscreen Toggle */}
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            title="Layar Penuh / Fullscreen"
                            className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={onLogout}
                            title="Keluar dari akun"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Tabs */}
                <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold ${
                                    isActive ? 'text-amber-400' : 'text-slate-400'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}
