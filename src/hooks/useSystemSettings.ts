import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
}

export function useSystemSettings(keys?: string[]) {
  return useQuery({
    queryKey: ['system-settings', keys],
    queryFn: async () => {
      let query = supabase.from('system_settings').select('key, value, description');
      
      if (keys && keys.length > 0) {
        query = query.in('key', keys);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Convert to object for easier access
      const settings: Record<string, string> = {};
      data?.forEach((setting) => {
        settings[setting.key] = setting.value;
      });
      
      return settings;
    },
  });
}

export function useAdminBankInfo() {
  return useSystemSettings([
    'admin_bank_name',
    'admin_bank_account',
    'admin_bank_holder',
  ]);
}
