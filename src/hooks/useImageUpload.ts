import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseImageUploadOptions {
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

interface UseImageUploadReturn {
  uploading: boolean;
  uploadImage: (file: File) => Promise<string | null>;
  deleteImage: (url: string) => Promise<boolean>;
  progress: number;
}

export function useImageUpload({
  bucket,
  folder = '',
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}: UseImageUploadOptions): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string | null> => {
    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipe file tidak didukung',
        description: `Gunakan: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
        variant: 'destructive',
      });
      return null;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'Ukuran file terlalu besar',
        description: `Maksimal ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return null;
    }

    setUploading(true);
    setProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(80);

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);

      toast({
        title: 'Upload berhasil',
        description: 'Gambar berhasil diupload',
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Gagal upload gambar',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: 'Gambar dihapus',
        description: 'Gambar berhasil dihapus',
      });

      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Gagal menghapus gambar',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    uploading,
    uploadImage,
    deleteImage,
    progress,
  };
}
