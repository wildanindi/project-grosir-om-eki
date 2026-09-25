import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import { playSuccessSound, playErrorSound } from '../utils/audio';
import {
    Package,
    Plus,
    Search,
    Edit2,
    Trash2,
    Barcode,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RefreshCw,
    ScanLine
} from 'lucide-react';

export default function MasterBarang({ soundEnabled, addToast, setActiveTab }) {
    const formatRupiah = (value) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(Number(value) || 0);

    const [barangs, setBarangs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStok, setFilterStok] = useState(''); // '', 'tersedia', 'menipis', 'habis'
    const [sortBy, setSortBy] = useState('nama_barang');
    const [sortOrder, setSortOrder] = useState('asc');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedBarang, setSelectedBarang] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        kode_barang: '',
        nama_barang: '',
        harga: 0,
        stok_saat_ini: 0,
        keterangan: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Barangs
    const fetchBarangs = async () => {
        setLoading(true);
        try {
            const params = {
                all: true,
                search: search || undefined,
                filter_stok: filterStok || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
            };
            const res = await api.get('/barangs', { params });
            if (res.success) {
                setBarangs(res.data || []);
            }
        } catch (err) {
            addToast('Gagal memuat data barang.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBarangs();
        }, 300);
        return () => clearTimeout(timer);
    }, [search, filterStok, sortBy, sortOrder]);

    // Open Create Modal
    const handleOpenCreate = () => {
        setFormData({
            kode_barang: '',
            nama_barang: '',
            harga: 0,
            stok_saat_ini: 0,
            keterangan: '',
        });
        setFormErrors({});
        setShowCreateModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (barang) => {
        setSelectedBarang(barang);
        setFormData({
            kode_barang: barang.kode_barang,
            nama_barang: barang.nama_barang,
            harga: Number(barang.harga) || 0,
            stok_saat_ini: barang.stok_saat_ini,
            keterangan: barang.keterangan || '',
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Open Delete Modal
    const handleOpenDelete = (barang) => {
        setSelectedBarang(barang);
        setShowDeleteModal(true);
    };

    // Generate random barcode
    const generateRandomBarcode = () => {
        const randomNum = Math.floor(10000000 + Math.random() * 90000000).toString();
        setFormData((prev) => ({ ...prev, kode_barang: randomNum }));
    };

    // Save New Barang
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setFormErrors({});

        try {
            const res = await api.post('/barangs', {
                ...formData,
                harga: Number(formData.harga) || 0,
                stok_saat_ini: Number(formData.stok_saat_ini) || 0,
            });
            if (res.success) {
                if (soundEnabled) playSuccessSound();
                addToast(res.message, 'success');
                setShowCreateModal(false);
                fetchBarangs();
            }
        } catch (err) {
            if (soundEnabled) playErrorSound();
            if (err.errors) {
                setFormErrors(err.errors);
            }
            addToast(err.message || 'Gagal menyimpan barang.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Update Existing Barang
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBarang) return;
        setIsSaving(true);
        setFormErrors({});

        try {
            const res = await api.put(`/barangs/${encodeURIComponent(selectedBarang.kode_barang)}`, {
                nama_barang: formData.nama_barang,
                harga: Number(formData.harga) || 0,
                stok_saat_ini: Number(formData.stok_saat_ini) || 0,
                keterangan: formData.keterangan,
            });
            if (res.success) {
                if (soundEnabled) playSuccessSound();
                addToast(res.message, 'success');
                setShowEditModal(false);
                fetchBarangs();
            }
        } catch (err) {
            if (soundEnabled) playErrorSound();
            if (err.errors) {
                setFormErrors(err.errors);
            }
            addToast(err.message || 'Gagal memperbarui barang.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Barang
    const handleDeleteSubmit = async () => {
        if (!selectedBarang) return;
        setIsSaving(true);

        try {
            const res = await api.delete(`/barangs/${encodeURIComponent(selectedBarang.kode_barang)}`);
            if (res.success) {
                if (soundEnabled) playSuccessSound();
                addToast(res.message, 'info');
                setShowDeleteModal(false);
                fetchBarangs();
            }
        } catch (err) {
            if (soundEnabled) playErrorSound();
            addToast(err.message || 'Gagal menghapus barang.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
                        <Package className="w-7 h-7 text-sky-400" />
                        <span>Master Data Barang</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Kelola informasi produk, stok inventaris, dan barcode barang grosir.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={fetchBarangs}
                        disabled={loading}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        title="Segarkan Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 transition-all transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Barang Baru</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berdasarkan kode barcode, nama barang, atau keterangan..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Filter Stok Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => setFilterStok('')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                filterStok === ''
                                    ? 'bg-slate-800 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStok('tersedia')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                filterStok === 'tersedia'
                                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Aman (&gt;5)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStok('menipis')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                filterStok === 'menipis'
                                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Menipis (1-5)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStok('habis')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                filterStok === 'habis'
                                    ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Habis (0)
                        </button>
                    </div>

                    {/* Sort Order Selector */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:border-sky-500"
                        >
                            <option value="nama_barang">Urut Nama</option>
                            <option value="stok_saat_ini">Urut Stok</option>
                            <option value="kode_barang">Urut Barcode</option>
                            <option value="created_at">Urut Terbaru</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
                            title="Balik Urutan"
                        >
                            {sortOrder.toUpperCase()}
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase font-bold text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Kode Barcode</th>
                                <th className="px-6 py-4">Nama Barang</th>
                                <th className="px-6 py-4 text-right">Harga</th>
                                <th className="px-6 py-4 text-center">Stok Saat Ini</th>
                                <th className="px-6 py-4">Keterangan</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                                        <span>Memuat daftar barang...</span>
                                    </td>
                                </tr>
                            ) : barangs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                        <p className="font-semibold text-slate-400">Tidak ada data barang ditemukan</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Coba ubah kata kunci pencarian atau tambah barang baru.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                barangs.map((item) => (
                                    <tr
                                        key={item.kode_barang}
                                        className="hover:bg-slate-800/40 transition-colors group"
                                    >
                                        {/* Kode Barcode */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-mono">
                                                <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                                    <Barcode className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-white tracking-wide">
                                                    {item.kode_barang}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Nama Barang */}
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white text-base">
                                                {item.nama_barang}
                                            </div>
                                        </td>

                                        {/* Harga */}
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-mono font-bold text-amber-400">
                                                {formatRupiah(item.harga)}
                                            </span>
                                        </td>

                                        {/* Stok Status Badge */}
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                                                    item.stok_saat_ini <= 0
                                                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                                        : item.stok_saat_ini <= 5
                                                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                }`}
                                            >
                                                {item.stok_saat_ini <= 0 ? (
                                                    <XCircle className="w-3.5 h-3.5" />
                                                ) : item.stok_saat_ini <= 5 ? (
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                ) : (
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                )}
                                                <span>{item.stok_saat_ini} pcs</span>
                                            </span>
                                        </td>

                                        {/* Keterangan */}
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-slate-400 line-clamp-2">
                                                {item.keterangan || '-'}
                                            </span>
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                                    title="Edit Barang"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDelete(item)}
                                                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-400 transition-colors"
                                                    title="Hapus Barang"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Menampilkan {barangs.length} produk</span>
                    <span className="font-semibold text-slate-300">
                        Total Seluruh Stok:{' '}
                        {barangs.reduce((acc, curr) => acc + (parseInt(curr.stok_saat_ini) || 0), 0)} unit
                    </span>
                </div>
            </div>

            {/* Modal Tambah Barang */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => !isSaving && setShowCreateModal(false)}
                title="Tambah Barang Baru"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-300">
                                Kode Barcode (Primary Key) <span className="text-rose-400">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={generateRandomBarcode}
                                className="text-[11px] text-amber-400 hover:underline font-mono"
                            >
                                + Generate Acak
                            </button>
                        </div>
                        <input
                            type="text"
                            value={formData.kode_barang}
                            onChange={(e) => setFormData({ ...formData, kode_barang: e.target.value })}
                            placeholder="Contoh: 899123456789 atau scan barcode..."
                            required
                            autoFocus
                            className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 ${
                                formErrors.kode_barang ? 'border-rose-500' : 'border-slate-700'
                            }`}
                        />
                        {formErrors.kode_barang && (
                            <p className="text-xs text-rose-400 mt-1">{formErrors.kode_barang[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Nama Barang <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nama_barang}
                            onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                            placeholder="Contoh: Gula Pasir 1kg"
                            required
                            className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 ${
                                formErrors.nama_barang ? 'border-rose-500' : 'border-slate-700'
                            }`}
                        />
                        {formErrors.nama_barang && (
                            <p className="text-xs text-rose-400 mt-1">{formErrors.nama_barang[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Harga Jual <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.harga}
                            onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                            required
                            placeholder="Contoh: 15000"
                            className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-sky-500 ${
                                formErrors.harga ? 'border-rose-500' : 'border-slate-700'
                            }`}
                        />
                        {formErrors.harga && <p className="text-xs text-rose-400 mt-1">{formErrors.harga[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Stok Awal <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.stok_saat_ini}
                            onChange={(e) =>
                                setFormData({ ...formData, stok_saat_ini: parseInt(e.target.value) || 0 })
                            }
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Keterangan / Catatan Tambahan (Opsional)
                        </label>
                        <textarea
                            value={formData.keterangan}
                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                            placeholder="Contoh: Dus isi 24 pcs, supplier ABC"
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Barang'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Edit Barang */}
            <Modal
                isOpen={showEditModal}
                onClose={() => !isSaving && setShowEditModal(false)}
                title={`Edit Barang: ${selectedBarang?.nama_barang}`}
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                            Kode Barcode (Tidak dapat diubah)
                        </label>
                        <input
                            type="text"
                            value={formData.kode_barang}
                            disabled
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-400 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Nama Barang <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nama_barang}
                            onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Harga Jual <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.harga}
                            onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                            required
                            className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-sky-500 ${
                                formErrors.harga ? 'border-rose-500' : 'border-slate-700'
                            }`}
                        />
                        {formErrors.harga && <p className="text-xs text-rose-400 mt-1">{formErrors.harga[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Stok Saat Ini <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.stok_saat_ini}
                            onChange={(e) =>
                                setFormData({ ...formData, stok_saat_ini: parseInt(e.target.value) || 0 })
                            }
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Keterangan / Catatan
                        </label>
                        <textarea
                            value={formData.keterangan}
                            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Menyimpan...' : 'Perbarui Barang'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !isSaving && setShowDeleteModal(false)}
                title="Hapus Barang"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-rose-200">
                            <p className="font-bold">Apakah Anda yakin ingin menghapus barang ini?</p>
                            <p className="text-xs text-rose-300/80 mt-1">
                                Tindakan ini juga akan menghapus data transaksi yang terkait dengan kode barcode ini.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm">
                        <p className="text-slate-400 text-xs">Nama Barang:</p>
                        <p className="font-bold text-white text-base">{selectedBarang?.nama_barang}</p>
                        <p className="text-slate-400 text-xs mt-2">Kode Barcode:</p>
                        <p className="font-mono text-amber-400 font-semibold">{selectedBarang?.kode_barang}</p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isSaving}
                            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Menghapus...' : 'Ya, Hapus Barang'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
