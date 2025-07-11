const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://abatpxobqsbxxqrenlxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYXRweG9icXNieHhxcmVubHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NjY1MDcsImV4cCI6MjA2NzQ0MjUwN30.7TS2WBFvW7wHBCla2qHNtpw6oy6okR1rv5kMGz7aWsk';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  try {
    // Test 1: Check if we can connect to Supabase (basic health check)
    console.log('1. Testing basic connection...');
    // Try to select from products table
    const { error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    if (productsError) {
      if (productsError.code === '42P01') {
        console.log('❌ Table "products" does not exist');
      } else {
        console.log('❌ Connection failed:', productsError.message);
        console.log('Error code:', productsError.code);
        console.log('Error details:', productsError.details);
      }
      return;
    }
    console.log('✅ Basic connection and products table access successful!');

    // Test 2: Check authentication status
    console.log('\n2. Testing authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('⚠️  Auth check error:', authError.message);
    } else if (user) {
      console.log('✅ User is authenticated:', user.email);
    } else {
      console.log('ℹ️  No user currently authenticated (this is normal for anonymous access)');
    }

    // Test 3: Check sales table
    console.log('\n3. Testing sales table access...');
    const { error: salesError } = await supabase
      .from('sales')
      .select('*')
      .limit(1);
    if (salesError) {
      if (salesError.code === '42P01') {
        console.log('❌ Table "sales" does not exist');
      } else {
        console.log('❌ Sales table access error:', salesError.message);
      }
    } else {
      console.log('✅ Sales table is accessible');
    }

    // Test 4: Check storage buckets
    console.log('\n4. Testing storage access...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.log('❌ Storage access error:', bucketsError.message);
      } else {
        console.log('📦 Available storage buckets:');
        if (buckets && buckets.length > 0) {
          buckets.forEach(bucket => {
            console.log(`   - ${bucket.name} (public: ${bucket.public})`);
          });
        } else {
          console.log('   No storage buckets found');
        }
      }
    } catch (e) {
      console.log('❌ Storage test failed:', e.message);
    }

    console.log('\n🎉 Supabase connection test completed!');
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Error details:', error);
  }
}

testSupabaseConnection(); 