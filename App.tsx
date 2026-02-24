import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { formatRupiah } from "./components/Formatters";
import * as api from "./services/apiService";
import {
  AppTab,
  CartItem,
  Product,
  Supplier,
  Transaction,
  ViewState,
} from "./types";

const TabButton: React.FC<{
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ active, label, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-all ${
      active ? "text-orange-600" : "text-gray-400"
    }`}
  >
    {icon}
    <span className="text-[12px] mt-1 font-bold uppercase tracking-tight">
      {label}
    </span>
  </button>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    api.auth.isAuthenticated(),
  );
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.PRODUCTS);
  const [view, setView] = useState<ViewState>("POS");
  const [isSidebar, setIsSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // UI State
  const [branch, setBranch] = useState("Pasar Segar");
  const [isOldCust, setIsOldCust] = useState(false);
  const [qProd, setQProd] = useState("");
  const [qMgmtProd, setQMgmtProd] = useState("");
  const [qMgmtSup, setQMgmtSup] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  // Modals
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [editSup, setEditSup] = useState<Supplier | null>(null);
  const [editTrx, setEditTrx] = useState<Transaction | null>(null);
  const [viewPaymentProof, setViewPaymentProof] = useState<Transaction | null>(
    null,
  );
  const [qrPreview, setQrPreview] = useState<boolean>(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: 0,
      });
    }
  }, [activeTab]);

  const init = async () => {
    try {
      setLoading(true);
      const [p, s, h] = await Promise.all([
        api.api.products.getAll(),
        api.api.suppliers.getAll(),
        api.api.transactions.getAll(),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setSuppliers(Array.isArray(s) ? s : []);
      setHistory(Array.isArray(h) ? h : []);
      setError(null);
    } catch (err: any) {
      console.error("Gagal memuat data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) init();
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      await api.auth.login(loginData.username, loginData.password);
      setIsAuthenticated(true);
    } catch (err: any) {
      alert(err.message || "Login gagal");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setLoading(true);
      const payload = {
        branchName: String(branch),
        totalprice: Number(cart.reduce((s, i) => s + i.price * i.quantity, 0)),
        isReturningCustomer: Boolean(isOldCust),
        payment_proof: paymentProof || "",
        customerName: customerName.trim(),
        createdBy: Number(localStorage.getItem("auth_user_id") || 0),
        items: cart.map((i) => ({
          product_id: Number(i.id),
          quantity: Number(i.quantity),
        })),
      };
      await api.api.transactions.insert(payload);
      setCart([]);
      setIsOldCust(false);
      setPaymentProof(null);
      setCustomerName("");
      await init();
      setActiveTab(AppTab.HISTORY);
    } catch (err: any) {
      console.error("Checkout Error:", err);
      alert("Gagal menyimpan pesanan. Periksa koneksi atau data.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // 1. Validasi Awal
    if (!file) return;

    // Reset state sebelum proses baru
    setError("");
    setImgLoading(true);

    try {
      // 2. Opsi Kompresi
      const options = {
        maxSizeMB: 2, // Target maksimal 2MB
        maxWidthOrHeight: 1920, // Batasi dimensi agar tidak terlalu besar
        useWebWorker: true, // Gunakan web worker agar tidak blocking UI thread
        initialQuality: 0.8, // Mulai dari kualitas 80%
      };

      // 3. Proses Kompresi (Mengembalikan objek File)
      const compressedFile = await imageCompression(file, options);

      // 4. Konversi Hasil Kompresi ke Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
        setImgLoading(false); // Selesai
      };
      reader.onerror = () => {
        setError("Gagal membaca file gambar.");
        setImgLoading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      // 5. Error Handling
      console.error(err);
      setError("Gagal mengkompresi gambar. Coba lagi.");
      setImgLoading(false);
    }
  };

  const groupedHistory = useMemo(() => {
    const groups: { [k: string]: Transaction[] } = {};
    if (!Array.isArray(history)) return groups;

    const filtered = filterDate
      ? history.filter((t) => t.timestamp && t.timestamp.startsWith(filterDate))
      : history;

    filtered.forEach((t) => {
      if (!t || !t.timestamp) return;
      const dateObj = new Date(t.timestamp);
      if (isNaN(dateObj.getTime())) return;

      const d = dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    return groups;
  }, [history, filterDate]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto bg-white relative overflow-hidden shadow-2xl justify-center p-10 font-sans">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tighter bg-orange- text-orange-600">
            LELE KRISPY
          </h1>
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-2">
            Sistem Kasir & Inventaris
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest ml-2">
              Username
            </label>
            <input
              required
              type="text"
              placeholder="admin"
              value={loginData.username}
              onChange={(e) =>
                setLoginData({ ...loginData, username: e.target.value })
              }
              className="w-full p-5 bg-gray-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-gray-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest ml-2 placeholder:text-gray-400">
              Password
            </label>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
              className="w-full p-5 bg-gray-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest ml-2">
              Cabang
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full p-5 bg-gray-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-orange-500 transition-all"
            >
              <option>Pasar Segar</option>
            </select>
          </div>
          <button
            disabled={authLoading}
            type="submit"
            className="w-full py-5 bg-orange-600 text-white rounded-xl font-semibold uppercase text-xs tracking-widest shadow-xl shadow-orange-100 active:scale-95 transition-all disabled:opacity-50"
          >
            {authLoading ? "Mencoba Masuk..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-12 text-[11px] text-gray-300 font-bold uppercase tracking-widest">
          Versi 1.0 Build 2026
        </p>
      </div>
    );
  }

  const sidebarVariants = {
    open: {
      width: "18rem",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white relative overflow-hidden shadow-2xl font-sans">
      {/* Sidebar Navigation */}
      <AnimatePresence>
        {isSidebar && (
          <motion.div
            className="fixed inset-0 bg-gray-900/60 z-100 backdrop-blur-sm"
            onClick={() => setIsSidebar(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className="absolute left-0 top-0 bottom-0 w-72 bg-gray-900 shadow-2xl p-8 flex flex-col pt-safe pb-safe animate-in slide-in-from-left duration-300 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-12 mt-4">
                <h2 className="text-2xl text-orange-600 font-semibold tracking-tighter">
                  Menu
                </h2>
                <button
                  onClick={() => setIsSidebar(false)}
                  className="text-gray-300 text-3xl"
                >
                  &times;
                </button>
              </div>
              <nav className="space-y-3">
                <button
                  onClick={() => {
                    setView("POS");
                    setIsSidebar(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl font-bold flex items-center space-x-4 transition-all ${
                    view === "POS"
                      ? "bg-orange-600 text-white shadow-lg"
                      : "text-gray-500 bg-gray-800"
                  }`}
                >
                  <span>🏪</span>
                  <span>Kasir Utama</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-4 rounded-xl font-bold flex items-center space-x-4 text-red-500 bg-gray-800 transition-all mt-8"
                >
                  <span>🚪</span>
                  <span>Keluar</span>
                </button>
              </nav>
              <div className="mt-auto pt-6 border-t border-gray-100 mb-4">
                <p className="text-[12px] text-gray-400 font-bold text-center">
                  Copyright © 2026 DAL All Rights Reserved
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Header */}
      <header className="bg-orange-600 border-b border-gray-100 p-4 pt-safe flex justify-between items-center z-50">
        <button
          onClick={() => setIsSidebar(true)}
          className="p-2 bg-gray-50 rounded-xl text-gray-400"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold tracking-tighter text-gray-50">
            LELE KRISPY
          </h1>
          <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest -mt-1">
            {branch}
          </p>
        </div>
        <div className="w-10"></div>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto p-5 pb-40 scroll-smooth"
        ref={mainRef}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Memuat data toko...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-8 rounded-xl text-center space-y-6">
            <div className="text-4xl">🔌</div>
            <p className="text-red-700 font-bold text-xs leading-relaxed uppercase">
              {error}
            </p>
            <button
              onClick={init}
              className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold text-xs uppercase shadow-xl"
            >
              Coba Hubungkan Lagi
            </button>
          </div>
        ) : (
          <>
            {view === "POS" && (
              <div className="space-y-6">
                {activeTab === AppTab.PRODUCTS && (
                  <div className="space-y-4 mb-20">
                    <input
                      type="text"
                      placeholder="Cari menu makanan..."
                      value={qProd}
                      onChange={(e) => setQProd(e.target.value)}
                      className="w-full p-4 bg-gray-50 rounded-xl border-none font-bold text-xs shadow-inner focus:ring-2 focus:ring-orange-500 transition-all"
                    />
                    <div className="grid grid-cols-1 gap-3">
                      {products
                        .filter((p) =>
                          (p.item || "")
                            .toLowerCase()
                            .includes(qProd.toLowerCase()),
                        )
                        .map((p) => (
                          <div
                            key={p.id}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all group"
                          >
                            <div>
                              <h3 className="font-semibold text-gray-800 uppercase text-xs tracking-tighter">
                                {p.item || "Tanpa Nama"}
                              </h3>
                              <p className="font-semibold text-gray-600 uppercase text-[12px] tracking-tighter">
                                {p.description || ""}
                              </p>
                              <p className="text-orange-600 font-bold text-xs mt-1">
                                {formatRupiah(p.price || 0)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const ex = cart.find((i) => i.id === p.id);
                                if (ex)
                                  setCart(
                                    cart.map((i) =>
                                      i.id === p.id
                                        ? { ...i, quantity: i.quantity + 1 }
                                        : i,
                                    ),
                                  );
                                else
                                  setCart([
                                    ...cart,
                                    { ...p, quantity: 1, addedAt: Date.now() },
                                  ]);
                              }}
                              className="w-fit p-3 bg-gray-900 text-white rounded-lg font-semibold text-xs shadow-lg"
                            >
                              Tambahkan
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {activeTab === AppTab.CART && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-1">
                            Nama Customer (Opsional)
                          </label>
                          <input
                            type="text"
                            placeholder="Masukkan nama customer..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full p-4 bg-white rounded-xl border-none font-bold text-xs shadow-sm focus:ring-2 focus:ring-orange-500 transition-all"
                          />
                        </div>
                        <div className="flex items-center space-x-3 px-1">
                          <input
                            type="checkbox"
                            id="oc"
                            checked={isOldCust}
                            onChange={(e) => setIsOldCust(e.target.checked)}
                            className="w-5 h-5 text-orange-600 rounded-md focus:ring-orange-500 border-none bg-white shadow-sm"
                          />
                          <label
                            htmlFor="oc"
                            className="text-xs font-bold text-gray-600"
                          >
                            Pernah beli disini
                          </label>
                        </div>
                      </div>
                    </div>

                    {cart.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                        <p className="text-gray-300 font-bold italic text-sm">
                          Keranjang belanja kosong
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                          <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                            Daftar Item
                          </h3>
                          <button
                            onClick={() => {
                              if (confirm("Hapus semua item di keranjang?"))
                                setCart([]);
                            }}
                            className="text-[12px] font-semibold text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors"
                          >
                            Hapus Semua
                          </button>
                        </div>
                        {cart
                          .sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0))
                          .map((i) => (
                            <div
                              key={i.id}
                              className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-100 shadow-sm"
                            >
                              <div>
                                <p className="font-bold text-gray-800 text-xs uppercase">
                                  {i.item || "Tanpa Nama"}
                                </p>
                                <p className="text-[12px] font-medium text-gray-400">
                                  {formatRupiah(i.price || 0)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() =>
                                    i.quantity > 1
                                      ? setCart(
                                          cart.map((x) =>
                                            x.id === i.id
                                              ? {
                                                  ...x,
                                                  quantity: x.quantity - 1,
                                                }
                                              : x,
                                          ),
                                        )
                                      : setCart(
                                          cart.filter((x) => x.id !== i.id),
                                        )
                                  }
                                  className="w-8 h-8 rounded-lg border border-gray-100 text-gray-400 font-bold"
                                >
                                  -
                                </button>
                                <span className="font-bold text-gray-700 w-4 text-center text-xs">
                                  {i.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    setCart(
                                      cart.map((x) =>
                                        x.id === i.id
                                          ? { ...x, quantity: x.quantity + 1 }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {cart.length > 0 && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                          <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest text-center">
                            Pembayaran QRIS
                          </h3>
                          <div
                            className="relative aspect-square w-48 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200"
                            onClick={() => setQrPreview(true)}
                          >
                            <img
                              src="/assets/QRIS.jpg"
                              alt="QRIS Dummy"
                              className="w-full h-full object-cover opacity-50"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm">
                                Perbesar
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-center text-gray-400 font-bold uppercase tracking-widest">
                            Silahkan scan QR di atas
                          </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                          <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                            Upload Bukti Bayar
                          </h3>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleImageChange}
                              className="hidden"
                              id="payment-upload"
                              disabled={imgLoading}
                            />
                            <label
                              htmlFor="payment-upload"
                              className={`flex flex-col items-center justify-center w-full p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-all ${
                                imgLoading && "cursor-not-allowed"
                              }`}
                            >
                              {paymentProof ? (
                                <div className="space-y-4 text-center w-full">
                                  <div className="w-full aspect-4/3 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                                    <TransformWrapper>
                                      <TransformComponent>
                                        <img
                                          src={paymentProof}
                                          alt="Bukti Bayar"
                                          className="w-full h-full object-contain bg-gray-900"
                                        />
                                      </TransformComponent>
                                    </TransformWrapper>
                                  </div>
                                  <div className="flex items-center justify-center space-x-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <p className="text-[12px] font-semibold text-emerald-600 uppercase tracking-widest">
                                      Berhasil Diupload
                                    </p>
                                  </div>
                                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                                    Klik untuk ganti foto
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center space-y-2">
                                  <span className="text-2xl">📸</span>
                                  <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                                    Klik untuk upload
                                  </p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                        <div className="h-80"></div>{" "}
                        {/* Extra large spacer at the very end to ensure scrollability */}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === AppTab.HISTORY && (
                  <div className="space-y-6">
                    <div className="px-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest ml-1">
                          Filter Tanggal
                        </label>
                        {filterDate && (
                          <button
                            onClick={() => setFilterDate("")}
                            className="text-[12px] font-bold text-orange-600 uppercase tracking-widest"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full p-4 bg-gray-50 rounded-xl border-none font-bold text-xs shadow-inner focus:ring-2 focus:ring-orange-500 transition-all"
                      />
                    </div>
                    {Object.keys(groupedHistory).length === 0 ? (
                      <p className="text-center text-gray-300 py-20 italic font-bold">
                        {filterDate
                          ? "Tidak ada transaksi pada tanggal ini"
                          : "Belum ada riwayat hari ini"}
                      </p>
                    ) : (
                      (
                        Object.entries(groupedHistory) as [
                          string,
                          Transaction[],
                        ][]
                      ).map(([date, trxs]) => {
                        const dailyTotal = trxs.reduce(
                          (sum, t) => sum + (t.totalprice || 0),
                          0,
                        );
                        return (
                          <div key={date} className="space-y-4">
                            <div className="sticky top-0 bg-white/5 backdrop-blur-md shadow-sm rounded-xl py-3 px-2 z-10 border border-gray-50 flex justify-between items-center">
                              <h2 className="text-[12px] font-semibold text-orange-600 uppercase tracking-widest">
                                {date}
                              </h2>
                              <div className="text-right">
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                                  Total
                                </p>
                                <p className="text-xs font-semibold text-gray-900">
                                  {formatRupiah(dailyTotal)}
                                </p>
                              </div>
                            </div>
                            {trxs.map((t) => (
                              <div
                                key={t.id}
                                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden"
                              >
                                {t.isReturningCustomer && (
                                  <span className="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-semibold px-4 py-2 rounded-bl-xl uppercase tracking-widest shadow-lg">
                                    Pernah Beli Disini
                                  </span>
                                )}
                                <div className="flex justify-between items-start border-b border-gray-50 mt-2 mb-4">
                                  <div className="space-y-2">
                                    <p className="font-bold text-gray-800 uppercase text-[12px] tracking-tight">
                                      {t.branchName}
                                    </p>
                                    <p className="font-bold text-gray-400 uppercase text-[12px] tracking-tight">
                                      {t.customerName}
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-400 mt-1">
                                      {t.timestamp
                                        ? new Date(
                                            t.timestamp,
                                          ).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "--:--"}
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-400 mt-1">
                                      {t.cashier && `Kasir: ${t.cashier}`}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-gray-900 font-semibold text-lg">
                                      {formatRupiah(t.totalprice || 0)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex justify-start space-x-4 mt-2 pb-4 mb-4">
                                  <button
                                    onClick={async () => {
                                      setViewPaymentProof(t);
                                      setLoadingProof(true);
                                      setPaymentProofUrl(null);
                                      try {
                                        const baseUrl = api.BASE_URL;
                                        const token =
                                          localStorage.getItem("auth_token");
                                        const response = await fetch(
                                          `${baseUrl}/transactions/payment-proof/${t.id}/`,
                                          {
                                            headers: {
                                              Authorization: `Bearer ${token}`,
                                            },
                                          },
                                        );
                                        if (response.ok) {
                                          const blob = await response.blob();
                                          const objectUrl =
                                            URL.createObjectURL(blob);
                                          setPaymentProofUrl(objectUrl || null);
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      } finally {
                                        setLoadingProof(false);
                                      }
                                    }}
                                    className="text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 transition-colors text-sm flex items-center space-x-1"
                                    title="Lihat Bukti Pembayaran"
                                  >
                                    <span>Bukti Bayar</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      let rawItems = t.items;
                                      let parsedItems = [];
                                      try {
                                        parsedItems =
                                          typeof rawItems === "string"
                                            ? JSON.parse(rawItems)
                                            : rawItems;
                                      } catch (e) {
                                        parsedItems = [];
                                      }

                                      const normalizedItems = (
                                        Array.isArray(parsedItems)
                                          ? parsedItems
                                          : []
                                      ).map((i: any) => ({
                                        product_id: i.product_id || i.id,
                                        quantity: i.quantity || 0,
                                        item: i.item || "Item",
                                        price: i.price || 0,
                                      }));

                                      setEditTrx({
                                        ...t,
                                        branchName: t.branchName,
                                        totalPrice: t.totalprice,
                                        Isreturningcustomer:
                                          t.isReturningCustomer,
                                        items: normalizedItems,
                                      });
                                    }}
                                    className="text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 transition-colors text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (
                                        confirm("Hapus riwayat transaksi ini?")
                                      ) {
                                        await api.api.transactions.delete(
                                          t.id!,
                                        );
                                        init();
                                      }
                                    }}
                                    className="text-red-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 transition-colors text-sm"
                                  >
                                    Hapus
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {(() => {
                                    let rawItems = t.items;
                                    let parsedItems = [];
                                    try {
                                      parsedItems =
                                        typeof rawItems === "string"
                                          ? JSON.parse(rawItems)
                                          : rawItems;
                                    } catch (e) {
                                      console.error("Gagal parse items:", e);
                                    }
                                    return (
                                      Array.isArray(parsedItems)
                                        ? parsedItems
                                        : []
                                    ).map((i: any) => (
                                      <p
                                        key={i.id}
                                        className="text-[12px] font-medium text-gray-500 flex justify-between"
                                      >
                                        <span>
                                          {i.item || "Item"} × {i.quantity || 0}
                                        </span>
                                        <span className="text-gray-400">
                                          {formatRupiah(
                                            (i.price || 0) * (i.quantity || 0),
                                          )}
                                        </span>
                                      </p>
                                    ));
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {view === "PRODUCT_MGMT" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-2xl font-semibold text-gray-800 uppercase italic tracking-tighter">
                    Daftar Menu
                  </h2>
                  <button
                    onClick={() =>
                      setEditProd({ item: "", description: "", price: 0 })
                    }
                    className="bg-orange-600 text-white px-5 py-3 rounded-xl font-semibold text-[12px] uppercase shadow-lg shadow-orange-100"
                  >
                    + Tambah
                  </button>
                </div>
                <div className="px-2">
                  <input
                    type="text"
                    placeholder="Cari menu..."
                    value={qMgmtProd}
                    onChange={(e) => setQMgmtProd(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-xl border-none font-bold text-xs shadow-inner focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  {products
                    .filter((p) =>
                      (p.item || "")
                        .toLowerCase()
                        .includes(qMgmtProd.toLowerCase()),
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center"
                      >
                        <div className="flex-1 pr-4">
                          <h3 className="font-semibold text-gray-800 uppercase text-xs">
                            {p.item || "Tanpa Nama"}
                          </h3>
                          <p className="text-orange-600 font-bold text-xs mt-1">
                            {formatRupiah(p.price || 0)}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditProd(p)}
                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:text-orange-600 transition-colors"
                          >
                            ✎
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("Hapus menu ini?")) {
                                await api.api.products.delete(p.id!);
                                init();
                              }
                            }}
                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 transition-colors"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {view === "SUPPLIER_MGMT" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-2xl font-semibold text-gray-800 uppercase italic tracking-tighter">
                    Supplies
                  </h2>
                  <button
                    onClick={() => setEditSup({ name: "", unit: "" })}
                    className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold text-[12px] uppercase shadow-lg shadow-gray-100"
                  >
                    + Tambah
                  </button>
                </div>
                <div className="px-2">
                  <input
                    type="text"
                    placeholder="Cari supply..."
                    value={qMgmtSup}
                    onChange={(e) => setQMgmtSup(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-xl border-none font-bold text-xs shadow-inner focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  {suppliers
                    .filter((s) =>
                      (s.name || "")
                        .toLowerCase()
                        .includes(qMgmtSup.toLowerCase()),
                    )
                    .map((s) => (
                      <div
                        key={s.id}
                        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-orange-600 flex justify-between items-center"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-800 uppercase text-xs">
                            {s.name}
                          </h3>
                          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            Satuan: {s.unit}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditSup(s)}
                            className="p-3 text-gray-300 font-bold text-[12px] uppercase hover:text-orange-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("Hapus data supplier?")) {
                                await api.api.suppliers.delete(s.id!);
                                init();
                              }
                            }}
                            className="p-3 text-gray-300 font-bold text-[12px] uppercase hover:text-red-600"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Forms Modal */}
      {(editProd || editSup || editTrx) && (
        <div className="fixed inset-0 bg-gray-900/80 z-110 flex items-end sm:items-center justify-center pt-safe backdrop-blur-md px-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-10 space-y-8 shadow-2xl animate-in slide-in-from-bottom duration-300 mb-safe">
            <h3 className="text-xl font-semibold text-gray-900 uppercase italic tracking-tighter">
              {editTrx ? "Edit Transaksi" : "Isi Formulir Data"}
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editProd) await api.api.products.save(editProd);
                if (editSup) await api.api.suppliers.save(editSup);
                if (editTrx) {
                  const finalPayload: any = {
                    ...editTrx,
                    branchName: editTrx.branchName,
                    totalPrice: editTrx.totalPrice,
                    Isreturningcustomer: editTrx.Isreturningcustomer,
                    customerName: editTrx.customerName,
                    updatedBy: Number(
                      localStorage.getItem("auth_user_id") || 0,
                    ),
                    items: editTrx.items.map((i) => ({
                      product_id: Number(i.product_id),
                      quantity: Number(i.quantity),
                    })),
                  };
                  delete finalPayload.createdBy;
                  await api.api.transactions.save(finalPayload);
                }
                setEditProd(null);
                setEditSup(null);
                setEditTrx(null);
                init();
              }}
              className="space-y-5"
            >
              {editTrx && (
                <div className="space-y-4 mb-4">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <input
                      type="checkbox"
                      id="edit-oc-top"
                      checked={editTrx.Isreturningcustomer}
                      onChange={(e) =>
                        setEditTrx({
                          ...editTrx,
                          Isreturningcustomer: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-orange-600 rounded-md focus:ring-orange-500 border-none bg-white shadow-sm"
                    />
                    <label
                      htmlFor="edit-oc-top"
                      className="text-xs font-bold text-gray-600"
                    >
                      Pernah beli disini
                    </label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-2">
                      Nama Customer
                    </label>
                    <input
                      type="text"
                      placeholder="Nama customer..."
                      value={editTrx.customerName || ""}
                      onChange={(e) =>
                        setEditTrx({ ...editTrx, customerName: e.target.value })
                      }
                      className="w-full p-5 bg-gray-50 rounded-xl border-none font-bold text-xs"
                    />
                  </div>
                </div>
              )}
              {editProd && (
                <>
                  <input
                    required
                    placeholder="Nama Menu"
                    value={editProd.item}
                    onChange={(e) =>
                      setEditProd({ ...editProd, item: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-xl border-none font-bold text-xs"
                  />
                  <input
                    required
                    placeholder="Deskripsi Singkat"
                    value={editProd.description}
                    onChange={(e) =>
                      setEditProd({ ...editProd, description: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-xl border-none font-bold text-xs"
                  />
                  <input
                    required
                    type="number"
                    placeholder="Harga Jual"
                    value={editProd.price || ""}
                    onChange={(e) =>
                      setEditProd({
                        ...editProd,
                        price: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-5 bg-gray-50 rounded-xl border-none font-semibold text-orange-600 text-xs"
                  />
                </>
              )}
              {editSup && (
                <>
                  <input
                    required
                    placeholder="Nama Supplier / Barang"
                    value={editSup.name}
                    onChange={(e) =>
                      setEditSup({ ...editSup, name: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-xl border-none font-bold text-xs"
                  />
                  <input
                    required
                    placeholder="Satuan (kg, liter, box)"
                    value={editSup.unit}
                    onChange={(e) =>
                      setEditSup({ ...editSup, unit: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-xl border-none font-bold text-xs"
                  />
                </>
              )}
              {editTrx && (
                <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-2">
                      Daftar Item Belanja
                    </label>
                    <div className="space-y-2">
                      {editTrx.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100"
                        >
                          <div className="flex-1">
                            <p className="text-[12px] font-semibold text-gray-800 uppercase leading-none mb-1">
                              {item.item}
                            </p>
                            <p className="text-[11px] font-bold text-orange-600">
                              {formatRupiah(item.price)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...editTrx.items];
                                if (newItems[idx].quantity > 1) {
                                  newItems[idx].quantity--;
                                } else {
                                  newItems.splice(idx, 1);
                                }
                                setEditTrx({
                                  ...editTrx,
                                  items: newItems,
                                  totalPrice: newItems.reduce(
                                    (s, i) => s + i.price * i.quantity,
                                    0,
                                  ),
                                });
                              }}
                              className="w-7 h-7 bg-white rounded-lg border border-gray-200 text-gray-400 font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-semibold w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...editTrx.items];
                                newItems[idx].quantity++;
                                setEditTrx({
                                  ...editTrx,
                                  items: newItems,
                                  totalPrice: newItems.reduce(
                                    (s, i) => s + i.price * i.quantity,
                                    0,
                                  ),
                                });
                              }}
                              className="w-7 h-7 bg-orange-50 rounded-lg text-orange-600 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest ml-2">
                          Tambah Menu Lain
                        </label>
                        <div className="space-y-2">
                          {products
                            .filter(
                              (p) =>
                                !editTrx.items.some(
                                  (i) => String(i.product_id) === String(p.id),
                                ),
                            )
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const newItems = [...editTrx.items];
                                  newItems.push({
                                    product_id: p.id,
                                    quantity: 1,
                                    item: p.item,
                                    price: p.price,
                                  });
                                  setEditTrx({
                                    ...editTrx,
                                    items: newItems,
                                    totalPrice: newItems.reduce(
                                      (s, i) => s + i.price * i.quantity,
                                      0,
                                    ),
                                  });
                                }}
                                className="w-full flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 transition-all text-left group"
                              >
                                <div className="flex-1">
                                  <p className="text-[12px] font-semibold text-gray-800 uppercase leading-none mb-1 group-hover:text-orange-600 transition-colors">
                                    {p.item}
                                  </p>
                                  <p className="text-[11px] font-bold text-gray-400">
                                    {formatRupiah(p.price)}
                                  </p>
                                </div>
                                <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-semibold text-lg">
                                  +
                                </div>
                              </button>
                            ))}
                          {products.filter(
                            (p) =>
                              !editTrx.items.some(
                                (i) => String(i.product_id) === String(p.id),
                              ),
                          ).length === 0 && (
                            <p className="text-[11px] text-center text-gray-300 font-bold italic uppercase py-4">
                              Semua menu sudah ditambahkan
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                        Total Akhir
                      </span>
                      <span className="text-xl font-semibold text-orange-600">
                        {formatRupiah(editTrx.totalPrice || editTrx.totalprice)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditProd(null);
                    setEditSup(null);
                    setEditTrx(null);
                  }}
                  className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-xl font-bold uppercase text-[12px] tracking-widest"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] py-5 bg-orange-600 text-white rounded-xl font-semibold uppercase text-[12px] tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Cart Summary for POS */}
      {view === "POS" && activeTab === AppTab.PRODUCTS && cart.length > 0 && (
        <div className="fixed bottom-28 left-0 right-0 max-w-md mx-auto px-6 z-40 pointer-events-none">
          <button
            onClick={() => setActiveTab(AppTab.CART)}
            className="w-full bg-gray-900 text-white p-5 rounded-xl shadow-2xl flex justify-between items-center group active:scale-95 transition-all border border-white/10 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-orange-600 text-white text-[12px] font-semibold w-7 h-7 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <div className="text-left">
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                  Total Pesanan
                </p>
                <p className="text-xs font-semibold uppercase tracking-tighter">
                  Lihat Keranjang
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-orange-500">
                {formatRupiah(
                  cart.reduce((s, i) => s + i.price * i.quantity, 0),
                )}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Floating Checkout Bar for CART Tab */}
      {view === "POS" && activeTab === AppTab.CART && cart.length > 0 && (
        <div className="fixed bottom-28 left-0 right-0 max-w-md mx-auto px-6 z-40 pointer-events-none">
          <div className="bg-orange-600 p-6 rounded-xl text-white shadow-2xl border border-white/20 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase opacity-70 tracking-widest">
                  Total Pembayaran
                </span>
                <span className="text-2xl font-semibold">
                  {formatRupiah(
                    cart.reduce((s, x) => s + x.price * x.quantity, 0),
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[12px] font-bold opacity-70 uppercase tracking-widest">
                  {cart.reduce((s, i) => s + i.quantity, 0)} Item
                </span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading || !paymentProof}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              {loading
                ? "Memproses..."
                : !paymentProof
                ? "Upload Bukti Bayar"
                : "Konfirmasi & Bayar"}
            </button>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {viewPaymentProof && (
        <div className="fixed inset-0 bg-gray-900/80 z-120 flex items-center justify-center backdrop-blur-md px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 uppercase italic tracking-tighter">
                Bukti Pembayaran{" "}
                {viewPaymentProof.customerName
                  ? `${viewPaymentProof.customerName}`
                  : ""}
              </h3>
              <button
                onClick={() => {
                  setViewPaymentProof(null);
                  setPaymentProofUrl(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="aspect-auto w-full bg-gray-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center relative">
              {loadingProof ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                    Memuat...
                  </p>
                </div>
              ) : paymentProofUrl ? (
                <TransformWrapper>
                  <TransformComponent>
                    <img
                      src={paymentProofUrl}
                      alt="Bukti Bayar"
                      className="w-full h-full object-contain"
                    />
                  </TransformComponent>
                </TransformWrapper>
              ) : (
                <div className="text-center space-y-2">
                  <span className="text-3xl">🚫</span>
                  <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                    Tidak ada bukti bayar
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setViewPaymentProof(null);
                setPaymentProofUrl(null);
              }}
              className="w-full p-4 bg-gray-900 text-white rounded-xl font-semibold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {qrPreview && (
        <div className="fixed inset-0 bg-gray-900/80 z-120 flex items-center justify-center backdrop-blur-md px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 uppercase italic tracking-tighter">
                Preview QRIS
              </h3>
              <button
                onClick={() => {
                  setQrPreview(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="aspect-auto w-full bg-gray-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center relative">
              <TransformWrapper>
                <TransformComponent>
                  <img
                    src={"/assets/QRIS.jpg"}
                    alt="Preview QRIS"
                    className="w-full h-full object-contain"
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>
            <button
              onClick={() => {
                setQrPreview(false);
              }}
              className="w-full p-4 bg-gray-900 text-white rounded-xl font-semibold text-[12px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      {view === "POS" && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-gray-50 flex justify-around items-center px-4 min-h-safe pb-safe z-50 rounded-t-xl shadow-[0_-15px_40px_rgba(0,0,0,0.06)] pointer-events-auto">
          <TabButton
            active={activeTab === AppTab.PRODUCTS}
            label="Menu"
            onClick={() => setActiveTab(AppTab.PRODUCTS)}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            }
          />
          <TabButton
            active={activeTab === AppTab.CART}
            label="Pesanan"
            onClick={() => setActiveTab(AppTab.CART)}
            icon={
              <div className="relative">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-semibold">
                    {cart.length}
                  </span>
                )}
              </div>
            }
          />
          <TabButton
            active={activeTab === AppTab.HISTORY}
            label="Riwayat"
            onClick={() => setActiveTab(AppTab.HISTORY)}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          />
        </nav>
      )}
    </div>
  );
};

export default App;
