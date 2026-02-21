import { z } from 'zod';

// NIK validation - 16 digits
export const nikSchema = z.string()
  .length(16, 'NIK harus 16 digit')
  .regex(/^\d+$/, 'NIK hanya boleh berisi angka');

// Phone validation - Indonesian format
export const phoneSchema = z.string()
  .min(10, 'Nomor telepon minimal 10 digit')
  .max(15, 'Nomor telepon maksimal 15 digit')
  .regex(/^(\+62|62|0)[0-9]+$/, 'Format nomor telepon tidak valid');

// Email validation
export const emailSchema = z.string()
  .email('Email tidak valid')
  .max(255, 'Email maksimal 255 karakter');

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password minimal 8 karakter')
  .max(100, 'Password maksimal 100 karakter')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[0-9]/, 'Password harus mengandung angka');

// Basic password for simpler validation
export const simplePasswordSchema = z.string()
  .min(6, 'Password minimal 6 karakter')
  .max(100, 'Password maksimal 100 karakter');

// Full name validation
export const fullNameSchema = z.string()
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter');

// Bank account number validation
export const bankAccountSchema = z.string()
  .min(5, 'Nomor rekening minimal 5 digit')
  .max(20, 'Nomor rekening maksimal 20 digit')
  .regex(/^\d+$/, 'Nomor rekening hanya boleh berisi angka');

// Bank account name validation
export const bankAccountNameSchema = z.string()
  .trim()
  .min(2, 'Nama pemilik rekening minimal 2 karakter')
  .max(100, 'Nama pemilik rekening maksimal 100 karakter');

// Referral code validation
export const referralCodeSchema = z.string()
  .length(8, 'Kode referral harus 8 karakter')
  .regex(/^[A-Z0-9]+$/, 'Kode referral hanya boleh huruf kapital dan angka')
  .optional()
  .or(z.literal(''));

// Buyer registration schema
export const buyerRegistrationSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
  confirmPassword: z.string(),
  fullName: fullNameSchema,
  nik: nikSchema,
  phone: phoneSchema,
  address: z.string().trim().min(5, 'Alamat minimal 5 karakter').max(255, 'Alamat maksimal 255 karakter'),
  referralCode: referralCodeSchema,
  bankId: z.string().uuid('Pilih bank'),
  bankAccountNumber: bankAccountSchema,
  bankAccountName: bankAccountNameSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak sama',
  path: ['confirmPassword'],
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password wajib diisi'),
});

export type BuyerRegistrationForm = z.infer<typeof buyerRegistrationSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
