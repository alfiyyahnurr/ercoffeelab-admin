const READ_ORDERS_KEY = 'ercoffeelab_read_order_ids';
const SEEN_ALERTS_KEY = 'ercoffeelab_seen_alert_ids';

/**
 * Retrieves the list of read order IDs from localStorage.
 */
export function getReadOrderIds(): Array<number | string> {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(READ_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Marks a specific order ID as read and dispatches a update event.
 */
export function markOrderAsRead(id: number | string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const list = getReadOrderIds();
    const strId = String(id);
    if (!list.some((existing) => String(existing) === strId)) {
      list.push(id);
      localStorage.setItem(READ_ORDERS_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('ercoffeelab_read_orders_updated'));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Marks multiple order IDs as read at once.
 */
export function markAllOrdersAsRead(ids: Array<number | string>): void {
  if (typeof window === 'undefined' || !Array.isArray(ids)) return;
  try {
    const list = getReadOrderIds();
    let updated = false;
    ids.forEach((id) => {
      const strId = String(id);
      if (!list.some((existing) => String(existing) === strId)) {
        list.push(id);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(READ_ORDERS_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('ercoffeelab_read_orders_updated'));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieves seen toast alert IDs from localStorage to prevent duplicate toast popups.
 */
export function getSeenAlertIds(): Array<number | string> {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(SEEN_ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Marks a toast alert ID as seen so it only pops up once.
 */
export function markAlertAsSeen(id: number | string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const list = getSeenAlertIds();
    const strId = String(id);
    if (!list.some((existing) => String(existing) === strId)) {
      list.push(id);
      localStorage.setItem(SEEN_ALERTS_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage errors
  }
}
