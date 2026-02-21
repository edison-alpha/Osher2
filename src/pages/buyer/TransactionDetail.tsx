import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Share2, Download, Clock, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export default function TransactionDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { type, id } = useParams();
  const transaction = location.state?.transaction;
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setShowCheck(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          text: 'Transaksi Berhasil', 
          color: 'text-white',
          icon: Check,
          bgColor: 'bg-white',
          iconColor: 'text-[#111111]'
        };
      case 'pending':
        return { 
          text: 'Menunggu Proses', 
          color: 'text-white',
          icon: Clock,
          bgColor: 'bg-amber-100',
          iconColor: 'text-amber-600'
        };
      case 'approved':
        return { 
          text: 'Disetujui', 
          color: 'text-white',
          icon: Check,
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      case 'rejected':
        return { 
          text: 'Ditolak', 
          color: 'text-white',
          icon: X,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'cancelled':
        return { 
          text: 'Dibatalkan', 
          color: 'text-white',
          icon: X,
          bgColor: 'bg-gray-200',
          iconColor: 'text-gray-600'
        };
      default:
        return { 
          text: status, 
          color: 'text-white',
          icon: AlertCircle,
          bgColor: 'bg-white',
          iconColor: 'text-gray-600'
        };
    }
  };

  const handleShare = async () => {
    const shareText = `
Transaksi ${type === 'withdrawal' ? 'Penarikan' : 'NETN'}
${formatPrice(transaction?.amount || 0)}
${formatDate(transaction?.created_at || new Date().toISOString())}
No. Ref: ${transaction?.id || '-'}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Detail Transaksi',
          text: shareText,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Tersalin!',
        description: 'Detail transaksi berhasil disalin',
        duration: 2000,
      });
    }
  };

  if (!transaction) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Data tidak ditemukan</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(transaction.status || 'completed');
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#1a1a1a]">
      {/* Header */}
      <div className="px-5 pt-6 pb-6" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div 
            className={`w-16 h-16 rounded-full ${statusInfo.bgColor} flex items-center justify-center shadow-lg transition-all duration-500 ${
              showCheck ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          >
            <StatusIcon 
              className={`w-8 h-8 ${statusInfo.iconColor} transition-all duration-700 ${
                showCheck ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`} 
              strokeWidth={3} 
            />
          </div>
        </div>

        {/* Status Text */}
        <h1 
          className={`text-xl font-bold text-center mb-1 ${statusInfo.color} transition-all duration-500 delay-200 ${
            showCheck ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {statusInfo.text}
        </h1>
        <p 
          className={`text-white/70 text-center text-xs transition-all duration-500 delay-300 ${
            showCheck ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {formatDate(transaction.created_at)}
        </p>
      </div>

      {/* Content Card */}
      <div 
        className={`bg-white rounded-t-[32px] min-h-[65vh] px-5 py-5 transition-all duration-500 delay-400 ${
          showCheck ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Total Amount */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Total Transaksi</p>
          <h2 className="text-2xl font-bold text-[#111111]">
            {formatPrice(transaction.amount)}
          </h2>
        </div>

        {/* Transaction Details */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500">No. Ref</span>
            <span className="text-xs font-medium text-right break-all ml-2">{transaction.id}</span>
          </div>

          {type === 'withdrawal' && (
            <>
              {/* Source Section */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Sumber Dana</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center text-white font-bold text-[10px]">
                    OS
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-xs">OSHER COMMISSION</p>
                    <p className="text-[10px] text-gray-500">Saldo NETN</p>
                  </div>
                </div>
              </div>

              {/* Destination Section */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Tujuan</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-[10px]">
                    {transaction.bank_name?.substring(5, 8) || 'BNK'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-xs">{transaction.bank_name || 'Bank'}</p>
                    <p className="text-[10px] text-gray-500">{transaction.account_number}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-gray-500">Nominal</span>
                  <span className="text-xs font-medium">{formatPrice(transaction.amount)}</span>
                </div>
                
                {transaction.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-[10px] text-red-600 font-medium mb-1">Alasan Penolakan</p>
                    <p className="text-xs text-red-700">{transaction.rejection_reason}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {type === 'commission' && (
            <>
              {/* Commission Details */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Detail NETN</p>
                <div className="space-y-1.5">
                  {transaction.buyer?.full_name && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Dari</span>
                      <span className="text-xs font-medium">{transaction.buyer.full_name}</span>
                    </div>
                  )}
                  {transaction.orders?.order_number && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">No. Order</span>
                      <span className="text-xs font-medium">{transaction.orders.order_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Tipe</span>
                    <span className="text-xs font-medium">
                      {transaction.commission_type === 'accrual' ? 'NETN Masuk' : 
                       transaction.commission_type === 'reversal' ? 'Pembatalan' : 
                       transaction.commission_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-gray-500">Jumlah</span>
                  <span className={`text-xs font-medium ${
                    transaction.commission_type === 'accrual' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.commission_type === 'accrual' ? '+' : '-'}
                    {formatPrice(transaction.amount)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full h-11 border-[#111111] text-[#111111] hover:bg-gray-50 text-sm"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Bagikan
          </Button>
          <Button
            className="flex-1 rounded-full h-11 bg-[#111111] hover:bg-black text-white text-sm"
            onClick={() => navigate(-1)}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Selesai
          </Button>
        </div>
      </div>
    </div>
  );
}
