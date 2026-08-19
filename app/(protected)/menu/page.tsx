'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getImageUrl } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import {
  Tags,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Coffee,
  AlertCircle,
  Tag,
  Store,
  Info,
  X,
} from 'lucide-react';

interface MenuProduct {
  id: string | number;
  name: string;
  description: string | null;
  basePrice: number;
  price: number;
  priceOverride: number | null;
  imageUrl?: string | null;
  category: string | null;
  categoryId: number | null;
  type: 'beverage' | 'food';
  isAvailable: boolean;
  stockNote?: string | null;
  addons?: Array<{ id: number; name: string; extraPrice: number }>;
}

interface OutletOption {
  id: number;
  name: string;
}

export default function OutletMenuPage() {
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [outlets, setOutlets] = useState<OutletOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [staff, setStaff] = useState<StaffPayload | null>(null);
  const [outletId, setOutletId] = useState<number>(1);

  // Edit price override inline state
  const [editingPriceId, setEditingPriceId] = useState<string | number | null>(null);
  const [inputOverride, setInputOverride] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const isSuperAdmin = staff?.role === 'super_admin';

  // Load Staff Info
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const staffObj = parseStaffToken(token);
      if (staffObj) {
        setStaff(staffObj);
        if (staffObj.outletId) {
          setOutletId(staffObj.outletId);
        }
      }
    }
  }, []);

  // Fetch Outlets list for Super Admin
  useEffect(() => {
    apiFetch<{ data: OutletOption[] }>('/api/outlets')
      .then((res) => {
        let list: OutletOption[] = [];
        if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res)) list = res as any;
        if (list.length > 0) {
          setOutlets(list);
          if (!staff?.outletId && list[0]?.id) {
            setOutletId(list[0].id);
          }
        }
      })
      .catch(() => {
        setOutlets([
          { id: 1, name: 'ERCoffeeLab Bandung' },
          { id: 2, name: 'ERCoffeeLab Jakarta' },
        ]);
      });
  }, [staff]);

  const fetchMenu = useCallback(async () => {
    if (!outletId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: MenuProduct[] }>(
        `/api/outlets/${outletId}/menu?all=true`
      );
      if (Array.isArray(res?.data)) {
        setProducts(res.data);
      } else if (Array.isArray(res)) {
        setProducts(res as any);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar menu cabang');
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleToggleAvailability = async (product: MenuProduct) => {
    setUpdatingId(product.id);
    setError(null);
    setInfoMessage(null);
    const nextAvailable = !product.isAvailable;

    try {
      await apiFetch(`/api/outlets/${outletId}/menu/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isAvailable: nextAvailable,
          priceOverride: product.priceOverride,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isAvailable: nextAvailable } : p
        )
      );
      setInfoMessage(
        `Status stok "${product.name}" diubah menjadi ${nextAvailable ? 'TERSEDIA' : 'STOK HABIS'}.`
      );
    } catch (err: any) {
      setError(err?.message || 'Gagal mengubah ketersediaan stok');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSavePriceOverride = async (productId: string | number) => {
    setError(null);
    setInfoMessage(null);

    const current = products.find((p) => p.id === productId);
    const numValue = inputOverride.trim() ? Number(inputOverride) : null;

    // Check if there are no changes made
    if (current && current.priceOverride === numValue) {
      setInfoMessage('Tidak ada perubahan yang disimpan.');
      setEditingPriceId(null);
      return;
    }

    setUpdatingId(productId);

    try {
      await apiFetch(`/api/outlets/${outletId}/menu/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isAvailable: current ? current.isAvailable : true,
          priceOverride: numValue,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                priceOverride: numValue,
                price: numValue ?? p.basePrice,
              }
            : p
        )
      );

      setInfoMessage(
        numValue !== null
          ? `Harga khusus cabang untuk "${current?.name}" diatur ke Rp ${numValue.toLocaleString('id-ID')}.`
          : `Harga "${current?.name}" dikembalikan ke harga pusat.`
      );
      setEditingPriceId(null);
      setInputOverride('');
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan harga khusus cabang');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetPrice = async (product: MenuProduct) => {
    if (product.priceOverride === null) {
      setInfoMessage('Tidak ada perubahan yang disimpan.');
      return;
    }

    setUpdatingId(product.id);
    setError(null);
    setInfoMessage(null);
    try {
      await apiFetch(`/api/outlets/${outletId}/menu/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          isAvailable: product.isAvailable,
          priceOverride: null,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                priceOverride: null,
                price: p.basePrice,
              }
            : p
        )
      );
      setInfoMessage(`Harga "${product.name}" berhasil dikembalikan ke harga pusat.`);
    } catch (err: any) {
      setError(err?.message || 'Gagal mereset harga');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatRupiah = (val: number) =>
    'Rp' + Math.max(0, Math.round(val || 0)).toLocaleString('id-ID');

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      (product.description && product.description.toLowerCase().includes(q));
    const matchCat =
      selectedCategory === 'all' || product.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentOutletName =
    outlets.find((o) => o.id === outletId)?.name || `Outlet #${outletId}`;

  return (
    <div className="space-y-6 font-source">
      {/* Header & Outlet Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-albert text-[#181F4B]">
            Katalog Menu & Stok Outlet
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Atur status stok (TERSEDIA / STOK HABIS) dan harga khusus per cabang outlet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Super Admin Outlet Selector */}
          {isSuperAdmin ? (
            <div className="relative flex items-center">
              <Store className="w-4 h-4 absolute left-3.5 text-[#C9A876] pointer-events-none" />
              <select
                value={outletId}
                onChange={(e) => setOutletId(Number(e.target.value))}
                className="pl-9 pr-8 py-2 bg-[#F6F3EC] border border-[#C9A876]/50 hover:border-[#C9A876] rounded-xl text-xs font-bold font-albert text-[#181F4B] focus:outline-none cursor-pointer shadow-xs transition"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EDF0FA] border border-[#D2D9F3] text-xs font-bold text-[#3B4B8C] font-albert shadow-xs">
              <Store className="w-4 h-4 text-[#3B4B8C]" />
              <span>{currentOutletName}</span>
            </div>
          )}

          <button
            onClick={fetchMenu}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {infoMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF6E6] border border-[#F7E5C4] text-xs text-[#181F4B] flex items-center justify-between gap-3 font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#C9A876] shrink-0" />
            <span>{infoMessage}</span>
          </div>
          <button
            onClick={() => setInfoMessage(null)}
            className="p-1 text-[#6B7088] hover:text-[#181F4B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#FDF0F2] border border-[#FAF1F3] text-xs text-[#C9576B] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar: Categories & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-albert transition-all duration-150 whitespace-nowrap cursor-pointer hover:scale-[1.02] ${
              selectedCategory === 'all'
                ? 'bg-[#181F4B] text-[#C9A876] shadow-xs'
                : 'text-[#6B7088] hover:bg-[#F4F5F9] hover:text-[#181F4B]'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat!}
              onClick={() => setSelectedCategory(cat!)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-albert transition-all duration-150 whitespace-nowrap cursor-pointer hover:scale-[1.02] ${
                selectedCategory === cat
                  ? 'bg-[#181F4B] text-[#C9A876] shadow-xs'
                  : 'text-[#6B7088] hover:bg-[#F4F5F9] hover:text-[#181F4B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk menu..."
            className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
          />
        </div>
      </div>

      {/* Menu Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-[#6B7088]">
            <div className="w-7 h-7 border-3 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="font-semibold text-sm">Memuat menu {currentOutletName}...</p>
          </div>
        ) : paginatedProducts.length > 0 ? (
          paginatedProducts.map((product) => {
            const isCustomPrice =
              product.priceOverride !== null &&
              product.priceOverride !== undefined &&
              product.priceOverride !== product.basePrice;

            const effectivePrice = product.price || product.basePrice;
            const resolvedImg = getImageUrl(product.imageUrl);
            const isUpdating = updatingId === product.id;

            return (
              <div
                key={product.id}
                className={`bg-white p-5 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md ${
                  !product.isAvailable ? 'border-[#C9576B]/30 bg-[#FDF0F2]/20' : 'border-[#E7E8F0] hover:border-[#C9A876]/40'
                }`}
              >
                <div>
                  {/* Top Bar: Category & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7088] bg-[#F4F5F9] px-2.5 py-1 rounded-md border border-[#E7E8F0]">
                      {product.category || 'General'}
                    </span>

                    {/* Stock Status Switch Toggle */}
                    <button
                      onClick={() => handleToggleAvailability(product)}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95 ${
                        product.isAvailable
                          ? 'bg-[#EAF5EE] text-[#3E8A5A] border border-[#C6E7D2] hover:bg-[#d8eedf]'
                          : 'bg-[#FDF0F2] text-[#C9576B] border border-[#FAF1F3] hover:bg-[#fae2e6]'
                      }`}
                      title="Klik untuk ubah status ketersediaan"
                    >
                      {product.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>TERSEDIA</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>STOK HABIS</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Thumbnail & Title Layout */}
                  <div className="flex items-start gap-3">
                    {resolvedImg ? (
                      <img
                        src={resolvedImg}
                        alt={product.name}
                        className="w-14 h-14 object-cover rounded-2xl border border-[#E7E8F0] shrink-0 bg-white shadow-xs"
                        onError={(e) => {
                          (e.target as any).onerror = null;
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#F6F3EC] border border-[#C9A876]/30 flex items-center justify-center text-[#C9A876] shrink-0 shadow-xs">
                        <Coffee className="w-7 h-7" />
                      </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold text-base font-albert text-[#181F4B]">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-[#6B7088] mt-0.5 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing & Override Section */}
                <div className="pt-3 border-t border-[#E7E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6B7088] uppercase block font-semibold">Harga Cabang</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold font-albert text-[#181F4B]">
                          {formatRupiah(effectivePrice)}
                        </span>
                        {isCustomPrice && (
                          <span className="text-xs text-[#6B7088] line-through">
                            {formatRupiah(product.basePrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge status harga */}
                    {isCustomPrice ? (
                      <span className="text-[10px] font-bold text-[#C9A876] bg-[#FEF6E6] px-2.5 py-1 rounded-md border border-[#F7E5C4]">
                        Harga Khusus
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#6B7088] bg-[#F4F5F9] px-2 py-0.5 rounded border border-[#E7E8F0]">
                        Harga Pusat
                      </span>
                    )}
                  </div>

                  {/* Inline Price Override Form */}
                  {editingPriceId === product.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        value={inputOverride}
                        onChange={(e) => setInputOverride(e.target.value)}
                        placeholder={String(product.basePrice)}
                        className="w-full px-3 py-1.5 bg-[#F4F5F9] border border-[#C9A876] rounded-xl text-xs text-[#181F4B] font-bold focus:outline-none"
                      />
                      <button
                        onClick={() => handleSavePriceOverride(product.id)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-[#181F4B] text-[#C9A876] rounded-xl text-xs font-bold font-albert hover:bg-[#0E1230] transition shrink-0 cursor-pointer hover:scale-105 active:scale-95"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingPriceId(null)}
                        className="px-2 py-1.5 bg-[#F4F5F9] text-[#6B7088] hover:text-[#181F4B] rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setEditingPriceId(product.id);
                          setInputOverride(product.priceOverride ? String(product.priceOverride) : '');
                        }}
                        className="flex-1 py-1.5 px-3 bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 font-albert flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                      >
                        <Tag className="w-3.5 h-3.5 text-[#C9A876]" />
                        <span>Atur Harga Cabang</span>
                      </button>

                      {isCustomPrice && (
                        <button
                          onClick={() => handleResetPrice(product)}
                          disabled={isUpdating}
                          className="py-1.5 px-3 bg-[#FEF6E6] hover:bg-[#F7E5C4] border border-[#F7E5C4] text-[#C9A876] rounded-xl text-xs font-semibold transition-all duration-150 font-albert flex items-center gap-1 cursor-pointer hover:scale-105"
                          title="Reset ke Harga Pusat"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-[#6B7088]">
            <Coffee className="w-10 h-10 text-[#E7E8F0] mx-auto mb-2" />
            <p className="font-semibold text-sm text-[#1E202B]">Menu tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Reusable Pagination matching reference image */}
      <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(num) => {
            setItemsPerPage(num);
            setCurrentPage(1);
          }}
          itemsPerPageOptions={[6, 9, 12, 24]}
        />
      </div>
    </div>
  );
}
