import { forwardRef } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_order: number;
  subtotal: number;
}

interface OrderAddress {
  recipient_name: string;
  phone: string;
  address: string;
  landmark?: string;
  domicile?: { name: string; city?: string };
}

interface InvoiceProps {
  orderNumber: string;
  createdAt: string;
  status: string;
  buyerName: string;
  address?: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  adminFee: number;
  total: number;
  notes?: string;
  courierName?: string;
}

const statusLabels: Record<string, string> = {
  new: 'Baru',
  waiting_payment: 'Menunggu Pembayaran',
  paid: 'Dibayar',
  assigned: 'Kurir Ditugaskan',
  picked_up: 'Diambil Kurir',
  on_delivery: 'Dalam Pengiriman',
  delivered: 'Terkirim',
  cancelled: 'Dibatalkan',
  refunded: 'Dana Dikembalikan',
  failed: 'Gagal',
  returned: 'Dikembalikan',
};

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ orderNumber, createdAt, status, buyerName, address, items, subtotal, shippingCost, adminFee, total, notes, courierName }, ref) => {
    const formatPrice = (price: number) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(price);

    const formatDate = (date: string) =>
      format(new Date(date), 'dd MMMM yyyy, HH:mm', { locale: localeId });

    return (
      <div ref={ref} className="bg-white text-black p-8 max-w-[210mm] mx-auto print:shadow-none" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-black">
          <div>
            <h1 className="text-2xl font-bold">INVOICE</h1>
            <p className="text-gray-600 mt-1">Osher Shop</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-lg">{orderNumber}</p>
            <p className="text-sm text-gray-600">{formatDate(createdAt)}</p>
            <p className="text-sm mt-1 px-2 py-0.5 bg-gray-100 inline-block rounded">
              {statusLabels[status] || status}
            </p>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Pembeli</h3>
            <p className="font-semibold">{buyerName}</p>
          </div>
          {address && (
            <div>
              <h3 className="font-bold text-sm text-gray-500 uppercase mb-2">Alamat Pengiriman</h3>
              <p className="font-semibold">{address.recipient_name}</p>
              <p className="text-sm">{address.phone}</p>
              <p className="text-sm">{address.address}</p>
              {address.landmark && <p className="text-sm text-gray-600">Patokan: {address.landmark}</p>}
              {address.domicile && (
                <p className="text-sm">{address.domicile.name}{address.domicile.city && `, ${address.domicile.city}`}</p>
              )}
            </div>
          )}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 font-bold">Produk</th>
              <th className="text-center py-2 font-bold w-20">Qty</th>
              <th className="text-right py-2 font-bold w-32">Harga</th>
              <th className="text-right py-2 font-bold w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2">{item.product_name}</td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">{formatPrice(item.price_at_order)}</td>
                <td className="text-right py-2">{formatPrice(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Ongkos Kirim</span>
              <span>{shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Biaya Layanan</span>
              <span>{formatPrice(adminFee)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-black font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mb-8 p-4 bg-gray-50 rounded">
            <h3 className="font-bold text-sm text-gray-500 uppercase mb-1">Catatan</h3>
            <p className="text-sm">{notes}</p>
          </div>
        )}

        {/* Courier */}
        {courierName && (
          <div className="mb-8">
            <h3 className="font-bold text-sm text-gray-500 uppercase mb-1">Kurir</h3>
            <p>{courierName}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <p>Terima kasih telah berbelanja di Osher Shop</p>
          <p className="mt-1">Dokumen ini dicetak pada {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeId })}</p>
        </div>
      </div>
    );
  }
);

Invoice.displayName = 'Invoice';
