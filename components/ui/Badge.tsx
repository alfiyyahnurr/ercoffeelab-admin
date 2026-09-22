import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'gold'
  | 'info'
  | 'navy'
  | 'danger'
  | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  dot = true,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantClass = `badge-${variant}`;

  return (
    <span className={`badge ${variantClass} ${className}`} {...props}>
      {dot && <span className="badge-dot" />}
      <span>{children}</span>
    </span>
  );
}

/**
 * Helper component to render Order Status Badge automatically
 */
export function OrderStatusBadge({ status }: { status: string }) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return <Badge variant="success">Selesai</Badge>;
    case 'paid':
      return <Badge variant="success">Sudah Dibayar</Badge>;
    case 'preparing':
      return <Badge variant="gold">Sedang Dibuat</Badge>;
    case 'confirmed':
      return <Badge variant="gold">Terkonfirmasi</Badge>;
    case 'pending':
    case 'checkout':
      return <Badge variant="gold">Baru Masuk</Badge>;
    case 'ready':
      return <Badge variant="navy">Siap Diambil</Badge>;
    case 'on_delivery':
    case 'delivering':
      return <Badge variant="navy">Sedang Dikirim</Badge>;
    case 'cancelled':
    case 'rejected':
      return <Badge variant="danger">Dibatalkan</Badge>;
    default:
      return <Badge variant="neutral">{status || 'Status Tidak Diketahui'}</Badge>;
  }
}
