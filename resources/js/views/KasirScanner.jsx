import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { playBeep, playErrorSound, playSuccessSound } from '../utils/audio';
import {
    ScanLine,
    ArrowDownRight,
    ArrowUpRight,
    Check,
    AlertCircle,
    Package,
    RotateCcw,
    Trash2,
    Search,
    Plus,
    Minus,
    Zap,
    Sparkles
} from 'lucide-react';

export default function KasirScanner({ soundEnabled, addToast }) {
    const formatRupiah = (value) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(Number(value) || 0);

    const [barcode, setBarcode] = useState('');
    const [jenisScan, setJenisScan] = useState('keluar'); // 'keluar' atau 'masuk'
    const [qty, setQty] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [previewItem, setPreviewItem] = useState(null);
    const [isSearchingPreview, setIsSearchingPreview] = useState(false);

    // Quick product picker search
    const [showQuickPicker, setShowQuickPicker] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [quickSearch, setQuickSearch] = useState('');

    const inputRef = useRef(null);

    // Auto-focus barcode input
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSubmitting]);

    // Keep focus when clicking anywhere outside inputs
    useEffect(() => {
        const handleClick = (e) => {
            if (
                inputRef.current &&
                !['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(e.target.tagName)
            ) {
                inputRef.current.focus();
            }
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Live preview search when typing barcode
    useEffect(() => {
        const trimmed = barcode.trim();
        if (!trimmed) {
            setPreviewItem(null);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingPreview(true);
            try {
                const res = await api.get(`/barangs/lookup/${encodeURIComponent(trimmed)}`);
                if (res.success && res.data) {
                    setPreviewItem(res.data);
                }
            } catch (err) {
                setPreviewItem(null);
            } finally {
                setIsSearchingPreview(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [barcode]);

    // Load available products for quick picker modal
    useEffect(() => {
        if (showQuickPicker) {
            api.get('/barangs?all=true')
                .then((res) => {
                    if (res.success) setAvailableProducts(res.data || []);
                })
                .catch(() => {});
        }
    }, [showQuickPicker]);

    // Submit Scan
    const handleScanSubmit = async (e) => {
        if (e) e.preventDefault();
        const codeToScan = barcode.trim();

        if (!codeToScan) {
            if (soundEnabled) playErrorSound();
            addToast('Silakan scan atau masukkan kode barang terlebih dahulu!', 'warning');
            inputRef.current?.focus();
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.post('/transaksis', {
                kode_barang: codeToScan,
                jenis_scan: jenisScan,
                qty: parseInt(qty) || 1,
            });

            if (response.success) {
                if (soundEnabled) playBeep();

                const scannedData = {
                    id: response.data.id,
                    kode_barang: codeToScan,
                    nama_barang: response.barang?.nama_barang || codeToScan,
                    jenis_scan: jenisScan,
                    qty: parseInt(qty) || 1,
                    sisa_stok: response.barang?.stok_saat_ini ?? '-',
                    waktu: new Date().toLocaleTimeString('id-ID'),
                };

                setLastScanResult({
                    status: 'success',
                    message: response.message,
                    barang: response.barang,
                    qty: scannedData.qty,
                    jenis: jenisScan,
                });

                // Prepend to session history
                setSessionHistory((prev) => [scannedData, ...prev]);

                addToast(response.message, 'success');

                // Reset field & reset qty back to 1
                setBarcode('');
                setPreviewItem(null);
                setQty(1);
            }
        } catch (error) {
            if (soundEnabled) playErrorSound();

            const errMsg = error.message || 'Gagal memproses transaksi scan.';
            setLastScanResult({
                status: 'error',
                message: errMsg,
                kode: codeToScan,
            });
            addToast(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    };

    // Void / Batalkan Transaksi dari Session
    const handleVoidTransaction = async (transaksiId, index) => {
        if (!confirm('Batalkan transaksi ini dan kembalikan stoknya?')) return;

        try {
            const res = await api.delete(`/transaksis/${transaksiId}`);
            if (res.success) {
                if (soundEnabled) playSuccessSound();
                addToast(res.message, 'info');

                // Remove from session
                setSessionHistory((prev) => prev.filter((_, i) => i !== index));
            }
        } catch (err) {
            addToast(err.message || 'Gagal membatalkan transaksi.', 'error');
        }
    };

    // Quick select product from picker
    const selectQuickProduct = (p) => {
        setBarcode(p.kode_barang);
        setShowQuickPicker(false);
        inputRef.current?.focus();
    };

    const filteredQuickProducts = availableProducts.filter((p) => {
        const q = quickSearch.toLowerCase();
        return (
            p.kode_barang.toLowerCase().includes(q) ||
            p.nama_barang.toLowerCase().includes(q)
        );
    });

    // Summary calculation
    const totalPcsKeluar = sessionHistory
        .filter((item) => item.jenis_scan === 'keluar')
        .reduce((acc, curr) => acc + curr.qty, 0);

    const totalPcsMasuk = sessionHistory
        .filter((item) => item.jenis_scan === 'masuk')
        .reduce((acc, curr) => acc + curr.qty, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Top Bar Mode Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-400">Mode Operasi Transaksi:</span>
                    <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => {
                                setJenisScan('keluar');
                                inputRef.current?.focus();
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                jenisScan === 'keluar'
                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <ArrowDownRight className="w-4 h-4" />
                            <span>Barang Keluar (Kasir / Penjualan)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setJenisScan('masuk');
                                inputRef.current?.focus();
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                jenisScan === 'masuk'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            <span>Barang Masuk (Restok / Suplai)</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowQuickPicker(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    >
                        <Search className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pilih Barang Manual</span>
                    </button>
                    {sessionHistory.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('Bersihkan riwayat tampilan sesi scan ini? (Data transaksi tetap tersimpan)')) {
                                    setSessionHistory([]);
                                    setLastScanResult(null);
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 text-xs transition-colors"
                            title="Bersihkan log sesi"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Reset Sesi</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Scanner Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Scanner Input & Controls (Col 7) */}
                <div className="lg:col-span-7 space-y-6">
                    <div
                        className={`bg-slate-900 border rounded-2xl p-6 shadow-2xl transition-all relative overflow-hidden ${
                            jenisScan === 'keluar'
                                ? 'border-rose-500/40 shadow-rose-950/20'
                                : 'border-emerald-500/40 shadow-emerald-950/20'
                        }`}
                    >
                        {/* Background Accent glow */}
                        <div
                            className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none ${
                                jenisScan === 'keluar' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                        />

                        <form onSubmit={handleScanSubmit} className="space-y-5 relative">
                            {/* Header Scan */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`p-2 rounded-lg ${
                                            jenisScan === 'keluar'
                                                ? 'bg-rose-500/10 text-rose-400'
                                                : 'bg-emerald-500/10 text-emerald-400'
                                        }`}
                                    >
                                        <ScanLine className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">
                                        Scan Barcode Barang
                                    </h2>
                                </div>
                                <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                                    Tekan <strong className="text-amber-400">ENTER</strong> untuk proses
                                </span>
                            </div>

                            {/* Barcode Input Big Box */}
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    placeholder="Arahkan scanner ke barcode atau ketik kode..."
                                    disabled={isSubmitting}
                                    className={`w-full bg-slate-950 border-2 rounded-xl px-5 py-4 text-xl sm:text-2xl font-mono text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner ${
                                        jenisScan === 'keluar'
                                            ? 'border-slate-700 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                                            : 'border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'
                                    }`}
                                />
                                {barcode && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBarcode('');
                                            setPreviewItem(null);
                                            inputRef.current?.focus();
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white px-2 py-1 rounded-md text-xs bg-slate-800"
                                    >
                                        Bersihkan
                                    </button>
                                )}
                            </div>

                            {/* Qty & Multiplier Control */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                                        Jumlah (Qty) per Scan:
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setQty(Math.max(1, (parseInt(qty) || 1) - 1))}
                                            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            value={qty}
                                            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-24 text-center bg-slate-950 border border-slate-700 rounded-lg py-2 font-mono text-lg font-bold text-white focus:outline-none focus:border-amber-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setQty((parseInt(qty) || 1) + 1)}
                                            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-lg"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                                        Shortcut Grosir (Cepat):
                                    </label>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {[1, 5, 10, 12, 24, 50].map((val) => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => {
                                                    setQty(val);
                                                    inputRef.current?.focus();
                                                }}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                                                    qty === val
                                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                            >
                                                +{val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !barcode.trim()}
                                className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                                    jenisScan === 'keluar'
                                        ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                                }`}
                            >
                                <Zap className="w-5 h-5 fill-current" />
                                <span className="text-black">
                                    {isSubmitting
                                        ? 'Menyimpan Transaksi...'
                                        : jenisScan === 'keluar'
                                        ? `Keluarkan ${qty} Pcs (Kurangi Stok)`
                                        : `Masukkan ${qty} Pcs (Tambah Stok)`}
                                </span>
                            </button>
                        </form>
                    </div>

                    {/* Live Preview Box when typing or scanning */}
                    {previewItem && (
                        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Package className="w-4 h-4 text-sky-400" />
                                    Preview Data Barang
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                    Kode: <strong className="text-slate-200">{previewItem.kode_barang}</strong>
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{previewItem.nama_barang}</h3>
                                    {previewItem.keterangan && (
                                        <p className="text-xs text-slate-400 mt-1">{previewItem.keterangan}</p>
                                    )}
                                    <p className="text-sm font-bold text-amber-400 mt-2">
                                        Harga: {formatRupiah(previewItem.harga)}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs text-slate-400 block mb-0.5">Stok Saat Ini</span>
                                    <span
                                        className={`inline-block px-3 py-1 rounded-xl text-lg font-mono font-black ${
                                            previewItem.stok_saat_ini <= 0
                                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                : previewItem.stok_saat_ini <= 5
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}
                                    >
                                        {previewItem.stok_saat_ini} pcs
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Last Scan Feedback Alert */}
                    {lastScanResult && (
                        <div
                            className={`p-4 rounded-xl border flex items-start gap-3 ${
                                lastScanResult.status === 'success'
                                    ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-200'
                                    : 'bg-rose-950/60 border-rose-700/50 text-rose-200'
                            }`}
                        >
                            {lastScanResult.status === 'success' ? (
                                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div className="text-sm">
                                <p className="font-semibold">{lastScanResult.message}</p>
                                {lastScanResult.barang && (
                                    <p className="text-xs opacity-80 mt-1 font-mono">
                                        {lastScanResult.barang.nama_barang} | Sisa Stok:{' '}
                                        {lastScanResult.barang.stok_saat_ini} unit
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Session Scanned List / Cart Log (Col 5) */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col min-h-[460px]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-amber-400" />
                                <h3 className="font-bold text-white text-sm">
                                    Log Scan Sesi Ini ({sessionHistory.length})
                                </h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono">
                                <span className="text-rose-400 font-bold">-{totalPcsKeluar} Keluar</span>
                                <span className="text-emerald-400 font-bold">+{totalPcsMasuk} Masuk</span>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
                            {sessionHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 text-center">
                                    <ScanLine className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
                                    <p className="text-sm font-medium">Belum ada barang di-scan pada sesi ini</p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Scan barcode untuk mulai mencatat transaksi kasir
                                    </p>
                                </div>
                            ) : (
                                sessionHistory.map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span
                                                className={`w-2 h-8 rounded-full shrink-0 ${
                                                    item.jenis_scan === 'keluar'
                                                        ? 'bg-rose-500'
                                                        : 'bg-emerald-500'
                                                }`}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">
                                                    {item.nama_barang}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                                                    <span>{item.kode_barang}</span>
                                                    <span>•</span>
                                                    <span>{item.waktu}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right font-mono">
                                                <span
                                                    className={`text-sm font-bold block ${
                                                        item.jenis_scan === 'keluar'
                                                            ? 'text-rose-400'
                                                            : 'text-emerald-400'
                                                    }`}
                                                >
                                                    {item.jenis_scan === 'keluar' ? '-' : '+'}
                                                    {item.qty} pcs
                                                </span>
                                                <span className="text-[10px] text-slate-500 block">
                                                    Sisa: {item.sisa_stok}
                                                </span>
                                            </div>

                                            {item.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleVoidTransaction(item.id, idx)}
                                                    title="Batalkan transaksi ini (Rollback stok)"
                                                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer summary */}
                        {sessionHistory.length > 0 && (
                            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                <span>Total: {sessionHistory.length} kali scan</span>
                                <span className="font-semibold text-slate-200">
                                    Net Perubahan:{' '}
                                    <span
                                        className={
                                            totalPcsMasuk - totalPcsKeluar >= 0
                                                ? 'text-emerald-400'
                                                : 'text-rose-400'
                                        }
                                    >
                                        {totalPcsMasuk - totalPcsKeluar > 0 ? '+' : ''}
                                        {totalPcsMasuk - totalPcsKeluar} unit
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Product Picker Modal */}
            {showQuickPicker && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                        onClick={() => setShowQuickPicker(false)}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div
                            className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                                <h3 className="font-bold text-white text-base flex items-center gap-2">
                                    <Package className="w-5 h-5 text-amber-400" />
                                    Pilih Barang Secara Manual
                                </h3>
                                <button
                                    onClick={() => setShowQuickPicker(false)}
                                    className="text-slate-400 hover:text-white text-sm"
                                >
                                    Tutup (ESC)
                                </button>
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={quickSearch}
                                        onChange={(e) => setQuickSearch(e.target.value)}
                                        placeholder="Cari kode atau nama barang..."
                                        autoFocus
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                                    />
                                </div>

                                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                                    {filteredQuickProducts.length === 0 ? (
                                        <p className="text-center text-sm text-slate-500 py-8">
                                            Tidak ada barang yang cocok.
                                        </p>
                                    ) : (
                                        filteredQuickProducts.map((p) => (
                                            <button
                                                key={p.kode_barang}
                                                type="button"
                                                onClick={() => selectQuickProduct(p)}
                                                className="w-full text-left p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-colors group"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-amber-300">
                                                        {p.nama_barang}
                                                    </p>
                                                    <span className="text-xs font-mono text-slate-400">
                                                        Kode: {p.kode_barang}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-slate-400 block">Stok</span>
                                                    <span
                                                        className={`text-sm font-mono font-bold ${
                                                            p.stok_saat_ini <= 0
                                                                ? 'text-rose-400'
                                                                : p.stok_saat_ini <= 5
                                                                ? 'text-amber-400'
                                                                : 'text-emerald-400'
                                                        }`}
                                                    >
                                                        {p.stok_saat_ini} pcs
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
