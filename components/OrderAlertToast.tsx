'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { getSeenAlertIds, markAlertAsSeen, markOrderAsRead } from '@/lib/notifications';
import { BellRing, X, ArrowRight } from 'lucide-react';

export interface OrderAlert {
  id: number | string;
  orderId: number | string;
  orderNumber: string;
  customerName?: string;
  totalAmount?: number;
  outletId: number;
  createdAt: string;
}

interface OrderAlertToastProps {
  outletId: number | null;
}

/**
 * Web Audio API chime sound generator.
 */
const playAlertChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(880, now, 0.25);
    playNote(1046.5, now + 0.25, 0.4);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

export default function OrderAlertToast({ outletId }: OrderAlertToastProps) {
  const router = useRouter();
  const [activeAlert, setActiveAlert] = useState<OrderAlert | null>(null);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrderAlerts = useCallback(async () => {
    // Skip polling if document is hidden to save resources
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }

    try {
      const endpoint = outletId
        ? `/api/outlets/${outletId}/alerts?unacknowledged=true`
        : `/api/orders?status=pending&limit=1`;

      const response = await apiFetch<any>(endpoint).catch(() => null);

      let latestAlert: OrderAlert | null = null;

      if (response?.alerts && response.alerts.length > 0) {
        latestAlert = response.alerts[0];
      } else if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        const order = response.data[0];
        latestAlert = {
          id: order.id,
          orderId: order.id,
          orderNumber: order.orderNumber || `#ERC-${order.id}`,
          customerName: order.customerName || 'Pelanggan Coffee Lab',
          totalAmount: order.totalAmount || order.totalPrice,
          outletId: order.outletId,
          createdAt: order.createdAt || new Date().toISOString(),
        };
      }

      if (latestAlert) {
        const seenIds = getSeenAlertIds();
        const strId = String(latestAlert.id);

        // Check if this alert has NOT been shown yet
        if (!seenIds.some((id) => String(id) === strId)) {
          // Mark as seen immediately so it only pops up ONCE
          markAlertAsSeen(latestAlert.id);
          setActiveAlert(latestAlert);
          playAlertChime();

          // Auto-dismiss the toast popup after 5 seconds (5000ms)
          if (autoDismissTimerRef.current) {
            clearTimeout(autoDismissTimerRef.current);
          }
          autoDismissTimerRef.current = setTimeout(() => {
            setActiveAlert(null);
          }, 5000);
        }
      }
    } catch {
      // Ignore background polling errors
    }
  }, [outletId]);

  useEffect(() => {
    // Initial fetch after slight delay
    const timer = setTimeout(fetchOrderAlerts, 1500);

    // Poll every 30 seconds for new incoming orders
    const interval = setInterval(fetchOrderAlerts, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [fetchOrderAlerts]);

  const handleAcknowledgeAndNavigate = async () => {
    if (!activeAlert) return;

    const targetId = activeAlert.orderId || activeAlert.id;
    // Mark as read immediately when user clicks to view details
    markOrderAsRead(targetId);

    try {
      if (activeAlert.outletId) {
        await apiFetch(`/api/outlets/${activeAlert.outletId}/alerts`, {
          method: 'PATCH',
          body: JSON.stringify({ alertId: activeAlert.id, acknowledged: true }),
        }).catch(() => null);
      }
    } finally {
      setActiveAlert(null);
      router.push(`/orders/${targetId}`);
    }
  };

  if (!activeAlert) return null;

  return (
    <div className="fixed top-20 right-6 z-50 max-w-sm w-full animate-bounce-in font-source">
      <div className="glass-dark p-4 rounded-2xl shadow-2xl border-2 border-[#C9A876] bg-[#0E1230]/95 backdrop-blur-xl text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C9A876] text-[#0E1230] flex items-center justify-center shrink-0 font-bold shadow-lg animate-pulse">
            <BellRing className="w-5 h-5" />
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="badge badge-warning text-[10px]">PESANAN BARU</span>
              <span className="text-xs text-[#6B7088] font-mono">
                {activeAlert.orderNumber}
              </span>
            </div>

            <p className="text-sm font-bold font-albert text-white mt-1 truncate">
              {activeAlert.customerName || 'Pesanan Masuk'}
            </p>

            {activeAlert.totalAmount && (
              <p className="text-xs font-semibold text-[#C9A876] mt-0.5">
                Rp {activeAlert.totalAmount.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="text-[#6B7088] hover:text-white transition p-1 rounded-lg hover:bg-[#181F4B] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleAcknowledgeAndNavigate}
          className="mt-3 w-full py-2 px-3 bg-[#C9A876] hover:bg-[#d4b382] text-[#0E1230] font-bold rounded-xl text-xs transition font-albert flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Proses Pesanan Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
