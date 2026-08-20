'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { markOrderAsRead } from '@/lib/notifications';
import {
  ArrowLeft,
  Coffee,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  CreditCard,
  User,
  Phone,
  ChefHat,
  PackageCheck,
  CheckSquare,
  XCircle,
} from 'lucide-react';

interface OrderDetailItem {
  id: number | string;
  productId: string;
  productNameSnapshot: string;
  qty: number;
  size?: string | null;
  temperature?: string | null;
  sugar?: string | null;
  ice?: string | null;
  unitPrice: number;
  addons?: Array<{ name: string; price: number }>;
}

interface OrderDetailLog {
  id: number | string;
  status: string;
  staffName?: string | null;
  changedAt: string;
}

interface OrderDetailData {
  id: number | string;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  outletId: number;
  outletName: string;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  subtotal: number;
  discount: number;
  serviceFee: number;
  total: number;
  paymentStatus: 'paid' | 'unpaid' | 'failed';
  orderStatus: string;
  paidAt?: string;
  createdAt: string;
  items: OrderDetailItem[];
  logs: OrderDetailLog[];
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OrderDetailData>(`/api/orders/${orderId}`);
      setOrder(data);
      if (data?.id) {
        markOrderAsRead(data.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    setError(null);

    try {
      await apiFetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      // Refresh data
      await fetchOrderDetail();
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui status pesanan');
    } finally {
      setUpdating(false);
    }
  };

  const formatRupiah = (val: number) =>
    'Rp' + Math.max(0, Math.round(val || 0)).toLocaleString('id-ID');

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="badge badge-success">COMPLETED</span>;
      case 'preparing':
      case 'confirmed':
        return <span className="badge badge-warning">PREPARING</span>;
      case 'ready':
      case 'on_delivery':
        return <span className="badge badge-info font-bold">READY</span>;
      case 'cancelled':
        return <span className="badge badge-danger">CANCELLED</span>;
      default:
        return <span className="badge badge-info">{status?.toUpperCase() || 'PENDING'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#6B7088] font-source">
        <div className="w-8 h-8 border-3 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-sm">Memuat detail pesanan #{orderId}...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 font-source">
        <div className="p-4 bg-[#FDF0F2] border border-[#FAF1F3] rounded-2xl text-[#C9576B] text-xs font-semibold">
          {error || 'Pesanan tidak ditemukan'}
        </div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#181F4B] text-[#C9A876] rounded-xl text-xs font-bold font-albert"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Orders</span>
        </Link>
      </div>
    );
  }

  const status = order.orderStatus?.toLowerCase();

  return (
    <div className="space-y-6 font-source max-w-5xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 rounded-xl bg-white border border-[#E7E8F0] hover:bg-[#F4F5F9] text-[#181F4B] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-[#181F4B]">
                {order.orderNumber}
              </h1>
              {getStatusBadge(order.orderStatus)}
            </div>
            <p className="text-xs text-[#6B7088] mt-0.5">
              Dibuat pada {order.createdAt ? new Date(order.createdAt).toLocaleString('id-ID') : '-'}
            </p>
          </div>
        </div>

        {/* Dynamic Status Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {(status === 'checkout' || status === 'confirmed' || status === 'pending') && (
            <button
              onClick={() => handleUpdateStatus('preparing')}
              disabled={updating}
              className="px-4 py-2 bg-[#C9A876] hover:bg-[#d4b382] text-[#0E1230] font-bold rounded-xl text-xs transition font-albert inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ChefHat className="w-4 h-4" />
              <span>Mark as Preparing</span>
            </button>
          )}

          {status === 'preparing' && (
            <button
              onClick={() => handleUpdateStatus('ready')}
              disabled={updating}
              className="px-4 py-2 bg-[#3B4B8C] hover:bg-[#2d3a6e] text-white font-bold rounded-xl text-xs transition font-albert inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <PackageCheck className="w-4 h-4 text-[#C9A876]" />
              <span>Mark as Ready</span>
            </button>
          )}

          {(status === 'ready' || status === 'on_delivery') && (
            <button
              onClick={() => handleUpdateStatus('completed')}
              disabled={updating}
              className="px-4 py-2 bg-[#3E8A5A] hover:bg-[#326f48] text-white font-bold rounded-xl text-xs transition font-albert inline-flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark as Completed</span>
            </button>
          )}

          {status !== 'completed' && status !== 'cancelled' && (
            <button
              onClick={() => handleUpdateStatus('cancelled')}
              disabled={updating}
              className="px-3 py-2 bg-white hover:bg-[#FDF0F2] border border-[#C9576B]/40 text-[#C9576B] font-semibold rounded-xl text-xs transition font-albert inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Batalkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout: Left Info Columns & Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Order Details & Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Fulfillment Info */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7E8F0] shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7088] mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#C9A876]" />
                Informasi Pelanggan
              </h3>
              <p className="font-bold text-sm text-[#181F4B] font-albert">
                {order.customerName || 'Pelanggan Coffee Lab'}
              </p>
              {order.customerPhone && (
                <p className="text-xs text-[#6B7088] mt-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.customerPhone}</span>
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7088] mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C9A876]" />
                Fulfillment & Cabang
              </h3>
              <p className="font-bold text-sm text-[#181F4B] capitalize font-albert">
                {order.fulfillmentType || 'pickup'} • {order.outletName}
              </p>
              {order.fulfillmentType === 'delivery' && order.deliveryAddress && (
                <p className="text-xs text-[#6B7088] mt-1 leading-relaxed">
                  {order.deliveryAddress}
                </p>
              )}
            </div>
          </div>

          {/* Items Order List Table */}
          <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E7E8F0] bg-[#F6F3EC]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#181F4B] font-albert flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#C9A876]" />
                Daftar Produk Pesanan ({order.items?.length || 0} item)
              </h3>
            </div>

            <div className="divide-y divide-[#E7E8F0]">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => {
                  const itemTotal = item.unitPrice * item.qty;
                  return (
                    <div key={idx} className="p-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-[#181F4B] font-albert">
                          {item.productNameSnapshot}
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-[#6B7088]">
                          {item.size && (
                            <span className="px-2 py-0.5 rounded bg-[#F4F5F9] border border-[#E7E8F0]">
                              Size: {item.size}
                            </span>
                          )}
                          {item.temperature && (
                            <span className="px-2 py-0.5 rounded bg-[#F4F5F9] border border-[#E7E8F0]">
                              Temp: {item.temperature}
                            </span>
                          )}
                          {item.ice && (
                            <span className="px-2 py-0.5 rounded bg-[#F4F5F9] border border-[#E7E8F0]">
                              Ice: {item.ice}
                            </span>
                          )}
                          {item.sugar && (
                            <span className="px-2 py-0.5 rounded bg-[#F4F5F9] border border-[#E7E8F0]">
                              Sugar: {item.sugar}
                            </span>
                          )}
                        </div>

                        {item.addons && item.addons.length > 0 && (
                          <p className="text-[11px] text-[#C9A876] font-medium pt-0.5">
                            Addons: {item.addons.map((a) => a.name).join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-[#181F4B] font-albert">
                          {formatRupiah(itemTotal)}
                        </p>
                        <p className="text-[11px] text-[#6B7088]">
                          {item.qty} x {formatRupiah(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-[#6B7088]">
                  Tidak ada detail item pesanan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Price Summary */}
        <div className="space-y-6">
          {/* Payment Method & Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7E8F0] shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7088] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#C9A876]" />
              Metode Pembayaran
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F9] border border-[#E7E8F0]">
              <span className="text-xs font-semibold text-[#181F4B] font-albert">
                {order.paymentMethodName || 'Metode Pembayaran'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  order.paymentStatus === 'paid'
                    ? 'bg-[#EAF5EE] text-[#3E8A5A] border border-[#C6E7D2]'
                    : 'bg-[#FDF0F2] text-[#C9576B] border border-[#FAF1F3]'
                }`}
              >
                {order.paymentStatus || 'unpaid'}
              </span>
            </div>
          </div>

          {/* Pricing Breakdown Summary */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7E8F0] shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181F4B] font-albert border-b border-[#E7E8F0] pb-2">
              Rincian Pembayaran
            </h3>

            <div className="flex justify-between text-xs text-[#6B7088]">
              <span>Subtotal Produk</span>
              <span className="font-semibold text-[#181F4B]">
                {formatRupiah(order.subtotal)}
              </span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-[#3E8A5A]">
                <span>Diskon Voucher</span>
                <span className="font-semibold">
                  -{formatRupiah(order.discount)}
                </span>
              </div>
            )}

            {order.serviceFee > 0 && (
              <div className="flex justify-between text-xs text-[#6B7088]">
                <span>Biaya Layanan / Delivery</span>
                <span className="font-semibold text-[#181F4B]">
                  {formatRupiah(order.serviceFee)}
                </span>
              </div>
            )}

            <div className="border-t border-[#E7E8F0] pt-3 flex justify-between items-center">
              <span className="text-xs font-bold text-[#181F4B] font-albert">
                Total Pembayaran
              </span>
              <span className="text-lg font-bold text-[#181F4B] font-albert">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
