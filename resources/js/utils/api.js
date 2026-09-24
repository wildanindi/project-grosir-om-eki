import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api'),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('grosir_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor untuk menangani error response secara konsisten
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        let message = 'Terjadi kesalahan sistem.';
        if (error.response?.data?.message) {
            message = error.response.data.message;
        } else if (error.message) {
            message = error.message;
        }
        return Promise.reject({
            status: error.response?.status,
            message,
            errors: error.response?.data?.errors,
            raw: error,
        });
    }
);

export default api;
