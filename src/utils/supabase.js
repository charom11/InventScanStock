import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
// You'll get these from your Supabase project dashboard
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers (replaces Firestore)
export const db = {
  // Get products for a user
  getProducts: async (userId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  // Add a product
  addProduct: async (productData) => {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Update a product
  updateProduct: async (id, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Delete a product
  deleteProduct: async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Get product by barcode
  getProductByBarcode: async (barcode, userId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  // Add a sale
  addSale: async (saleData) => {
    const { data, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Get sales for a user
  getSales: async (userId) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        products (
          product_name,
          barcode
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

// Storage helpers (replaces Firebase Storage)
export const storage = {
  // Upload a file
  uploadFile: async (bucket, path, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    if (error) throw error;
    return data;
  },

  // Get public URL
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete a file
  deleteFile: async (bucket, path) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    if (error) throw error;
  }
};

export default supabase; 