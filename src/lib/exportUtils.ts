import { format } from 'date-fns';

// Simple object-based CSV export
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
) {
  if (data.length === 0) {
    return;
  }

  // Get headers from first object keys
  const headers = Object.keys(data[0]);
  const headerRow = headers.map((h) => `"${h}"`).join(',');

  // Create data rows
  const rows = data.map((row) =>
    headers
      .map((key) => {
        const value = row[key];
        const escaped = String(value ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',')
  );

  // Combine headers and rows
  const csv = [headerRow, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}
