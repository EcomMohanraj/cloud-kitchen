import { supabase } from '@/lib/supabaseClient';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export async function registerCustomer({ email, password, fullName, phone }: SignUpData) {
  console.log('🚀 Executing Supabase signUp POST request for:', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) {
    console.error('❌ Supabase Registration Error:', error.message);
    throw new Error(error.message);
  }

  console.log('✅ Supabase signUp Response Status: SUCCESS', {
    user: data.user,
    session: data.session ? 'Active Session Established' : 'Confirmation Email Required',
  });

  return data;
}

export async function loginCustomer(email: string, password: string) {
  console.log('🚀 Executing Supabase signInWithPassword POST request for:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Supabase Login Error:', error.message);
    throw new Error(error.message);
  }

  console.log('✅ Supabase signIn Response Status: SUCCESS', {
    userId: data.user?.id,
    userEmail: data.user?.email,
    session: data.session ? 'Active Session Established' : 'No Session',
  });

  return data;
}

export async function logoutCustomer() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('❌ Supabase SignOut Error:', error.message);
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return user;
}
