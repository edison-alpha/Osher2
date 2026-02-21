import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  bucket: string;
  folder?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  folder,
  className,
  aspectRatio = 'square',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadImage, deleteImage, progress } = useImageUpload({
    bucket,
    folder,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url) {
      onChange(url);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (value) {
      await deleteImage(value);
      onChange(undefined);
    }
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[2/1]',
  }[aspectRatio];

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {value ? (
        <div className={cn('relative rounded-lg overflow-hidden border bg-muted', aspectRatioClass)}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Ganti
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'w-full rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground bg-muted/30',
            aspectRatioClass,
            uploading && 'cursor-not-allowed opacity-50'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm">Mengupload...</span>
              <Progress value={progress} className="w-32 h-1" />
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Klik untuk upload gambar</span>
              <span className="text-xs text-muted-foreground">JPG, PNG, WebP (maks. 5MB)</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
