'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getImageUrl } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmptyState } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import Pagination from '@/components/Pagination';
import {
  Tags,
  Search,
  RefreshCw,
  RotateCcw,
  Coffee,
  AlertCircle,
  Tag,
  Store,
  Edit2,
  Check,
  X,
  Plus,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [staff, setStaff] = useState<StaffPayload | null>(null);
  const [outletId, setOutletId] = useState<number>(1);

  // Edit price override modal state
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);
  const [overrideInput, setOverrideInput] = useState('');
  const [stockNoteInput, setStockNoteInput] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      const res = await apiFetch<{ data: MenuProduct[] }>(`/api/outlets/${outletId}/menu`);
      let list: MenuProduct[] = [];
      if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res)) list = res as any;
      setProducts(list);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat menu outlet');
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Toggle Item Availability
  const handleToggleAvailability = async (product: MenuProduct) => {
    const newAvailable = !product.isAvailable;
    setUpdatingId(product.id);
    try {
      await apiFetch(`/api/products/${product.id}/outlets`, {
        method: 'PATCH',
        body: JSON.stringify({
          outletId,
          isAvailable: newAvailable,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isAvailable: newAvailable } : p
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah ketersediaan stok');
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Override Modal
  const openOverrideModal = (product: MenuProduct) => {
    setSelectedProduct(product);
    setOverrideInput(product.priceOverride ? String(product.priceOverride) : '');
    setStockNoteInput(product.stockNote || '');
  };

  // Save Price Override
  const handleSaveOverride = async () => {
    if (!selectedProduct) return;
    setSavingOverride(true);
    try {
      const parsedOverride = overrideInput.trim() ? Number(overrideInput.trim()) : null;
      await apiFetch(`/api/products/${selectedProduct.id}/outlets`, {
        method: 'PATCH',
        body: JSON.stringify({
          outletId,
          priceOverride: parsedOverride,
          stockNote: stockNoteInput.trim() || null,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? {
                ...p,
                priceOverride: parsedOverride,
                price: parsedOverride ?? p.basePrice,
                stockNote: stockNoteInput.trim() || null,
              }
            : p
        )
      );
      setSelectedProduct(null);
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan harga kustom cabang');
    } finally {
      setSavingOverride(false);
    }
  };

  // Reset to Base Price
  const handleResetPrice = async (productId: string | number) => {
    setUpdatingId(productId);
    try {
      await apiFetch(`/api/products/${productId}/outlets`, {
        method: 'PATCH',
        body: JSON.stringify({
          outletId,
          priceOverride: null,
        }),
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, priceOverride: null, price: p.basePrice } : p
        )
      );
    } catch (err: any) {
      alert(err?.message || 'Gagal mereset harga ke harga dasar');
    } finally {
      setUpdatingId(null);
    }
  };

  // Categories list
  const categories: string[] = [
    'all',
    ...Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter((c): c is string => Boolean(c))
      )
    ),
  ];

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Pagination Slice
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const formatRupiah = (val: number) =>
    'Rp' + Math.max(0, Math.round(val || 0)).toLocaleString('id-ID');

  const activeOutletName = outlets.find((o) => o.id === outletId)?.name || 'Outlet';

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-xl border border-[#E7E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold font-albert text-[#181F4B]">
              Menu & Stok Outlet
            </h1>
            <Badge variant="navy" dot>
              {activeOutletName}
            </Badge>
          </div>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Kelola ketersediaan stok menu dan harga kustom khusus cabang ({activeOutletName}).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <div className="w-52">
              <select
                value={outletId}
                onChange={(e) => {
                  setOutletId(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="select text-xs h-8"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchMenu}
            loading={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-[#E7E8F0] shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-3.5 border-b border-[#E7E8F0] bg-[#FAFAFD] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari nama menu / kategori..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              icon={<Search className="w-3.5 h-3.5" />}
              className="h-8 text-xs"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="select text-xs h-8"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Menu Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga Master</TableHead>
              <TableHead>Harga Jual Cabang</TableHead>
              <TableHead>Status Stok</TableHead>
              <TableHead>Catatan Stok</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedProducts.length === 0 ? (
              <TableEmptyState
                icon={<Coffee className="w-8 h-8 text-[#C9A876]" />}
                title="Tidak ada menu ditemukan"
                description={
                  searchQuery
                    ? `Tidak ada menu yang cocok dengan pencarian "${searchQuery}"`
                    : 'Belum ada menu produk di cabang ini.'
                }
              />
            ) : (
              paginatedProducts.map((prod) => {
                const isOverridden = prod.priceOverride !== null && prod.priceOverride !== undefined;
                const isUpdating = updatingId === prod.id;

                return (
                  <TableRow key={prod.id}>
                    {/* Product Name & Image */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#181F4B]/10 border border-[#E7E8F0] overflow-hidden shrink-0 flex items-center justify-center text-[#C9A876]">
                          {prod.imageUrl && getImageUrl(prod.imageUrl) ? (
                            <img
                              src={getImageUrl(prod.imageUrl) || ''}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Coffee className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#181F4B]">{prod.name}</p>
                          <p className="text-[10.5px] text-[#6B7088] line-clamp-1">{prod.description || '-'}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F4F5F9] text-[#6B7088] border border-[#E7E8F0]">
                        {prod.category || 'Umum'}
                      </span>
                    </TableCell>

                    {/* Base Price */}
                    <TableCell className="text-xs text-[#6B7088]">
                      {formatRupiah(prod.basePrice)}
                    </TableCell>

                    {/* Effective Price */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#181F4B] font-albert text-xs">
                          {formatRupiah(prod.price)}
                        </span>
                        {isOverridden && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-[#FEF6E6] text-[#C9A876] border border-[#F6E1BA]">
                            Override
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Availability Toggle Switch */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(prod)}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          prod.isAvailable
                            ? 'bg-[#EAF5EE] text-[#27613E] border border-[#C4E6D1]'
                            : 'bg-[#FDF0F2] text-[#8E2B3D] border border-[#F9CBD2]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            prod.isAvailable ? 'bg-[#3E8A5A]' : 'bg-[#C9576B]'
                          }`}
                        />
                        <span>{prod.isAvailable ? 'Tersedia (Ready)' : 'Habis (Sold Out)'}</span>
                      </button>
                    </TableCell>

                    {/* Stock Note */}
                    <TableCell className="text-[11px] text-[#6B7088] max-w-[150px] truncate">
                      {prod.stockNote || '-'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openOverrideModal(prod)}
                          icon={<Edit2 className="w-3 h-3" />}
                        >
                          Ubah Harga
                        </Button>

                        {isOverridden && (
                          <button
                            type="button"
                            onClick={() => handleResetPrice(prod.id)}
                            disabled={isUpdating}
                            title="Reset ke harga master"
                            className="w-7 h-7 rounded-md border border-[#E7E8F0] text-[#6B7088] hover:text-[#C9A876] hover:bg-[#FEF6E6] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {!loading && totalItems > 0 && (
          <div className="border-t border-[#E7E8F0] p-3 bg-[#FAFAFD]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Price Override Modal */}
      {selectedProduct && (
        <Modal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          title={`Ubah Harga Cabang: ${selectedProduct.name}`}
          subtitle={`Harga Master Global: ${formatRupiah(selectedProduct.basePrice)}`}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedProduct(null)}
                disabled={savingOverride}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveOverride}
                loading={savingOverride}
              >
                Simpan Perubahan
              </Button>
            </>
          }
        >
          <div className="space-y-3.5">
            <Input
              label="Harga Khusus Cabang (Rp)"
              type="number"
              placeholder={`Kosongkan untuk pakai harga dasar (${selectedProduct.basePrice})`}
              value={overrideInput}
              onChange={(e) => setOverrideInput(e.target.value)}
              hint="Masukkan nominal harga jika cabang ini menjual dengan harga berbeda."
            />

            <Input
              label="Catatan Stok (Opsional)"
              placeholder="Contoh: Sisa 5 porsi / Habis sementara"
              value={stockNoteInput}
              onChange={(e) => setStockNoteInput(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
