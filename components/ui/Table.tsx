import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  compact?: boolean;
}

export function Table({ className = '', compact = false, children, ...props }: TableProps) {
  return (
    <div className="table-wrap shadow-xs">
      <table className={`table ${compact ? 'table-compact' : ''} ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className = '', children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className = '', children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
}

export function TableEmptyState({
  icon,
  title = 'Tidak ada data ditemukan',
  description,
  action,
}: {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={100} className="text-center py-12 px-4">
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
          {icon && <div className="text-[#8B93B8] mb-3">{icon}</div>}
          <p className="font-albert font-bold text-sm text-[#181F4B] mb-1">{title}</p>
          {description && <p className="text-xs text-[#6B7088] mb-4">{description}</p>}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </td>
    </tr>
  );
}
