'use client';

import { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getImageUrl } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  AlertCircle,
  ShieldAlert,
  Coffee,
  CheckCircle2,
  Info,
  Upload,
  Image as ImageIcon,
  Tags,
  FolderPlus,
  Layers,
} from 'lucide-react';

interface CategoryItem {
  id: number;
  name: string;
  groupName: 'beverage' | 'food';
}

interface MasterAddon {
  id?: number;
  name: string;
  extraPrice: number;
  isPopular?: boolean;
}

interface MasterProduct {
  id: string;
  name: string;
  type: 'beverage' | 'food';
  basePrice: number;
  description?: string | null;
  categoryName?: string | null;
  categoryId?: number | null;
  isBestseller?: boolean;
  isNew?: boolean;
  imageUrl?: string | null;
  addons?: MasterAddon[];
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function MasterProductsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [staff, setStaff] = useState<StaffPayload | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'beverage' | 'food'>('beverage');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formIsBestseller, setFormIsBestseller] = useState<boolean>(false);
  const [formIsNew, setFormIsNew] = useState<boolean>(false);
  const [formAddons, setFormAddons] = useState<MasterAddon[]>([]);
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('');

  // Delete Product Confirm State
  const [deletingProduct, setDeletingProduct] = useState<MasterProduct | null>(null);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState('');
  const [catGroupName, setCatGroupName] = useState<'beverage' | 'food'>('beverage');
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      const s = parseStaffToken(token);
      setStaff(s);
      if (s && s.role !== 'super_admin') {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: CategoryItem[] }>('/api/categories');
      if (Array.isArray(res?.data)) {
        setCategories(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: MasterProduct[] }>('/api/products');
      if (Array.isArray(res?.data)) {
        setProducts(res.data);
      } else if (Array.isArray(res)) {
        setProducts(res as any);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar produk master');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // Product Handlers
  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormType('beverage');
    setFormCategoryId(categories.length > 0 ? String(categories[0].id) : '');
    setFormBasePrice('');
    setFormDesc('');
    setFormImageUrl(null);
    setFormIsBestseller(false);
    setFormIsNew(false);
    setFormAddons([]);
    setAddonName('');
    setAddonPrice('');
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const openEditProductModal = (p: MasterProduct) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormType(p.type);
    setFormCategoryId(p.categoryId ? String(p.categoryId) : '');
    setFormBasePrice(String(p.basePrice));
    setFormDesc(p.description || '');
    setFormImageUrl(p.imageUrl || null);
    setFormIsBestseller(Boolean(p.isBestseller));
    setFormIsNew(Boolean(p.isNew));
    setFormAddons(p.addons ? [...p.addons] : []);
    setAddonName('');
    setAddonPrice('');
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(
          2
        )}MB) melebihi batas maksimum 5MB. Silakan gunakan gambar yang lebih kecil.`
      );
      e.target.value = '';
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res?.url) {
        setFormImageUrl(res.url);
        setInfoMessage('Gambar berhasil diunggah.');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunggah gambar produk');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormImageUrl(null);
    setInfoMessage('Foto produk telah dibatalkan / dihapus.');
  };

  const handleAddAddon = () => {
    if (!addonName.trim() || !addonPrice) return;
    setFormAddons((prev) => [
      ...prev,
      { name: addonName.trim(), extraPrice: Number(addonPrice) },
    ]);
    setAddonName('');
    setAddonPrice('');
  };

  const handleRemoveAddon = (index: number) => {
    setFormAddons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBasePrice) {
      setError('Nama produk dan harga dasar wajib diisi');
      return;
    }

    const categoryIdNum = formCategoryId ? Number(formCategoryId) : null;

    if (editingProduct) {
      const isUnchanged =
        formName.trim() === editingProduct.name &&
        formType === editingProduct.type &&
        categoryIdNum === (editingProduct.categoryId ?? null) &&
        Number(formBasePrice) === editingProduct.basePrice &&
        (formDesc.trim() || null) === (editingProduct.description || null) &&
        (formImageUrl || null) === (editingProduct.imageUrl || null) &&
        formIsBestseller === Boolean(editingProduct.isBestseller) &&
        formIsNew === Boolean(editingProduct.isNew) &&
        JSON.stringify(formAddons) === JSON.stringify(editingProduct.addons || []);

      if (isUnchanged) {
        setInfoMessage('Tidak ada perubahan yang disimpan.');
        setModalOpen(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: formName.trim(),
      type: formType,
      categoryId: categoryIdNum,
      basePrice: Number(formBasePrice),
      description: formDesc.trim() || null,
      imageUrl: formImageUrl || null,
      isBestseller: formIsBestseller,
      isNew: formIsNew,
      addons: formAddons,
    };

    try {
      if (editingProduct) {
        await apiFetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Produk "${formName.trim()}" berhasil diperbarui.`);
      } else {
        await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Produk baru "${formName.trim()}" berhasil ditambahkan.`);
      }

      setModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      });
      setInfoMessage(`Produk "${deletingProduct.name}" berhasil dihapus.`);
      setDeletingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus produk');
    } finally {
      setLoading(false);
    }
  };

  // Category Handlers
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatGroupName('beverage');
    setError(null);
    setInfoMessage(null);
    setCatModalOpen(true);
  };

  const openEditCategoryModal = (c: CategoryItem) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatGroupName(c.groupName);
    setError(null);
    setInfoMessage(null);
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }

    if (editingCategory) {
      const isUnchanged =
        catName.trim() === editingCategory.name &&
        catGroupName === editingCategory.groupName;

      if (isUnchanged) {
        setInfoMessage('Tidak ada perubahan yang disimpan.');
        setCatModalOpen(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: catName.trim(),
      groupName: catGroupName,
    };

    try {
      if (editingCategory) {
        await apiFetch(`/api/categories/${editingCategory.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Kategori "${catName.trim()}" berhasil diperbarui.`);
      } else {
        await apiFetch('/api/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Kategori baru "${catName.trim()}" berhasil ditambahkan.`);
      }

      setCatModalOpen(false);
      await fetchCategories();
      await fetchProducts();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      setInfoMessage(`Kategori "${deletingCategory.name}" berhasil dihapus.`);
      setDeletingCategory(null);
      await fetchCategories();
      await fetchProducts();
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus kategori');
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q));

    const matchCategory =
      selectedCategoryFilter === 'all' ||
      (p.categoryName && p.categoryName.toLowerCase() === selectedCategoryFilter.toLowerCase());

    return matchQuery && matchCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (staff && staff.role !== 'super_admin') {
    return (
      <div className="py-24 text-center space-y-4 font-source max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-[#C9576B] mx-auto" />
        <h2 className="text-lg font-bold font-albert text-[#181F4B]">Akses Dibatasi</h2>
        <p className="text-xs text-[#6B7088]">
          Halaman Master Menu hanya dapat diakses oleh Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-source">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-albert text-[#181F4B] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#C9A876]" />
            Master Menu & Kategori
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Kelola katalog produk master, struktur kategori menu, foto produk, dan pilihan opsi addons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchCategories();
              fetchProducts();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {activeTab === 'products' ? (
            <button
              onClick={openAddProductModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] rounded-xl text-xs font-bold font-albert transition-all duration-150 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Menu Baru</span>
            </button>
          ) : (
            <button
              onClick={openAddCategoryModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] rounded-xl text-xs font-bold font-albert transition-all duration-150 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          )}
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

      {/* Mode Switcher Tabs (Like Loyalty & Tier) */}
      <div className="flex bg-white p-1 rounded-2xl border border-[#E7E8F0] shadow-xs max-w-md">
        <button
          onClick={() => {
            setActiveTab('products');
            setError(null);
            setInfoMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-albert transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-[#181F4B] text-[#C9A876] shadow-sm'
              : 'text-[#6B7088] hover:text-[#181F4B]'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Master Menu & Produk</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('categories');
            setError(null);
            setInfoMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-albert transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-[#181F4B] text-[#C9A876] shadow-sm'
              : 'text-[#6B7088] hover:text-[#181F4B]'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Kelola Kategori Menu</span>
        </button>
      </div>

      {/* TAB 1: MASTER PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Category Filter Pills */}
          <div className="bg-white p-4 rounded-2xl border border-[#E7E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama produk menu atau kategori..."
                className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedCategoryFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-albert transition whitespace-nowrap cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-[#181F4B] text-[#C9A876]'
                    : 'bg-[#F4F5F9] text-[#6B7088] hover:text-[#181F4B]'
                }`}
              >
                Semua ({products.length})
              </button>

              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.categoryName?.toLowerCase() === cat.name.toLowerCase()
                ).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryFilter(cat.name);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-albert transition whitespace-nowrap cursor-pointer ${
                      selectedCategoryFilter.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-[#181F4B] text-[#C9A876]'
                        : 'bg-[#F4F5F9] text-[#6B7088] hover:text-[#181F4B]'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master Products Table */}
          <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F3EC] border-b border-[#E7E8F0] text-[#6B7088] uppercase tracking-wider font-bold font-albert text-[11px]">
                    <th className="py-3.5 px-4">Menu Produk</th>
                    <th className="py-3.5 px-4">Kategori Menu</th>
                    <th className="py-3.5 px-4">Harga Pusat (Base)</th>
                    <th className="py-3.5 px-4">Pilihan Addons</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8F0]">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#6B7088]">
                        <div className="w-6 h-6 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Memuat master menu...</span>
                      </td>
                    </tr>
                  ) : paginatedProducts.length > 0 ? (
                    paginatedProducts.map((product) => {
                      const resolvedImg = getImageUrl(product.imageUrl);

                      return (
                        <tr key={product.id} className="hover:bg-[#F4F5F9] transition">
                          {/* Image & Product Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-[#F6F3EC] border border-[#E7E8F0] overflow-hidden shrink-0 flex items-center justify-center">
                                {resolvedImg ? (
                                  <img
                                    src={resolvedImg}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Coffee className="w-5 h-5 text-[#C9A876]" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-[#181F4B] font-albert text-sm">
                                    {product.name}
                                  </p>
                                  {product.isBestseller && (
                                    <span className="bg-[#181F4B] text-[#C9A876] text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                                      BEST SELLER
                                    </span>
                                  )}
                                  {product.isNew && (
                                    <span className="bg-[#C9576B] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                                      BARU
                                    </span>
                                  )}
                                </div>
                                {product.description && (
                                  <p className="text-xs text-[#6B7088] line-clamp-1">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-bold text-xs text-[#181F4B] bg-[#F4F5F9] px-2.5 py-1 rounded-lg border border-[#E7E8F0]">
                              <Tags className="w-3 h-3 text-[#C9A876]" />
                              {product.categoryName || 'Tanpa Kategori'}
                            </span>
                          </td>

                          {/* Base Price */}
                          <td className="py-3.5 px-4 font-bold text-[#181F4B] font-albert">
                            Rp {product.basePrice.toLocaleString('id-ID')}
                          </td>

                          {/* Addons List */}
                          <td className="py-3.5 px-4">
                            {product.addons && product.addons.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {product.addons.map((a, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-[#FEF6E6] text-[#181F4B] font-semibold px-2 py-0.5 rounded border border-[#F7E5C4]"
                                  >
                                    +{a.name} (+Rp {a.extraPrice.toLocaleString('id-ID')})
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-[#6B7088] opacity-60">
                                Tanpa Addon
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditProductModal(product)}
                                className="p-1.5 rounded-lg bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-transparent text-[#181F4B] transition cursor-pointer hover:scale-105"
                                title="Edit Produk"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingProduct(product)}
                                className="p-1.5 rounded-lg bg-[#FDF0F2] hover:bg-[#FAF1F3] border border-transparent text-[#C9576B] transition cursor-pointer hover:scale-105"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-[#6B7088]">
                        <Coffee className="w-8 h-8 text-[#E7E8F0] mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#1E202B]">
                          Produk menu tidak ditemukan
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
            />
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E7E8F0] shadow-xs flex items-center justify-between">
            <h2 className="font-bold text-sm font-albert text-[#181F4B] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C9A876]" />
              Daftar Kategori Menu ({categories.length})
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F3EC] border-b border-[#E7E8F0] text-[#6B7088] uppercase tracking-wider font-bold font-albert text-[11px]">
                    <th className="py-3.5 px-4">Nama Kategori</th>
                    <th className="py-3.5 px-4">Tipe Group</th>
                    <th className="py-3.5 px-4">Jumlah Produk Terkait</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8F0]">
                  {categories.length > 0 ? (
                    categories.map((cat) => {
                      const count = products.filter(
                        (p) => p.categoryName?.toLowerCase() === cat.name.toLowerCase()
                      ).length;

                      return (
                        <tr key={cat.id} className="hover:bg-[#F4F5F9] transition">
                          <td className="py-3.5 px-4 font-bold text-[#181F4B] font-albert text-sm">
                            {cat.name}
                          </td>
                          <td className="py-3.5 px-4">
                            {cat.groupName === 'beverage' ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-[10px] text-[#3B4B8C] bg-[#EDF0FA] px-2.5 py-1 rounded-full border border-[#D2D9F3]">
                                <Coffee className="w-3 h-3 text-[#3B4B8C]" />
                                <span>Beverage (Minuman)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-bold text-[10px] text-[#C9A876] bg-[#FEF6E6] px-2.5 py-1 rounded-full border border-[#F7E5C4]">
                                <Package className="w-3 h-3 text-[#C9A876]" />
                                <span>Food (Makanan/Pastry)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#6B7088]">
                            {count} Produk Master
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditCategoryModal(cat)}
                                className="p-1.5 rounded-lg bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-transparent text-[#181F4B] transition cursor-pointer hover:scale-105"
                                title="Edit Kategori"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingCategory(cat)}
                                className="p-1.5 rounded-lg bg-[#FDF0F2] hover:bg-[#FAF1F3] border border-transparent text-[#C9576B] transition cursor-pointer hover:scale-105"
                                title="Hapus Kategori"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-[#6B7088]">
                        <Tags className="w-8 h-8 text-[#E7E8F0] mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#1E202B]">
                          Belum ada kategori menu
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                {editingProduct ? 'Edit Master Menu' : 'Tambah Master Menu Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Nama Menu Produk
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Kopi Susu Gula Aren"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Pilih Kategori Menu
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="">-- Tanpa Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Tipe Produk
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none cursor-pointer"
                  >
                    <option value="beverage">Beverage (Minuman)</option>
                    <option value="food">Food (Makanan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Harga Awal Pusat (Base Price in Rp)
                </label>
                <input
                  type="number"
                  value={formBasePrice}
                  onChange={(e) => setFormBasePrice(e.target.value)}
                  placeholder="25000"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] font-bold focus:outline-none focus:border-[#C9A876]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Foto Produk Menu
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#F6F3EC] border border-[#E7E8F0] overflow-hidden shrink-0 flex items-center justify-center relative group shadow-xs">
                    {formImageUrl && getImageUrl(formImageUrl) ? (
                      <img
                        src={getImageUrl(formImageUrl) || undefined}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#9AA0A6]" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer">
                      <span className="px-3.5 py-2 bg-[#F4F5F9] hover:bg-[#E7E8F0] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] inline-flex items-center gap-2 transition cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#C9A876]" />
                        {uploading ? 'Mengunggah...' : formImageUrl ? 'Ganti Foto' : 'Pilih File Gambar (Max 5MB)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>

                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                        className="px-3 py-2 bg-[#FDF0F2] hover:bg-[#FAF1F3] border border-[#FAD4DB] rounded-xl text-xs font-bold text-[#C9576B] inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Hapus / Batal upload foto produk ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#C9576B]" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>
                </div>
                {formImageUrl ? (
                  <p className="text-[11px] text-[#3E8A5A] font-semibold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#3E8A5A]" />
                    <span>Foto produk terpasang. Klik "Hapus Foto" jika ingin mengosongkan foto produk.</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#6B7088] mt-1.5">
                    *Format gambar disarankan JPG, PNG, atau WebP (Maksimal 5MB).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Deskripsi Singkat Produk
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Kopi espresso dengan susu segar dan rasa gula aren khas..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                />
              </div>

              {/* Status Label Section (Best Seller / New / Normal) */}
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1.5">
                  Label Status Produk (Opsional)
                </label>
                <div className="flex items-center gap-4 bg-[#F4F5F9] p-3 rounded-xl border border-[#E7E8F0]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#181F4B]">
                    <input
                      type="checkbox"
                      checked={formIsBestseller}
                      onChange={(e) => setFormIsBestseller(e.target.checked)}
                      className="w-4 h-4 rounded text-[#181F4B] focus:ring-[#C9A876] cursor-pointer"
                    />
                    <span className="bg-[#181F4B] text-[#C9A876] text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider">
                      BEST SELLER
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#181F4B]">
                    <input
                      type="checkbox"
                      checked={formIsNew}
                      onChange={(e) => setFormIsNew(e.target.checked)}
                      className="w-4 h-4 rounded text-[#C9576B] focus:ring-[#C9576B] cursor-pointer"
                    />
                    <span className="bg-[#C9576B] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wider">
                      BARU (NEW)
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-[#6B7088] mt-1">
                  *Bisa mencentang salah satu, keduanya, atau dikosongkan (untuk produk biasa).
                </p>
              </div>

              {/* Addons Manager Section */}
              <div className="pt-2 border-t border-[#E7E8F0] space-y-2">
                <label className="block text-xs font-bold text-[#181F4B] font-albert">
                  Kelola Opsi Addon (Varian Tambahan)
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addonName}
                    onChange={(e) => setAddonName(e.target.value)}
                    placeholder="Nama Addon (misal Extra Shot)"
                    className="flex-1 px-3 py-1.5 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                  <input
                    type="number"
                    value={addonPrice}
                    onChange={(e) => setAddonPrice(e.target.value)}
                    placeholder="Harga (Rp)"
                    className="w-28 px-3 py-1.5 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddAddon}
                    className="px-3 py-1.5 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {formAddons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formAddons.map((addon, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 bg-[#FEF6E6] border border-[#F7E5C4] px-2.5 py-1 rounded-lg text-xs text-[#181F4B] font-semibold"
                      >
                        <span>
                          {addon.name} (+Rp {addon.extraPrice.toLocaleString('id-ID')})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddon(index)}
                          className="text-[#C9576B] hover:text-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E7E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#F4F5F9] hover:bg-[#E7E8F0] text-[#6B7088] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-5 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold text-xs rounded-xl transition shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                {editingCategory ? 'Edit Kategori Menu' : 'Tambah Kategori Baru'}
              </h3>
              <button
                onClick={() => setCatModalOpen(false)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Nama Kategori (misal Flavored Latte, Manual Brew, Pastry)
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="misal Flavored Latte"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none focus:border-[#C9A876]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Tipe Group Kategori
                </label>
                <select
                  value={catGroupName}
                  onChange={(e) => setCatGroupName(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none cursor-pointer"
                >
                  <option value="beverage">Beverage (Minuman)</option>
                  <option value="food">Food (Makanan/Pastry)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#E7E8F0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 bg-[#F4F5F9] hover:bg-[#E7E8F0] text-[#6B7088] font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold text-xs rounded-xl transition shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirm Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-[#E7E8F0]">
            <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#C9576B] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                Hapus Produk Master?
              </h3>
              <p className="text-xs text-[#6B7088] mt-1">
                Produk <span className="font-bold text-[#181F4B]">"{deletingProduct.name}"</span> akan dihapus permanen.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="flex-1 py-2.5 bg-[#F4F5F9] text-[#6B7088] font-bold text-xs rounded-xl cursor-pointer hover:bg-[#E7E8F0]"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#C9576B] text-white font-bold text-xs rounded-xl hover:bg-red transition cursor-pointer hover:scale-[1.02]"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirm Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-[#E7E8F0]">
            <div className="w-12 h-12 rounded-full bg-[#FDF0F2] text-[#C9576B] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                Hapus Kategori Menu?
              </h3>
              <p className="text-xs text-[#6B7088] mt-1">
                Kategori <span className="font-bold text-[#181F4B]">"{deletingCategory.name}"</span> akan dihapus. Produk dalam kategori ini akan diubah menjadi tanpa kategori.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="flex-1 py-2.5 bg-[#F4F5F9] text-[#6B7088] font-bold text-xs rounded-xl cursor-pointer hover:bg-[#E7E8F0]"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#C9576B] text-white font-bold text-xs rounded-xl hover:bg-red transition cursor-pointer hover:scale-[1.02]"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
