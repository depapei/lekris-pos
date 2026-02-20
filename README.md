# Lele Krispy POS - Frontend

Aplikasi Point of Sale (POS) modern untuk Lele Krispy, dibangun menggunakan React, TypeScript, dan Tailwind CSS.

## 🚀 Cara Setup Project

Ikuti langkah-langkah berikut untuk menjalankan project di lingkungan lokal:

1.  **Clone atau Download Project**
2.  **Install Dependencies**
    Gunakan npm untuk menginstall semua library yang dibutuhkan:
    ```bash
    npm install
    ```
3.  **Konfigurasi API**
    Buka `src/services/apiService.ts` dan pastikan `BASE_URL` mengarah ke alamat backend Anda (default: `http://localhost:8080/api`).
4.  **Jalankan Mode Development**
    ```bash
    npm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:3000` (atau port yang tersedia).

---

## 📱 Build & Migrasi ke APK (Capacitor)

Untuk mengubah aplikasi web ini menjadi aplikasi Android (.apk), kita menggunakan **Capacitor**.

1.  **Install Capacitor CLI & Core**
    ```bash
    npm install @capacitor/core @capacitor/cli
    ```
2.  **Inisialisasi Capacitor**
    ```bash
    npx cap init
    ```
    _Masukkan nama aplikasi (Lele Krispy POS) dan ID paket (com.lekris.pos)._
3.  **Build Project React**
    Pastikan folder `dist` sudah terbuat dengan menjalankan build:
    ```bash
    npm run build
    ```
4.  **Tambah Platform Android**
    ```bash
    npm install @capacitor/android
    npx cap add android
    ```
5.  **Sinkronisasi Kode ke Android Studio**
    Setiap kali ada perubahan kode di React, jalankan:
    ```bash
    npm run build
    npx cap copy
    ```
6.  **Build APK di Android Studio**
    Buka project android:
    ```bash
    npx cap open android
    ```
    Di Android Studio, pilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 🔗 API Endpoints & Kegunaan

Aplikasi ini berkomunikasi dengan backend melalui REST API. Berikut adalah endpoint utamanya:

| Endpoint            | Method     | Kegunaan                                       |
| :------------------ | :--------- | :--------------------------------------------- |
| `/auth/login`       | `POST`     | Autentikasi user dan mendapatkan JWT Token.    |
| `/products`         | `GET`      | Mengambil semua daftar menu makanan.           |
| `/products`         | `POST`     | Menambah menu makanan baru.                    |
| `/products/:id`     | `PUT`      | Mengupdate data menu makanan yang sudah ada.   |
| `/products/:id`     | `DELETE`   | Menghapus menu makanan dari daftar.            |
| `/supplies`         | `GET`      | Mengambil data stok dan supplier.              |
| `/supplies`         | `POST/PUT` | Mengelola data inventaris barang masuk.        |
| `/transactions`     | `GET`      | Mengambil riwayat transaksi penjualan.         |
| `/transactions`     | `POST`     | Melakukan checkout (menyimpan transaksi baru). |
| `/transactions/:id` | `PUT`      | Mengedit data transaksi (cabang, item, qty).   |
| `/transactions/:id` | `DELETE`   | Menghapus/Void riwayat transaksi.              |

---

## 📚 Library yang Digunakan

Project ini menggunakan teknologi terbaru untuk performa dan kemudahan pengembangan:

- **React 19**: Library utama untuk membangun antarmuka pengguna berbasis komponen.
- **TypeScript**: Memberikan keamanan tipe data (type-safety) untuk mengurangi bug saat runtime.
- **Tailwind CSS 4**: Framework CSS utility-first untuk styling yang cepat dan responsif.
- **Vite**: Build tool super cepat untuk pengembangan frontend modern.
- **Fetch API**: Digunakan untuk komunikasi data asinkron dengan server backend.

---

_Lele Krispy POS - Built with ❤️ for Scale._
