import { useState } from 'react';
import { useAdminSettings, useUpdateSetting } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  DollarSign, 
  Percent, 
  Truck, 
  Save,
  RefreshCw,
  Building,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingGroup {
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: string[];
}

const settingGroups: SettingGroup[] = [
  {
    title: 'Informasi Bisnis',
    description: 'Konfigurasi informasi dasar bisnis',
    icon: <Building className="h-5 w-5" />,
    settings: ['business_name', 'business_phone', 'business_email', 'business_address'],
  },
  {
    title: 'Pengiriman',
    description: 'Pengaturan biaya dan aturan pengiriman',
    icon: <Truck className="h-5 w-5" />,
    settings: ['shipping_cost_default', 'free_shipping_minimum', 'shipping_enabled'],
  },
  {
    title: 'Komisi & Referral',
    description: 'Pengaturan persentase komisi referral',
    icon: <Percent className="h-5 w-5" />,
    settings: ['referral_commission_percentage', 'minimum_payout_amount', 'commission_enabled'],
  },
  {
    title: 'Pembayaran',
    description: 'Konfigurasi rekening dan pembayaran',
    icon: <DollarSign className="h-5 w-5" />,
    settings: ['admin_bank_name', 'admin_bank_account', 'admin_bank_holder', 'admin_fee'],
  },
];

const settingLabels: Record<string, string> = {
  business_name: 'Nama Bisnis',
  business_phone: 'Nomor Telepon',
  business_email: 'Email',
  business_address: 'Alamat',
  shipping_cost_default: 'Biaya Pengiriman Default',
  free_shipping_minimum: 'Minimum Gratis Ongkir',
  shipping_enabled: 'Aktifkan Pengiriman',
  referral_commission_percentage: 'Persentase Komisi (%)',
  minimum_payout_amount: 'Minimum Pencairan',
  commission_enabled: 'Aktifkan Komisi',
  admin_bank_name: 'Nama Bank',
  admin_bank_account: 'Nomor Rekening',
  admin_bank_holder: 'Nama Pemilik Rekening',
  admin_fee: 'Biaya Admin',
};

const settingTypes: Record<string, 'text' | 'number' | 'textarea' | 'boolean'> = {
  business_name: 'text',
  business_phone: 'text',
  business_email: 'text',
  business_address: 'textarea',
  shipping_cost_default: 'number',
  free_shipping_minimum: 'number',
  shipping_enabled: 'boolean',
  referral_commission_percentage: 'number',
  minimum_payout_amount: 'number',
  commission_enabled: 'boolean',
  admin_bank_name: 'text',
  admin_bank_account: 'text',
  admin_bank_holder: 'text',
  admin_fee: 'number',
};

export default function AdminSettings() {
  const { data: settings, isLoading, refetch } = useAdminSettings();
  const updateSetting = useUpdateSetting();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const getSettingValue = (key: string) => {
    if (editedSettings[key] !== undefined) return editedSettings[key];
    const setting = settings?.find(s => s.key === key);
    return setting?.value || '';
  };

  const handleChange = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(editedSettings)) {
        const existingSetting = settings?.find(s => s.key === key);
        await updateSetting.mutateAsync({
          key,
          value,
          description: settingLabels[key],
          isNew: !existingSetting,
        });
      }
      toast.success('Pengaturan berhasil disimpan');
      setEditedSettings({});
      refetch();
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(editedSettings).length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Pengaturan Sistem
          </h2>
          <p className="text-muted-foreground">Kelola konfigurasi aplikasi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>

      {/* Setting Groups */}
      {settingGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {group.icon}
              {group.title}
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.settings.map((settingKey, index) => {
              const type = settingTypes[settingKey] || 'text';
              const value = getSettingValue(settingKey);
              const isEdited = editedSettings[settingKey] !== undefined;

              return (
                <div key={settingKey}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="md:w-1/3">
                      <Label htmlFor={settingKey} className="flex items-center gap-2">
                        {settingLabels[settingKey]}
                        {isEdited && (
                          <span className="text-xs text-warning">(diubah)</span>
                        )}
                      </Label>
                    </div>
                    <div className="md:w-2/3">
                      {type === 'boolean' ? (
                        <Switch
                          id={settingKey}
                          checked={value === 'true'}
                          onCheckedChange={(checked) => handleChange(settingKey, checked.toString())}
                        />
                      ) : type === 'textarea' ? (
                        <Textarea
                          id={settingKey}
                          value={value}
                          onChange={(e) => handleChange(settingKey, e.target.value)}
                          placeholder={`Masukkan ${settingLabels[settingKey].toLowerCase()}`}
                        />
                      ) : (
                        <Input
                          id={settingKey}
                          type={type}
                          value={value}
                          onChange={(e) => handleChange(settingKey, e.target.value)}
                          placeholder={`Masukkan ${settingLabels[settingKey].toLowerCase()}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Penting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Perubahan pengaturan akan langsung berlaku setelah disimpan</p>
          <p>• Pastikan nilai numerik diisi dengan angka yang valid</p>
          <p>• Biaya dalam satuan Rupiah (tanpa titik atau koma)</p>
          <p>• Persentase komisi dalam bentuk angka (contoh: 5 untuk 5%)</p>
        </CardContent>
      </Card>
    </div>
  );
}
