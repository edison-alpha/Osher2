import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Truck, Phone, LogOut, Settings, Award, TrendingUp, Calendar, Shield, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { CourierFloatingNav } from '@/components/courier/CourierFloatingNav';
import { useCourierProfile } from '@/hooks/useCourier';
import { useCourierStats } from '@/hooks/useCourierData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function CourierProfile() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useCourierProfile();
  const { data: stats, isLoading: statsLoading } = useCourierStats();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const handleToggleActive = async () => {
    if (!profile || isUpdating) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('courier_profiles')
        .update({ is_active: !profile.is_active })
        .eq('id', profile.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['courier-profile'] });
      toast.success(
        profile.is_active ? 'Status: Tidak Aktif' : 'Status: Aktif',
        { description: profile.is_active 
          ? 'Anda tidak akan menerima order baru' 
          : 'Anda siap menerima order' 
        }
      );
    } catch (error: any) {
      toast.error('Gagal mengubah status', { description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Berhasil logout', { description: 'Sampai jumpa kembali!' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (profileLoading) {
    return <LoadingScreen variant="courier" />;
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Dark Header Section */}
      <div className="bg-[#111111] text-white rounded-b-[32px] px-5 pb-8" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        {/* Profile Info Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#111111] flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="font-semibold text-base">{profile?.full_name || 'Kurir'}</h2>
                {profile?.is_active && (
                  <span className="bg-green-500/20 text-green-100 border-green-400/30 text-[9px] px-2 py-0.5 rounded-full font-semibold">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">{profile?.phone}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            {showDetails ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Vehicle Info */}
        {profile?.vehicle_type && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Truck className="w-4 h-4" />
              <span>{profile.vehicle_type} • {profile.vehicle_plate}</span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {showDetails && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <Award className="w-5 h-5 mx-auto text-amber-400 mb-1" />
              <p className="text-2xl font-bold">{profile?.total_deliveries || 0}</p>
              <p className="text-[10px] opacity-70">Total</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 mx-auto text-green-400 mb-1" />
              <p className="text-2xl font-bold">{stats?.deliveredMonth || 0}</p>
              <p className="text-[10px] opacity-70">Bulan Ini</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <Calendar className="w-5 h-5 mx-auto text-blue-400 mb-1" />
              <p className="text-2xl font-bold">{stats?.deliveredToday || 0}</p>
              <p className="text-[10px] opacity-70">Hari Ini</p>
            </div>
          </div>
        )}
      </div>

      {/* Content with padding */}
      <div className="px-4 pt-4">
        {/* Status Toggle */}
        <div className="mb-4 bg-white rounded-3xl shadow-sm">
          <div 
            className={cn(
              "flex items-center justify-between p-4 rounded-3xl transition-colors",
              profile?.is_active ? "bg-green-50" : "bg-gray-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                profile?.is_active ? "bg-green-100" : "bg-gray-200"
              )}>
                <Shield className={cn(
                  "w-5 h-5",
                  profile?.is_active ? "text-green-600" : "text-gray-500"
                )} />
              </div>
              <div>
                <p className="font-semibold text-[#111111] text-sm">Status Ketersediaan</p>
                <p className="text-[10px] text-[#8E8E93]">
                  {profile?.is_active ? 'Siap menerima order baru' : 'Tidak menerima order'}
                </p>
              </div>
            </div>
            <Switch
              checked={profile?.is_active}
              onCheckedChange={handleToggleActive}
              disabled={isUpdating}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>

        {/* Account Info */}
        <div className="mb-4 bg-white rounded-3xl shadow-sm">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-[#8E8E93]" />
              <h3 className="font-semibold text-sm text-[#111111]">Informasi Akun</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-[#8E8E93]">Bergabung Sejak</span>
                <span className="font-medium text-xs text-[#111111]">{profile?.created_at ? formatDate(profile.created_at) : '-'}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-[#8E8E93]">ID Kurir</span>
                <span className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded text-[#111111]">{profile?.id?.slice(0, 8) || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-full"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Keluar dari Akun
        </Button>
      </div>

      {/* Floating Navigation */}
      <CourierFloatingNav />
    </div>
  );
}
