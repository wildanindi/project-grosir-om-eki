import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    LayoutDashboard,
    Package,
    Boxes,
    ScanLine,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    RefreshCw,
    ExternalLink,
    Zap,
    Clock,
    PlusCircle
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/stats');
            if (res.success) {
                setStats(res.data);
            }
        } catch (err) {
            console.error('Failed to load stats', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Format jam scan
    const formatTime = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading && !stats) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-3" />
                <p className="text-sm font-semibold">Memuat data ringkasan dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                        <LayoutDashboard className="w-7 h-7 text-purple-400" />
                        <span>Dashboard & Ringkasan Stok</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Ikhtisar metrik inventaris barang dan aktivitas scan kasir grosir.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={fetchStats}
                        disabled={loading}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Segarkan</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('kasir')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
                    >
                        <ScanLine className="w-4 h-4 text-slate-950" />
                        <span>Buka Kasir Scanner (F1)</span>
                    </button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Jenis Produk */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Total Jenis Produk
                        </span>
                        <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black font-mono text-white">
                            {stats?.total_produk ?? 0}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Item terdaftar dalam katalog</p>
                    </div>
                </div>

                {/* Total Stok Unit */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Total Stok Fisik
                        </span>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                            <Boxes className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black font-mono text-white">
                            {stats?.total_stok ?? 0} <span className="text-sm font-sans font-medium text-slate-400">pcs</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Akumulasi seluruh barang</p>
                    </div>
                </div>

                {/* Transaksi Hari Ini */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Scan Hari Ini
                        </span>
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                            <Zap className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-black font-mono text-white">
                            {stats?.transaksi_hari_ini ?? 0} <span className="text-sm font-sans font-medium text-slate-400">kali</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono mt-1">
                            <span className="text-rose-400 font-bold">-{stats?.qty_keluar_hari_ini ?? 0} keluar</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-emerald-400 font-bold">+{stats?.qty_masuk_hari_ini ?? 0} masuk</span>
                        </div>
                    </div>
                </div>

                {/* Stok Kritis & Habis */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Peringatan Stok
                        </span>
                        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black font-mono text-rose-400">
                                {stats?.stok_habis ?? 0}
                            </span>
                            <span className="text-xs text-rose-300 font-semibold">Habis</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-2xl font-black font-mono text-amber-400">
                                {stats?.stok_menipis ?? 0}
                            </span>
                            <span className="text-xs text-amber-300 font-semibold">Menipis</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Perlu segera di-restok</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Aksi Pintar Cepat:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('kasir')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-300"
                    >
                        <ScanLine className="w-3.5 h-3.5 text-amber-400" />
                        <span>Mulai Scan Kasir</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('barang')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-300"
                    >
                        <PlusCircle className="w-3.5 h-3.5 text-sky-400" />
                        <span>Kelola Master Barang</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('transaksi')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-300"
                    >
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lihat Semua Riwayat</span>
                    </button>
                </div>
            </div>

            {/* Two-Column Grid: Stok Kritis & Transaksi Terbaru */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Barang Stok Kritis (Col 6) */}
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            <h2 className="font-bold text-white text-base">Barang Perlu Restok</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveTab('barang')}
                            className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                        >
                            <span>Lihat Semua</span>
                            <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-2.5 flex-1">
                        {!stats?.barang_kritis || stats.barang_kritis.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                                <p className="text-sm font-semibold text-emerald-400">
                                    Semua stok barang dalam kondisi aman!
                                </p>
                            </div>
                        ) : (
                            stats.barang_kritis.map((item) => (
                                <div
                                    key={item.kode_barang}
                                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-white">{item.nama_barang}</p>
                                        <p className="text-xs font-mono text-slate-400">
                                            Kode: {item.kode_barang}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                                                item.stok_saat_ini <= 0
                                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            }`}
                                        >
                                            {item.stok_saat_ini} pcs
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Transaksi Terbaru (Col 6) */}
                <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-400" />
                            <h2 className="font-bold text-white text-base">Aktivitas Scan Terbaru</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveTab('transaksi')}
                            className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                        >
                            <span>Semua Log</span>
                            <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="space-y-2.5 flex-1">
                        {!stats?.transaksi_terbaru || stats.transaksi_terbaru.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                <ScanLine className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm font-semibold text-slate-400">
                                    Belum ada transaksi tercatat.
                                </p>
                            </div>
                        ) : (
                            stats.transaksi_terbaru.map((trx) => (
                                <div
                                    key={trx.id}
                                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`p-2 rounded-lg ${
                                                trx.jenis_scan === 'keluar'
                                                    ? 'bg-rose-500/10 text-rose-400'
                                                    : 'bg-emerald-500/10 text-emerald-400'
                                            }`}
                                        >
                                            {trx.jenis_scan === 'keluar' ? (
                                                <ArrowDownRight className="w-4 h-4" />
                                            ) : (
                                                <ArrowUpRight className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                {trx.barang?.nama_barang || trx.kode_barang}
                                            </p>
                                            <p className="text-[11px] font-mono text-slate-400">
                                                {trx.kode_barang} • {formatTime(trx.tanggal_scan || trx.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right font-mono font-bold text-sm">
                                        <span
                                            className={
                                                trx.jenis_scan === 'keluar'
                                                    ? 'text-rose-400'
                                                    : 'text-emerald-400'
                                            }
                                        >
                                            {trx.jenis_scan === 'keluar' ? '-' : '+'}
                                            {trx.qty} pcs
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
