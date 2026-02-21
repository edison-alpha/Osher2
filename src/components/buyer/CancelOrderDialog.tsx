import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CancelOrderDialogProps {
  orderId: string;
  orderNumber: string;
  onSuccess?: () => void;
}

export function CancelOrderDialog({ orderId, orderNumber, onSuccess }: CancelOrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('buyer-cancel-order', {
        body: { orderId },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Gagal membatalkan pesanan');
      }

      toast({
        title: 'Pesanan Dibatalkan',
        description: `Pesanan ${orderNumber} berhasil dibatalkan`,
      });

      queryClient.invalidateQueries({ queryKey: ['buyer-order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] });
      
      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast({
        title: 'Gagal Membatalkan',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          Batalkan Pesanan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Batalkan Pesanan?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin membatalkan pesanan <strong>{orderNumber}</strong>? 
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Tidak</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Ya, Batalkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
