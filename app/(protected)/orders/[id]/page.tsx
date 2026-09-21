'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { markOrderAsRead } from '@/lib/notifications';
import { StatusStepper } from '@/components/ui/StatusStepper';
import { Badge, OrderStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  RefreshCw,
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
  deliveryFee?: number;
  deliveryDistanceKm?: number | null;
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

const ORDER_STEPS = [
  { id: 'pending', label: 'Baru Masuk' },
  { id: 'preparing', label: 'Sedang Dibuat' },
  { id: 'ready', label: 'Siap Diambil / Antar' },
  { id: 'completed', label: 'Pesanan Selesai' },
];

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

  // Cancel Confirm Dialog State
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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
    setUpdating(true);
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setShowCancelDialog(false);
      await fetchOrderDetail();
    } catch (err: any) {
      alert(err?.message || 'Gagal memperbarui status order');
    } finally {
      setUpdating(false);
    }
  };

  const formatRupiah = (val: number) =>
    'Rp' + Math.max(0, Math.round(val || 0)).toLocaleString('id-ID');

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <RefreshCw className="w-8 h-8 text-[#C9A876] animate-spin mb-3" />
        <p className="font-albert font-bold text-[#181F4B] text-sm">Memuat detail transaksi...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-xl border border-[#C9576B]/30 p-8 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-[#C9576B] mx-auto mb-3" />
        <h2 className="text-base font-bold font-albert text-[#181F4B] mb-1">Terjadi Kesalahan</h2>
        <p className="text-xs text-[#6B7088] mb-4">{error || 'Pesanan tidak ditemukan'}</p>
        <Link href="/orders">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Kembali ke Daftar Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4.5 rounded-xl border border-[#E7E8F0] shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <button className="w-8 h-8 rounded-lg bg-[#F4F5F9] border border-[#E7E8F0] flex items-center justify-center text-[#181F4B] hover:bg-[#EAEBF2] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-albert text-[#181F4B]">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.orderStatus} />
              <Badge variant="navy">{order.outletName}</Badge>
            </div>
            <p className="text-xs text-[#6B7088] mt-0.5">
              Dibuat pada: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Status Transition Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {order.orderStatus === 'pending' && (
            <Button
              variant="gold"
              size="sm"
              loading={updating}
              onClick={() => handleUpdateStatus('preparing')}
              icon={<ChefHat className="w-4 h-4" />}
            >
              Mulai Buat Pesanan (Preparing)
            </Button>
          )}

          {order.orderStatus === 'preparing' && (
            <Button
              variant="primary"
              size="sm"
              loading={updating}
              onClick={() => handleUpdateStatus('ready')}
              icon={<PackageCheck className="w-4 h-4" />}
            >
              Tandai Siap (Ready)
            </Button>
          )}

          {order.orderStatus === 'ready' && (
            <Button
              variant="primary"
              size="sm"
              loading={updating}
              onClick={() => handleUpdateStatus('completed')}
              icon={<CheckSquare className="w-4 h-4" />}
            >
              Selesaikan Pesanan (Completed)
            </Button>
          )}

          {order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled' && (
            <Button
              variant="danger"
              size="sm"
              loading={updating}
              onClick={() => setShowCancelDialog(true)}
              icon={<XCircle className="w-3.5 h-3.5" />}
            >
              Batalkan
            </Button>
          )}
        </div>
      </div>

      {/* Progressive Status Stepper Card */}
      {order.orderStatus !== 'cancelled' && (
        <div className="bg-white p-4.5 rounded-xl border border-[#E7E8F0] shadow-xs">
          <p className="text-[11px] font-bold text-[#6B7088] uppercase tracking-wider font-albert mb-3">
            Tahapan Status Pesanan
          </p>
          <StatusStepper steps={ORDER_STEPS} currentStepId={order.orderStatus} />
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Items Table & Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Items Table */}
          <div className="bg-white rounded-xl border border-[#E7E8F0] shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-[#E7E8F0] bg-[#FAFAFD] flex items-center justify-between">
              <h2 className="font-albert font-bold text-xs text-[#181F4B] uppercase tracking-wider">
                Daftar Item Menu ({order.items?.length || 0})
              </h2>
            </div>
            <Table compact>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu</TableHead>
                  <TableHead>Kustomisasi</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item, idx) => {
                  const itemSubtotal = item.qty * item.unitPrice;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-xs text-[#181F4B]">
                        {item.productNameSnapshot}
                      </TableCell>
                      <TableCell className="text-[11px] text-[#6B7088]">
                        <div className="space-y-0.5">
                          {item.size && <span>Ukuran: {item.size} • </span>}
                          {item.temperature && <span>{item.temperature} • </span>}
                          {item.sugar && <span>Gula: {item.sugar} • </span>}
                          {item.ice && <span>Es: {item.ice}</span>}
                          {item.addons && item.addons.length > 0 && (
                            <div className="text-[10.5px] text-[#C9A876] font-semibold mt-0.5">
                              Addons: {item.addons.map((a) => a.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">
                        {item.qty}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatRupiah(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#181F4B] font-albert text-xs">
                        {formatRupiah(itemSubtotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Payment Calculation Summary */}
            <div className="p-4 bg-[#FAFAFD] border-t border-[#E7E8F0] space-y-2 text-xs">
              <div className="flex justify-between text-[#6B7088]">
                <span>Subtotal Menu:</span>
                <span className="font-semibold text-[#1E202B]">{formatRupiah(order.subtotal)}</span>
              </div>
              {(order.fulfillmentType === 'delivery' || (order.deliveryFee ?? 0) > 0) && (
                <div className="flex justify-between text-[#6B7088]">
                  <span>
                    Ongkos Kirim (Delivery){order.deliveryDistanceKm ? ` [${order.deliveryDistanceKm} km]` : ''}:
                  </span>
                  <span className="font-semibold text-[#1E202B]">{formatRupiah(order.deliveryFee || 0)}</span>
                </div>
              )}
              {order.serviceFee > 0 && (
                <div className="flex justify-between text-[#6B7088]">
                  <span>Biaya Layanan:</span>
                  <span className="font-semibold text-[#1E202B]">{formatRupiah(order.serviceFee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-[#C9576B]">
                  <span>Diskon Voucher:</span>
                  <span className="font-bold">-{formatRupiah(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#181F4B] font-albert pt-2 border-t border-[#E7E8F0]">
                <span>Total Pembayaran:</span>
                <span className="text-[#C9A876] text-base">{formatRupiah(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-xl border border-[#E7E8F0] shadow-xs p-4">
            <h2 className="font-albert font-bold text-xs text-[#181F4B] uppercase tracking-wider mb-3">
              Riwayat Perubahan Status
            </h2>
            <div className="space-y-2">
              {order.logs && order.logs.length > 0 ? (
                order.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-[#F0F1F6] last:border-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C9A876]" />
                      <span className="font-bold text-[#181F4B] capitalize">{log.status}</span>
                      {log.staffName && (
                        <span className="text-[11px] text-[#6B7088]">oleh {log.staffName}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8B93B8]">{formatDate(log.changedAt)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#8B93B8] italic">Belum ada riwayat perubahan status.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Customer & Delivery Details */}
        <div className="space-y-4">
          {/* Customer Card */}
          <div className="bg-white rounded-xl border border-[#E7E8F0] shadow-xs p-4 space-y-3">
            <h3 className="font-albert font-bold text-xs text-[#181F4B] uppercase tracking-wider border-b border-[#E7E8F0] pb-2">
              Informasi Pelanggan
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#F4F5F9] flex items-center justify-center text-[#181F4B] shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] text-[#8B93B8]">Nama Pemesan</p>
                  <p className="font-bold text-[#1E202B]">{order.customerName || 'Tamu'}</p>
                </div>
              </div>

              {order.customerPhone && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-[#F4F5F9] flex items-center justify-center text-[#181F4B] shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#8B93B8]">No. WhatsApp / HP</p>
                    <p className="font-bold text-[#1E202B]">{order.customerPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Card */}
          <div className="bg-white rounded-xl border border-[#E7E8F0] shadow-xs p-4 space-y-3">
            <h3 className="font-albert font-bold text-xs text-[#181F4B] uppercase tracking-wider border-b border-[#E7E8F0] pb-2">
              Metode Pengambilan
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    order.fulfillmentType === 'delivery'
                      ? 'bg-[#EDF0FA] text-[#3B4B8C]'
                      : 'bg-[#FEF6E6] text-[#C9A876]'
                  }`}
                >
                  {order.fulfillmentType === 'delivery' ? 'Pengantaran (Delivery)' : 'Ambil Sendiri (Pickup)'}
                </span>
              </div>

              {order.fulfillmentType === 'delivery' && (
                <div className="mt-2 text-xs">
                  <p className="text-[11px] text-[#8B93B8] font-bold">Alamat Pengantaran:</p>
                  <p className="text-[#1E202B] mt-0.5 leading-relaxed bg-[#F8F9FD] p-2.5 rounded-lg border border-[#E7E8F0]">
                    {order.deliveryAddress || 'Alamat tidak diisi'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-xl border border-[#E7E8F0] shadow-xs p-4 space-y-3">
            <h3 className="font-albert font-bold text-xs text-[#181F4B] uppercase tracking-wider border-b border-[#E7E8F0] pb-2">
              Metode Pembayaran
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7088]">Channel:</span>
                <span className="font-bold text-[#181F4B]">{order.paymentMethodName || 'Midtrans / Gateway'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7088]">Status:</span>
                <span
                  className={`font-bold inline-flex items-center gap-1.5 ${
                    order.paymentStatus === 'paid' ? 'text-[#3E8A5A]' : 'text-[#C9576B]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      order.paymentStatus === 'paid' ? 'bg-[#3E8A5A]' : 'bg-[#C9576B]'
                    }`}
                  />
                  {order.paymentStatus === 'paid' ? 'Lunas (Paid)' : 'Belum Lunas'}
                </span>
              </div>
              {order.paidAt && (
                <div className="flex items-center justify-between text-[11px] text-[#8B93B8]">
                  <span>Dibayar pada:</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={() => handleUpdateStatus('cancelled')}
        title="Batalkan Pesanan?"
        message={`Apakah Anda yakin ingin membatalkan pesanan ${order.orderNumber}? Tindakan ini akan mengubah status menjadi Batal.`}
        confirmLabel="Ya, Batalkan"
        cancelLabel="Kembali"
        variant="danger"
        loading={updating}
      />
    </div>
  );
}
