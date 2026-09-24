import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { playSuccessSound, playErrorSound } from '../utils/audio';
import {
    History,
    Search,
    ArrowDownRight,
    ArrowUpRight,
    Trash2,
    Calendar,
    RefreshCw,
    AlertTriangle,
    Printer,
    FileSpreadsheet,
    Barcode
} from 'lucide-react';

export default function RiwayatTransaksi({ soundEnabled, addToast }) {
    const [transaksis, setTransaksis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [jenisScan, setJenisScan] = useState(''); // '', 'masuk', 'keluar'
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTransaksi, setSelectedTransaksi] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTransaksis = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                per_page: 25,
                search: search || undefined,
                jenis_scan: jenisScan || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            };

            const res = await api.get('/transaksis', { params });
            if (res.success) {
                setTransaksis(res.data || []);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            }
        } catch (err) {
            addToast('Gagal memuat riwayat transaksi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransaksis(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, jenisScan, dateFrom, dateTo]);

    // Format DateTime Indonesia
    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Open Delete confirmation
    const handleOpenDelete = (trx) => {
        setSelectedTransaksi(trx);
        setShowDeleteModal(true);
    };

    // Execute delete & stock rollback
    const handleDeleteSubmit = async () => {
        if (!selectedTransaksi) return;
        setIsDeleting(true);

        try {
            const res = await api.delete(`/transaksis/${selectedTransaksi.id}`);
            if (res.success) {
                if (soundEnabled) playSuccessSound();
                addToast(res.message, 'info');
                setShowDeleteModal(false);
                fetchTransaksis(pagination.current_page);
            }
        } catch (err) {
            if (soundEnabled) playErrorSound();
            addToast(err.message || 'Gagal menghapus transaksi.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Print table preview
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                        <History className="w-7 h-7 text-emerald-400" />
                        <span>Riwayat Transaksi Scan</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Catatan lengkap aktivitas scan kasir keluar (penjualan) dan masuk (restok).
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => fetchTransaksis(pagination.current_page)}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        title="Segarkan Riwayat"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors"
                    >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span>Cetak Laporan</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Search */}
                    <div className="md:col-span-5 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari kode barcode atau nama barang..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Filter Jenis Scan */}
                    <div className="md:col-span-4 flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => setJenisScan('')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                jenisScan === '' ? 'bg-slate-800 text-white shadow' : 'text-slate-400'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => setJenisScan('keluar')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                                jenisScan === 'keluar'
                                    ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                                    : 'text-slate-400'
                            }`}
                        >
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>Keluar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setJenisScan('masuk')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                                jenisScan === 'masuk'
                                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                    : 'text-slate-400'
                            }`}
                        >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Masuk</span>
                        </button>
                    </div>

                    {/* Filter Dates */}
                    <div className="md:col-span-3 flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            title="Dari Tanggal"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-500 text-xs">-</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            title="Sampai Tanggal"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Transaksi Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase font-bold text-slate-400">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Waktu Scan</th>
                                <th className="px-6 py-4">Kode Barcode</th>
                                <th className="px-6 py-4">Nama Barang</th>
                                <th className="px-6 py-4 text-center">Jenis Transaksi</th>
                                <th className="px-6 py-4 text-center">Qty</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                                        <span>Memuat riwayat transaksi...</span>
                                    </td>
                                </tr>
                            ) : transaksis.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                        <p className="font-semibold text-slate-400">Tidak ada transaksi ditemukan</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Coba sesuaikan filter atau lakukan scan kasir baru.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                transaksis.map((trx) => (
                                    <tr
                                        key={trx.id}
                                        className="hover:bg-slate-800/40 transition-colors"
                                    >
                                        {/* ID */}
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            #{trx.id}
                                        </td>

                                        {/* Waktu */}
                                        <td className="px-6 py-4 text-xs font-mono text-slate-300">
                                            {formatDateTime(trx.tanggal_scan || trx.created_at)}
                                        </td>

                                        {/* Barcode */}
                                        <td className="px-6 py-4 font-mono font-bold text-white">
                                            <div className="flex items-center gap-1.5">
                                                <Barcode className="w-4 h-4 text-slate-500" />
                                                <span>{trx.kode_barang}</span>
                                            </div>
                                        </td>

                                        {/* Nama Barang */}
                                        <td className="px-6 py-4 font-semibold text-white">
                                            {trx.barang?.nama_barang || (
                                                <span className="text-slate-500 italic">Barang Terhapus</span>
                                            )}
                                        </td>

                                        {/* Jenis Scan */}
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                    trx.jenis_scan === 'keluar'
                                                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                }`}
                                            >
                                                {trx.jenis_scan === 'keluar' ? (
                                                    <>
                                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                                        <span>Keluar (Kasir)</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                        <span>Masuk (Restok)</span>
                                                    </>
                                                )}
                                            </span>
                                        </td>

                                        {/* Qty */}
                                        <td className="px-6 py-4 text-center font-mono font-bold text-base">
                                            <span
                                                className={
                                                    trx.jenis_scan === 'keluar'
                                                        ? 'text-rose-400'
                                                        : 'text-emerald-400'
                                                }
                                            >
                                                {trx.jenis_scan === 'keluar' ? '-' : '+'}
                                                {trx.qty}
                                            </span>
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDelete(trx)}
                                                className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                                                title="Batalkan Transaksi (Kembalikan Stok)"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>
                        Menampilkan {transaksis.length} dari {pagination.total} transaksi
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={pagination.current_page <= 1 || loading}
                            onClick={() => fetchTransaksis(pagination.current_page - 1)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                        >
                            Sebelumnya
                        </button>
                        <span className="font-mono px-2">
                            Hal {pagination.current_page} / {pagination.last_page || 1}
                        </span>
                        <button
                            type="button"
                            disabled={pagination.current_page >= pagination.last_page || loading}
                            onClick={() => fetchTransaksis(pagination.current_page + 1)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Batalkan Transaksi */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Batalkan Transaksi"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-200">
                            <p className="font-bold">Apakah Anda ingin membatalkan transaksi ini?</p>
                            <p className="text-xs text-amber-300/80 mt-1">
                                Stok barang akan otomatis dikembalikan ke kondisi sebelum transaksi dilakukan (Rollback).
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm space-y-1">
                        <p className="text-slate-400 text-xs">ID Transaksi: #{selectedTransaksi?.id}</p>
                        <p className="font-bold text-white text-base">
                            {selectedTransaksi?.barang?.nama_barang || selectedTransaksi?.kode_barang}
                        </p>
                        <p className="text-xs font-mono text-slate-400">
                            Jenis: <strong className="text-white uppercase">{selectedTransaksi?.jenis_scan}</strong> ({selectedTransaksi?.qty} unit)
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
                        >
                            Tutup
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isDeleting}
                            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                        >
                            {isDeleting ? 'Membatalkan...' : 'Ya, Batalkan Transaksi'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
