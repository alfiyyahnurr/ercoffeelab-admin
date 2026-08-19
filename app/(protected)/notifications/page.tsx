'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getStoredToken, parseStaffToken, StaffPayload } from '@/lib/auth';
import Pagination from '@/components/Pagination';
import {
  Bell,
  MessageSquare,
  Mail,
  Plus,
  Pencil,
  RefreshCw,
  X,
  AlertCircle,
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
} from 'lucide-react';

interface NotificationTemplate {
  id: number;
  code: string;
  channel: 'whatsapp' | 'email';
  subject?: string | null;
  bodyTemplate: string;
  isActive: boolean;
}

interface NotificationLog {
  id: number;
  templateCode?: string | null;
  orderId?: number | null;
  orderNumber?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  channel: string;
  target: string;
  payload?: any;
  response?: any;
  status: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [staff, setStaff] = useState<StaffPayload | null>(null);

  // Pagination for Logs
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Template Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formChannel, setFormChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Inspect Payload Modal
  const [inspectingLog, setInspectingLog] = useState<NotificationLog | null>(null);

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'templates') {
        const res = await apiFetch<{ data: NotificationTemplate[] }>(
          '/api/notification-templates'
        );
        setTemplates(Array.isArray(res?.data) ? res.data : []);
      } else {
        const res = await apiFetch<{ data: NotificationLog[] }>(
          '/api/notification-logs'
        );
        setLogs(Array.isArray(res?.data) ? res.data : []);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data notifikasi');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormCode('');
    setFormChannel('whatsapp');
    setFormSubject('');
    setFormBody('');
    setFormIsActive(true);
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const openEditModal = (t: NotificationTemplate) => {
    setEditingTemplate(t);
    setFormCode(t.code);
    setFormChannel(t.channel);
    setFormSubject(t.subject || '');
    setFormBody(t.bodyTemplate);
    setFormIsActive(t.isActive);
    setError(null);
    setInfoMessage(null);
    setModalOpen(true);
  };

  const handleSaveTemplate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formBody.trim()) {
      setError('Kode template dan isi pesan (bodyTemplate) wajib diisi');
      return;
    }

    const codeLower = formCode.trim().toLowerCase();

    if (editingTemplate) {
      const isUnchanged =
        codeLower === editingTemplate.code &&
        formChannel === editingTemplate.channel &&
        (formSubject.trim() || null) === (editingTemplate.subject || null) &&
        formBody.trim() === editingTemplate.bodyTemplate &&
        formIsActive === editingTemplate.isActive;

      if (isUnchanged) {
        setInfoMessage('Tidak ada perubahan yang disimpan.');
        setModalOpen(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload = {
      code: codeLower,
      channel: formChannel,
      subject: formSubject.trim() || null,
      bodyTemplate: formBody.trim(),
      isActive: formIsActive,
    };

    try {
      if (editingTemplate) {
        await apiFetch(`/api/notification-templates/${editingTemplate.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Template notifikasi "${codeLower}" berhasil diperbarui.`);
      } else {
        await apiFetch('/api/notification-templates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setInfoMessage(`Template notifikasi baru "${codeLower}" berhasil dibuat.`);
      }

      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan template notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (l.templateCode && l.templateCode.toLowerCase().includes(q)) ||
      (l.target && l.target.toLowerCase().includes(q)) ||
      (l.orderNumber && l.orderNumber.toLowerCase().includes(q)) ||
      (l.customerName && l.customerName.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (staff && staff.role !== 'super_admin') {
    return (
      <div className="py-24 text-center space-y-4 font-source max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-[#C9576B] mx-auto" />
        <h2 className="text-lg font-bold font-albert text-[#181F4B]">Akses Dibatasi</h2>
        <p className="text-xs text-[#6B7088]">
          Halaman Notifikasi & Audit Log hanya dapat diakses oleh Super Admin.
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
            <Bell className="w-6 h-6 text-[#C9A876]" />
            Notifications & Audit Logs
          </h1>
          <p className="text-xs text-[#6B7088] mt-0.5">
            Atur template pesan terototmatisasi WhatsApp/Email dan inspeksi riwayat pengiriman pesan (Audit Log).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6F3EC] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 shadow-xs cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A876] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {activeTab === 'templates' && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] rounded-xl text-xs font-bold font-albert transition-all duration-150 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Template Baru</span>
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

      {/* Mode Switcher Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-[#E7E8F0] shadow-xs max-w-md">
        <button
          onClick={() => {
            setActiveTab('templates');
            setError(null);
            setInfoMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-albert transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-[#181F4B] text-[#C9A876] shadow-sm'
              : 'text-[#6B7088] hover:text-[#181F4B]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Template Pesan</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('logs');
            setError(null);
            setInfoMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-albert transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-[#181F4B] text-[#C9A876] shadow-sm'
              : 'text-[#6B7088] hover:text-[#181F4B]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Log Audit Pengiriman</span>
        </button>
      </div>

      {/* TAB 1: NOTIFICATION TEMPLATES GRID */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-[#6B7088]">
              <div className="w-7 h-7 border-3 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="font-semibold text-sm">Memuat template notifikasi...</p>
            </div>
          ) : templates.length > 0 ? (
            templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white p-5 rounded-2xl border border-[#E7E8F0] hover:border-[#C9A876]/40 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#181F4B] bg-[#F6F3EC] px-2.5 py-1 rounded-lg border border-[#C9A876]/40">
                      {tpl.code}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tpl.channel === 'whatsapp'
                          ? 'bg-[#EAF5EE] text-[#3E8A5A] border border-[#C6E7D2]'
                          : 'bg-[#EDF0FA] text-[#3B4B8C] border border-[#D2D9F3]'
                      }`}
                    >
                      {tpl.channel === 'whatsapp' ? (
                        <>
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </>
                      )}
                    </span>
                  </div>

                  {tpl.subject && (
                    <p className="font-bold text-xs text-[#181F4B] font-albert">
                      Subject: {tpl.subject}
                    </p>
                  )}

                  <div className="bg-[#F4F5F9] p-3 rounded-xl border border-[#E7E8F0]">
                    <p className="text-xs text-[#1E202B] font-mono whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {tpl.bodyTemplate}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E7E8F0] flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      tpl.isActive
                        ? 'bg-[#EAF5EE] text-[#3E8A5A]'
                        : 'bg-[#FDF0F2] text-[#C9576B]'
                    }`}
                  >
                    {tpl.isActive ? 'AKTIF' : 'NONAKTIF'}
                  </span>

                  <button
                    onClick={() => openEditModal(tpl)}
                    className="py-1.5 px-3 bg-[#F4F5F9] hover:bg-[#E7E8F0] hover:border-[#C9A876] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition-all duration-150 font-albert flex items-center gap-1.5 cursor-pointer hover:scale-105"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#C9A876]" />
                    <span>Edit Template</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-[#6B7088]">
              <FileText className="w-10 h-10 text-[#E7E8F0] mx-auto mb-2" />
              <p className="font-semibold text-sm">Belum ada template notifikasi</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT LOGS TABLE */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E7E8F0] shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7088]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari kode template, nomor order, atau penerima..."
                className="w-full pl-9 pr-4 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] placeholder-[#6B7088] focus:outline-none focus:border-[#C9A876] transition"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E8F0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F3EC] border-b border-[#E7E8F0] text-[#6B7088] uppercase tracking-wider font-bold font-albert text-[11px]">
                    <th className="py-3.5 px-4">Waktu Terkirim</th>
                    <th className="py-3.5 px-4">Template & Channel</th>
                    <th className="py-3.5 px-4">Order & Penerima</th>
                    <th className="py-3.5 px-4">Target Kontak</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Inspeksi Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E8F0]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#6B7088]">
                        <div className="w-6 h-6 border-2 border-[#181F4B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Memuat log audit notifikasi...</span>
                      </td>
                    </tr>
                  ) : paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F4F5F9] transition">
                        <td className="py-3.5 px-4 font-mono text-[#6B7088] text-[11px]">
                          {new Date(log.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          <span className="font-mono font-bold text-[#181F4B] bg-[#F4F5F9] px-2 py-0.5 rounded border border-[#E7E8F0]">
                            {log.templateCode || 'CUSTOM'}
                          </span>
                          <p className="text-[10px] text-[#6B7088] uppercase font-bold">
                            {log.channel}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#181F4B] font-albert">
                            {log.customerName || 'Pelanggan Anonim'}
                          </p>
                          {log.orderNumber && (
                            <p className="text-[10px] font-mono text-[#C9A876]">
                              Order #{log.orderNumber}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#1E202B]">
                          {log.target}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {log.status === 'sent' || log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EAF5EE] text-[#3E8A5A]">
                              <CheckCircle2 className="w-3 h-3" />
                              TERKIRIM
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FDF0F2] text-[#C9576B]">
                              <XCircle className="w-3 h-3" />
                              GAGAL
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setInspectingLog(log)}
                            className="px-3 py-1 bg-[#F4F5F9] hover:bg-[#E7E8F0] border border-[#E7E8F0] rounded-xl text-xs font-semibold text-[#181F4B] transition cursor-pointer hover:scale-105"
                          >
                            Inspeksi Data
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-[#6B7088]">
                        <Bell className="w-8 h-8 text-[#E7E8F0] mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#1E202B]">
                          Belum ada log pengiriman notifikasi
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
              totalItems={filteredLogs.length}
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

      {/* Modal Add / Edit Template */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                {editingTemplate ? 'Edit Template Notifikasi' : 'Buat Template Notifikasi Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Kode Template (Unique Slug)
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toLowerCase())}
                  placeholder="misal order_confirmed_wa"
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] font-mono focus:outline-none focus:border-[#C9A876]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Saluran Notifikasi (Channel)
                </label>
                <select
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none cursor-pointer"
                >
                  <option value="whatsapp">WhatsApp Message</option>
                  <option value="email">Email Notification</option>
                </select>
              </div>

              {formChannel === 'email' && (
                <div>
                  <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                    Subject Email
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Pesanan #{order_number} Telah Dikonfirmasi!"
                    className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#6B7088] mb-1">
                  Template Isi Pesan (Support Dynamic Placeholders)
                </label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Halo {customer_name}, pesanan #{order_number} senilai {total_amount} sedang disiapkan..."
                  rows={5}
                  className="w-full px-3.5 py-2 bg-[#F4F5F9] border border-[#E7E8F0] rounded-xl text-xs text-[#1E202B] font-mono focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#C9A876] rounded cursor-pointer"
                />
                <label htmlFor="formIsActive" className="text-xs font-semibold text-[#181F4B] cursor-pointer">
                  Aktifkan template notifikasi ini
                </label>
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
                  disabled={loading}
                  className="px-5 py-2 bg-[#181F4B] hover:bg-[#0E1230] text-[#C9A876] font-bold text-xs rounded-xl transition shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Log Payload Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#E7E8F0] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E7E8F0] pb-3">
              <h3 className="font-bold text-base font-albert text-[#181F4B]">
                Inspeksi Log Audit Notifikasi
              </h3>
              <button
                onClick={() => setInspectingLog(null)}
                className="p-1 text-[#6B7088] hover:text-[#181F4B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#6B7088] font-semibold block">Target:</span>
                <code className="font-mono text-[#181F4B] font-bold">{inspectingLog.target}</code>
              </div>

              <div>
                <span className="text-[#6B7088] font-semibold block mb-1">Payload JSON:</span>
                <pre className="bg-[#0E1230] text-[#C9A876] p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                  {JSON.stringify(inspectingLog.payload, null, 2) || '{}'}
                </pre>
              </div>

              {inspectingLog.response && (
                <div>
                  <span className="text-[#6B7088] font-semibold block mb-1">Response Gateway:</span>
                  <pre className="bg-[#F4F5F9] text-[#1E202B] p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-32">
                    {JSON.stringify(inspectingLog.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E7E8F0] flex justify-end">
              <button
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-[#181F4B] text-[#C9A876] font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
