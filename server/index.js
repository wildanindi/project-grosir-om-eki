import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import pg from 'pg';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//
const app = express();
const port = Number(process.env.PORT || process.env.NODE_SERVER_PORT || 3000);
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(currentDirectory, '../dist');

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

app.use(cors());
app.use(express.json());

const adminUsername = process.env.AUTH_USERNAME || 'admin';
const adminPassword = process.env.AUTH_PASSWORD || 'grosireki123';
const adminPasswordHash = scryptSync(adminPassword, 'grosir-eki-auth', 64);
const authTokens = new Set();

const asyncRoute = (handler) => (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

const sendValidationError = (res, errors) => res.status(422).json({
    success: false,
    message: 'Data yang dikirim tidak valid.',
    errors,
});

const positiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const barangColumns = 'kode_barang, nama_barang, harga, stok_saat_ini, keterangan, created_at, updated_at';

function buildBarangFilters(query) {
    const conditions = [];
    const values = [];

    if (query.search) {
        conditions.push(`(kode_barang ILIKE $${values.length + 1} OR nama_barang ILIKE $${values.length + 2} OR keterangan ILIKE $${values.length + 3})`);
        const search = `%${query.search}%`;
        values.push(search, search, search);
    }

    if (query.filter_stok === 'habis') conditions.push('stok_saat_ini <= 0');
    if (query.filter_stok === 'menipis') conditions.push('stok_saat_ini > 0 AND stok_saat_ini <= 5');
    if (query.filter_stok === 'tersedia') conditions.push('stok_saat_ini > 5');

    return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values };
}

const queryRows = async (text, values = []) => (await pool.query(text, values)).rows;

function formatTransaction(row) {
    const {
        barang_kode,
        barang_nama,
        barang_harga,
        barang_stok,
        barang_keterangan,
        barang_created_at,
        barang_updated_at,
        ...transaction
    } = row;

    return {
        ...transaction,
        barang: barang_kode ? {
            kode_barang: barang_kode,
            nama_barang: barang_nama,
            harga: barang_harga,
            stok_saat_ini: barang_stok,
            keterangan: barang_keterangan,
            created_at: barang_created_at,
            updated_at: barang_updated_at,
        } : null,
    };
}

const transactionSelect = `
    t.id, t.kode_barang, t.jenis_scan, t.qty, t.tanggal_scan, t.created_at, t.updated_at,
    b.kode_barang AS barang_kode, b.nama_barang AS barang_nama, b.harga AS barang_harga,
    b.stok_saat_ini AS barang_stok, b.keterangan AS barang_keterangan,
    b.created_at AS barang_created_at, b.updated_at AS barang_updated_at
`;

app.get('/api/health', asyncRoute(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'Node.js API aktif.' });
}));

app.get('/api/barangs', asyncRoute(async (req, res) => {
    const { where, values } = buildBarangFilters(req.query);
    const allowedSorts = ['kode_barang', 'nama_barang', 'stok_saat_ini', 'created_at'];
    const sortBy = allowedSorts.includes(req.query.sort_by) ? req.query.sort_by : 'nama_barang';
    const sortOrder = req.query.sort_order === 'desc' ? 'DESC' : 'ASC';
    const rows = await queryRows(`SELECT ${barangColumns} FROM barangs ${where} ORDER BY ${sortBy} ${sortOrder}`, values);

    if (req.query.all === 'true' || req.query.all === '1') {
        return res.json({ success: true, data: rows });
    }

    const perPage = Math.min(100, positiveInteger(req.query.per_page, 15));
    const currentPage = positiveInteger(req.query.page, 1);
    const countRows = await queryRows(`SELECT COUNT(*) AS total FROM barangs ${where}`, values);
    const total = Number(countRows[0].total);
    const paginationValues = [...values, perPage, (currentPage - 1) * perPage];
    const paginatedRows = await queryRows(
        `SELECT ${barangColumns} FROM barangs ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT $${paginationValues.length - 1} OFFSET $${paginationValues.length}`,
        paginationValues,
    );

    res.json({
        success: true,
        data: paginatedRows,
        pagination: { total, per_page: perPage, current_page: currentPage, last_page: Math.max(1, Math.ceil(total / perPage)) },
    });
}));

app.get('/api/barangs/lookup/:kode_barang', asyncRoute(async (req, res) => {
    const rows = await queryRows(`SELECT ${barangColumns} FROM barangs WHERE kode_barang = $1 LIMIT 1`, [req.params.kode_barang]);
    if (!rows.length) return res.status(404).json({ success: false, message: `Barang dengan kode '${req.params.kode_barang}' tidak ditemukan.` });
    res.json({ success: true, data: rows[0] });
}));

app.post('/api/barangs', asyncRoute(async (req, res) => {
    const { kode_barang, nama_barang, harga, stok_saat_ini, keterangan = null } = req.body;
    const errors = {};
    if (!kode_barang || typeof kode_barang !== 'string' || kode_barang.length > 50) errors.kode_barang = ['Kode barang wajib diisi dan maksimal 50 karakter.'];
    if (!nama_barang || typeof nama_barang !== 'string' || nama_barang.length > 100) errors.nama_barang = ['Nama barang wajib diisi dan maksimal 100 karakter.'];
    if (!Number.isFinite(harga) || harga < 0) errors.harga = ['Harga harus berupa angka nol atau lebih.'];
    if (!Number.isInteger(stok_saat_ini)) errors.stok_saat_ini = ['Stok harus berupa bilangan bulat.'];
    if (Object.keys(errors).length) return sendValidationError(res, errors);

    try {
        await pool.query('INSERT INTO barangs (kode_barang, nama_barang, harga, stok_saat_ini, keterangan, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())', [kode_barang, nama_barang, harga, stok_saat_ini, keterangan]);
    } catch (error) {
        if (error.code === '23505') return sendValidationError(res.status(409), { kode_barang: ['Kode barang sudah digunakan.'] });
        throw error;
    }
    const rows = await queryRows(`SELECT ${barangColumns} FROM barangs WHERE kode_barang = $1`, [kode_barang]);
    res.status(201).json({ success: true, message: 'Barang berhasil ditambahkan.', data: rows[0] });
}));

app.put('/api/barangs/:kode_barang', asyncRoute(async (req, res) => {
    const { nama_barang, harga, stok_saat_ini, keterangan = null } = req.body;
    const errors = {};
    if (!nama_barang || typeof nama_barang !== 'string' || nama_barang.length > 100) errors.nama_barang = ['Nama barang wajib diisi dan maksimal 100 karakter.'];
    if (!Number.isFinite(harga) || harga < 0) errors.harga = ['Harga harus berupa angka nol atau lebih.'];
    if (!Number.isInteger(stok_saat_ini)) errors.stok_saat_ini = ['Stok harus berupa bilangan bulat.'];
    if (Object.keys(errors).length) return sendValidationError(res, errors);

    const result = await pool.query('UPDATE barangs SET nama_barang = $1, harga = $2, stok_saat_ini = $3, keterangan = $4, updated_at = NOW() WHERE kode_barang = $5', [nama_barang, harga, stok_saat_ini, keterangan, req.params.kode_barang]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'Barang tidak ditemukan.' });
    const rows = await queryRows(`SELECT ${barangColumns} FROM barangs WHERE kode_barang = $1`, [req.params.kode_barang]);
    res.json({ success: true, message: 'Data barang berhasil diperbarui.', data: rows[0] });
}));

app.delete('/api/barangs/:kode_barang', asyncRoute(async (req, res) => {
    const result = await pool.query('DELETE FROM barangs WHERE kode_barang = $1', [req.params.kode_barang]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'Barang tidak ditemukan.' });
    res.json({ success: true, message: 'Barang berhasil dihapus.' });
}));

app.get('/api/transaksis', asyncRoute(async (req, res) => {
    const conditions = [];
    const values = [];
    if (req.query.search) {
        conditions.push(`(t.kode_barang ILIKE $${values.length + 1} OR b.nama_barang ILIKE $${values.length + 2})`);
        values.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }
    if (['masuk', 'keluar'].includes(req.query.jenis_scan)) { conditions.push(`t.jenis_scan = $${values.length + 1}`); values.push(req.query.jenis_scan); }
    if (req.query.date_from) { conditions.push(`DATE(t.tanggal_scan) >= $${values.length + 1}`); values.push(req.query.date_from); }
    if (req.query.date_to) { conditions.push(`DATE(t.tanggal_scan) <= $${values.length + 1}`); values.push(req.query.date_to); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const order = 'ORDER BY t.id DESC';

    if (req.query.all === 'true' || req.query.all === '1') {
        const rows = await queryRows(`SELECT ${transactionSelect} FROM transaksis t LEFT JOIN barangs b ON b.kode_barang = t.kode_barang ${where} ${order}`, values);
        return res.json({ success: true, data: rows.map(formatTransaction) });
    }

    const perPage = Math.min(100, positiveInteger(req.query.per_page, 20));
    const currentPage = positiveInteger(req.query.page, 1);
    const countRows = await queryRows(`SELECT COUNT(*) AS total FROM transaksis t LEFT JOIN barangs b ON b.kode_barang = t.kode_barang ${where}`, values);
    const total = Number(countRows[0].total);
    const paginationValues = [...values, perPage, (currentPage - 1) * perPage];
    const rows = await queryRows(`SELECT ${transactionSelect} FROM transaksis t LEFT JOIN barangs b ON b.kode_barang = t.kode_barang ${where} ${order} LIMIT $${paginationValues.length - 1} OFFSET $${paginationValues.length}`, paginationValues);
    res.json({ success: true, data: rows.map(formatTransaction), pagination: { total, per_page: perPage, current_page: currentPage, last_page: Math.max(1, Math.ceil(total / perPage)) } });
}));

app.post('/api/transaksis', asyncRoute(async (req, res) => {
    const { kode_barang, jenis_scan, qty } = req.body;
    if (!kode_barang || !['masuk', 'keluar'].includes(jenis_scan) || !Number.isInteger(qty) || qty < 1) {
        return sendValidationError(res, { transaksi: ['Kode barang, jenis scan, dan qty yang valid wajib diisi.'] });
    }

    const connection = await pool.connect();
    try {
        await connection.query('BEGIN');
        const barangResult = await connection.query('SELECT * FROM barangs WHERE kode_barang = $1 FOR UPDATE', [kode_barang]);
        const barangRows = barangResult.rows;
        if (!barangRows.length) {
            await connection.query('ROLLBACK');
            return res.status(422).json({ success: false, message: 'Barang tidak ditemukan.' });
        }
        const barang = barangRows[0];
        if (jenis_scan === 'keluar' && barang.stok_saat_ini <= 0 && req.body.allow_negative !== true) {
            await connection.query('ROLLBACK');
            return res.status(422).json({ success: false, message: `Stok '${barang.nama_barang}' habis! (Stok saat ini: ${barang.stok_saat_ini}).`, barang });
        }
        const change = jenis_scan === 'masuk' ? qty : -qty;
        await connection.query('UPDATE barangs SET stok_saat_ini = stok_saat_ini + $1, updated_at = NOW() WHERE kode_barang = $2', [change, kode_barang]);
        const result = await connection.query('INSERT INTO transaksis (kode_barang, jenis_scan, qty, tanggal_scan, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW(), NOW()) RETURNING id', [kode_barang, jenis_scan, qty]);
        const updatedRows = (await connection.query(`SELECT ${barangColumns} FROM barangs WHERE kode_barang = $1`, [kode_barang])).rows;
        await connection.query('COMMIT');
        const actionText = jenis_scan === 'masuk' ? 'ditambahkan' : 'dikeluarkan';
        res.status(201).json({ success: true, message: `Scan berhasil: ${qty}x ${barang.nama_barang} ${actionText}. Sisa stok: ${updatedRows[0].stok_saat_ini}`, data: { id: result.rows[0].id, kode_barang, jenis_scan, qty, tanggal_scan: new Date(), barang: updatedRows[0] }, barang: updatedRows[0] });
    } catch (error) {
        await connection.query('ROLLBACK');
        throw error;
    } finally {
        connection.release();
    }
}));

app.delete('/api/transaksis/:id', asyncRoute(async (req, res) => {
    const connection = await pool.connect();
    try {
        await connection.query('BEGIN');
        const rows = (await connection.query('SELECT * FROM transaksis WHERE id = $1 FOR UPDATE', [req.params.id])).rows;
        if (!rows.length) { await connection.query('ROLLBACK'); return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' }); }
        const transaction = rows[0];
        const change = transaction.jenis_scan === 'masuk' ? -transaction.qty : transaction.qty;
        await connection.query('UPDATE barangs SET stok_saat_ini = stok_saat_ini + $1, updated_at = NOW() WHERE kode_barang = $2', [change, transaction.kode_barang]);
        await connection.query('DELETE FROM transaksis WHERE id = $1', [req.params.id]);
        const barangRows = (await connection.query(`SELECT ${barangColumns} FROM barangs WHERE kode_barang = $1`, [transaction.kode_barang])).rows;
        await connection.query('COMMIT');
        res.json({ success: true, message: 'Transaksi berhasil dibatalkan dan stok dikembalikan.', barang: barangRows[0] || null });
    } catch (error) {
        await connection.query('ROLLBACK');
        throw error;
    } finally {
        connection.release();
    }
}));

app.get('/api/dashboard/stats', asyncRoute(async (req, res) => {
    const summary = await queryRows(`
        SELECT COUNT(*) AS total_produk, COALESCE(SUM(stok_saat_ini), 0) AS total_stok,
        COUNT(*) FILTER (WHERE stok_saat_ini <= 0) AS stok_habis,
        COUNT(*) FILTER (WHERE stok_saat_ini > 0 AND stok_saat_ini <= 5) AS stok_menipis
        FROM barangs`);
    const today = await queryRows(`SELECT COUNT(*) AS transaksi_hari_ini, COALESCE(SUM(CASE WHEN jenis_scan = 'masuk' THEN qty ELSE 0 END), 0) AS qty_masuk_hari_ini, COALESCE(SUM(CASE WHEN jenis_scan = 'keluar' THEN qty ELSE 0 END), 0) AS qty_keluar_hari_ini FROM transaksis WHERE DATE(tanggal_scan) = CURRENT_DATE`);
    const critical = await queryRows(`SELECT ${barangColumns} FROM barangs WHERE stok_saat_ini <= 5 ORDER BY stok_saat_ini ASC LIMIT 5`);
    const recent = await queryRows(`SELECT ${transactionSelect} FROM transaksis t LEFT JOIN barangs b ON b.kode_barang = t.kode_barang ORDER BY t.id DESC LIMIT 6`);
    const chartRows = await queryRows(`SELECT DATE(tanggal_scan) AS date, jenis_scan, SUM(qty) AS qty FROM transaksis WHERE tanggal_scan >= CURRENT_DATE - INTERVAL '6 days' GROUP BY DATE(tanggal_scan), jenis_scan`);
    const chartMap = new Map(chartRows.map((row) => [`${row.date}-${row.jenis_scan}`, Number(row.qty)]));
    const chartData = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        const dateString = date.toISOString().slice(0, 10);
        return { date: dateString, label: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date), masuk: chartMap.get(`${dateString}-masuk`) || 0, keluar: chartMap.get(`${dateString}-keluar`) || 0 };
    });
    res.json({ success: true, data: { ...summary[0], ...today[0], total_produk: Number(summary[0].total_produk), total_stok: Number(summary[0].total_stok), stok_habis: Number(summary[0].stok_habis), stok_menipis: Number(summary[0].stok_menipis), transaksi_hari_ini: Number(today[0].transaksi_hari_ini), qty_masuk_hari_ini: Number(today[0].qty_masuk_hari_ini), qty_keluar_hari_ini: Number(today[0].qty_keluar_hari_ini), barang_kritis: critical, transaksi_terbaru: recent.map(formatTransaction), chart_7_hari: chartData } });
}));

app.use(express.static(frontendDirectory));
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDirectory, 'index.html'));
});

app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem.' });
});

app.listen(port, async () => {
    try {
        await pool.query('SELECT 1');
        console.log(`Node.js API berjalan di http://localhost:${port}`);
    } catch (error) {
        console.error('API berjalan, tetapi koneksi PostgreSQL gagal:', error.message);
    }
});

function isValidPassword(password) {
    const passwordHash = scryptSync(password, 'grosir-eki-auth', 64);
    return timingSafeEqual(passwordHash, adminPasswordHash);
}

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username !== adminUsername || typeof password !== 'string' || !isValidPassword(password)) {
        return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const token = randomBytes(32).toString('hex');
    authTokens.add(token);
    res.json({ success: true, token, user: { username: adminUsername } });
});

app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) authTokens.delete(token);
    res.json({ success: true });
});

app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/auth/login' || req.path === '/auth/logout') return next();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !authTokens.has(token)) {
        return res.status(401).json({ success: false, message: 'Sesi login tidak valid atau sudah berakhir.' });
    }
    next();
});