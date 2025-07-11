import { supabase } from './supabase';

// Sign up with email and password
export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { user: data?.user, error };
}

// Sign up with email, password, and profile info (auto-create profile row)
export async function signUpWithProfile(email, password, fullName, avatarUrl = '') {
  // Sign up the user with metadata (trigger will create profile)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        avatar_url: avatarUrl,
      }
    }
  });
  if (error) throw error;
  return data.user;
}

// Sign in with email and password
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { user: data?.user, error };
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
} 