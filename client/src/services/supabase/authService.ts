import { createClient } from '@/lib/supabase/client';
import { ProfileRow } from '@/types/database';

export const SupabaseAuthService = {
  /**
   * User Email/Password Sign Up with automatic Profile metadata.
   */
  async signUp(email: string, password: string, fullName: string, phone: string) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          is_admin: false,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * User or Admin Sign In with Email & Password.
   */
  async signIn(email: string, password: string) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign Out current user/admin.
   */
  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Fetch Profile details for current active session user.
   */
  async getProfile(): Promise<ProfileRow | null> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  },
};
