import { supabase } from '@/integrations/supabase/client';

/**
 * Generate signed URL for payment proof images stored in private bucket
 * @param imageUrl - The public URL or path to the image
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or original URL if generation fails
 */
export async function getPaymentProofSignedUrl(
  imageUrl: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!imageUrl) return null;

  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/payment-proofs\/(.+)$/);

    if (pathMatch) {
      const filePath = pathMatch[1];
      const { data: signedData, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error generating signed URL:', error);
        return imageUrl; // Return original URL as fallback
      }

      return signedData?.signedUrl || imageUrl;
    }

    return imageUrl;
  } catch (e) {
    console.error('Error parsing image URL:', e);
    return imageUrl;
  }
}

/**
 * Generate signed URLs for multiple payment confirmations
 * @param payments - Array of payment confirmation objects
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Array of payments with signed URLs
 */
export async function getPaymentsWithSignedUrls<T extends { proof_image_url?: string | null }>(
  payments: T[] | null | undefined,
  expiresIn: number = 3600
): Promise<T[]> {
  if (!payments) return [];

  return Promise.all(
    payments.map(async (payment) => {
      if (payment.proof_image_url) {
        const signedUrl = await getPaymentProofSignedUrl(payment.proof_image_url, expiresIn);
        return { ...payment, proof_image_url: signedUrl };
      }
      return payment;
    })
  );
}
