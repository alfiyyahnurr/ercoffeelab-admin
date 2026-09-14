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
    case 'paid':
    case 'completed':
    case 'active':
    case 'available':
      return <Badge variant="success">{status}</Badge>;
    case 'preparing':
    case 'pending':
    case 'unacknowledged':
      return <Badge variant="gold">{status}</Badge>;
    case 'ready':
    case 'on_delivery':
      return <Badge variant="navy">{status}</Badge>;
    case 'cancelled':
    case 'rejected':
    case 'inactive':
    case 'out_of_stock':
      return <Badge variant="danger">{status}</Badge>;
    default:
      return <Badge variant="neutral">{status || 'Unknown'}</Badge>;
  }
}
