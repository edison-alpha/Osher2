import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'super_admin' | 'admin_gudang' | 'admin_keuangan' | 'courier' | 'buyer';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  profileId: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
    profileId: null,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // Fetch role using setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            role: null,
            profileId: null,
            loading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;

      const role = roleData?.role as AppRole | null;

      // Fetch profile ID based on role
      let profileId: string | null = null;
      
      if (role === 'buyer') {
        const { data: buyerProfile } = await supabase
          .from('buyer_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        profileId = buyerProfile?.id || null;
      } else if (role === 'courier') {
        const { data: courierProfile } = await supabase
          .from('courier_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        profileId = courierProfile?.id || null;
      } else if (role && ['super_admin', 'admin_gudang', 'admin_keuangan'].includes(role)) {
        const { data: adminProfile } = await supabase
          .from('admin_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        profileId = adminProfile?.id || null;
      }

      setAuthState(prev => ({
        ...prev,
        role,
        profileId,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching user role:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setAuthState({
        user: null,
        session: null,
        role: null,
        profileId: null,
        loading: false,
      });
    }
    return { error };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    isAdmin: authState.role && ['super_admin', 'admin_gudang', 'admin_keuangan'].includes(authState.role),
    isCourier: authState.role === 'courier',
    isBuyer: authState.role === 'buyer',
  };
}
