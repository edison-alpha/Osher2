# Fitur Metode Pembayaran

## Status: DEMO MODE (Menggunakan Dummy Data)

Fitur metode pembayaran sudah diimplementasi dengan 3 opsi:

### 1. Transfer Bank (Default)
- Pembayaran via transfer ke rekening toko
- Status order: `waiting_payment`
- Perlu konfirmasi pembayaran dari buyer

### 2. COD (Cash on Delivery)
- Bayar saat barang diterima
- Status order: `new`
- Pembayaran dilakukan ke kurir saat pengiriman

### 3. Saldo Komisi (DEMO)
- Bayar menggunakan saldo komisi yang tersedia
- Status order: `paid` (langsung lunas)
- **DUMMY DATA**: Saldo komisi hardcoded Rp 500.000

---

## Mode Demo - Apa yang Sudah Berfungsi?

✅ UI/UX pemilihan metode pembayaran
✅ Validasi saldo komisi mencukupi/tidak
✅ Status order berbeda sesuai metode pembayaran
✅ Pesan sukses yang berbeda per metode
✅ Informasi metode pembayaran disimpan di notes order

## Mode Demo - Apa yang Belum Berfungsi?

❌ Saldo komisi masih dummy (Rp 500.000)
❌ Saldo komisi tidak benar-benar terpotong
❌ Field `payment_method` belum ada di database
❌ Riwayat penggunaan komisi belum tercatat

---

## Cara Mengaktifkan Fitur Penuh

### Step 1: Jalankan Migration Database

File migration sudah tersedia di:
```
pos-flow-master/supabase/migrations/20251214000000_add_payment_method.sql
```

Jalankan migration ini di Supabase Dashboard atau via CLI:

```bash
# Via Supabase CLI
supabase db push

# Atau via Supabase Dashboard
# 1. Buka Supabase Dashboard
# 2. Pilih project Anda
# 3. Masuk ke SQL Editor
# 4. Copy-paste isi file migration
# 5. Run query
```

### Step 2: Update Kode di Checkout.tsx

Setelah migration berhasil, buka file:
```
pos-flow-master/src/pages/buyer/Checkout.tsx
```

#### A. Ambil Saldo Komisi dari Database

Ganti baris 77-91 dari:
```typescript
const { data: buyerProfile, isLoading: profileLoading } = useQuery({
  queryKey: ['buyer-profile', user?.id],
  queryFn: async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('buyer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  enabled: !!user?.id,
});

// DUMMY DATA: Saldo komisi untuk testing
const commissionBalance = 500000;
```

Menjadi:
```typescript
const { data: buyerProfile, isLoading: profileLoading } = useQuery({
  queryKey: ['buyer-profile', user?.id],
  queryFn: async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('buyer_profiles')
      .select('*, commission_balance')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  enabled: !!user?.id,
});

const commissionBalance = buyerProfile?.commission_balance || 0;
```

#### B. Simpan Payment Method ke Database

Ganti baris 183-197 dari:
```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    buyer_id: profileId,
    order_number: '',
    subtotal,
    admin_fee: adminFee,
    shipping_cost: shippingCost,
    total,
    status: initialStatus,
    notes: `${formData.notes || ''} [Metode: ${paymentMethod === 'transfer' ? 'Transfer Bank' : paymentMethod === 'cod' ? 'COD' : 'Saldo Komisi'}]`.trim(),
  } as any)
  .select('id, order_number')
  .single();
```

Menjadi:
```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    buyer_id: profileId,
    order_number: '',
    subtotal,
    admin_fee: adminFee,
    shipping_cost: shippingCost,
    total,
    status: initialStatus,
    payment_method: paymentMethod,
    notes: formData.notes || null,
  } as any)
  .select('id, order_number')
  .single();
```

#### C. Update Saldo Komisi

Ganti baris 227-233 dari:
```typescript
// DUMMY: Commission balance deduction will be implemented after migration
if (paymentMethod === 'commission') {
  console.log('DUMMY: Would deduct', total, 'from commission balance');
  console.log('DUMMY: Current balance:', commissionBalance);
  console.log('DUMMY: New balance would be:', commissionBalance - total);
}
```

Menjadi:
```typescript
// If payment method is commission, deduct from balance
if (paymentMethod === 'commission') {
  const { error: balanceError } = await supabase
    .from('buyer_profiles')
    .update({
      commission_balance: commissionBalance - total,
    })
    .eq('id', profileId);

  if (balanceError) throw balanceError;

  // Record commission usage
  await supabase
    .from('referral_commissions')
    .insert({
      referrer_id: profileId,
      buyer_id: profileId,
      order_id: order.id,
      commission_type: 'reversal',
      amount: -total,
      percentage: 0,
      order_subtotal: total,
      notes: `Pembayaran order ${order.order_number} menggunakan saldo komisi`,
    });
}
```

#### D. Hapus Badge DEMO dan Pesan Demo

1. Hapus badge DEMO di baris 390:
```typescript
<span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">DEMO</span>
```

2. Hapus pesan demo di baris 321-330

### Step 3: Test Fitur

1. Login sebagai buyer
2. Tambahkan produk ke cart
3. Checkout dan pilih metode pembayaran
4. Verifikasi:
   - Saldo komisi tampil sesuai database
   - Saldo terpotong setelah checkout dengan komisi
   - Field payment_method tersimpan di order
   - Riwayat penggunaan komisi tercatat

---

## Troubleshooting

### Error: column "payment_method" does not exist
**Solusi**: Migration belum dijalankan. Jalankan Step 1.

### Saldo komisi tidak terpotong
**Solusi**: Kode belum diupdate. Ikuti Step 2C.

### Saldo komisi masih Rp 500.000
**Solusi**: Kode belum diupdate. Ikuti Step 2A.

---

## Catatan Penting

- Fitur ini sudah siap digunakan dalam mode demo
- Semua logika bisnis sudah diimplementasi
- Hanya perlu migration database untuk aktivasi penuh
- Tidak ada perubahan UI setelah aktivasi (kecuali badge DEMO hilang)
