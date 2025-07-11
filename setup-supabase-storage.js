const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://abatpxobqsbxxqrenlxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYXRweG9icXNieHhxcmVubHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NjY1MDcsImV4cCI6MjA2NzQ0MjUwN30.7TS2WBFvW7wHBCla2qHNtpw6oy6okR1rv5kMGz7aWsk';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupSupabaseStorage() {
  console.log('🔧 Setting up Supabase Storage...\n');
  
  try {
    // Step 1: Check existing buckets
    console.log('1. Checking existing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Failed to list buckets:', bucketsError.message);
      return;
    }
    
    console.log('📦 Available buckets:');
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (public: ${bucket.public})`);
      });
    } else {
      console.log('   No buckets found');
    }
    
    // Step 2: Check if product-images bucket exists
    const bucketName = 'product-images';
    const existingBucket = buckets?.find(bucket => bucket.name === bucketName);
    
    if (existingBucket) {
      console.log(`\n✅ Bucket '${bucketName}' already exists`);
      console.log(`   Public: ${existingBucket.public}`);
      console.log(`   Created: ${existingBucket.created_at}`);
    } else {
      console.log(`\n2. Creating bucket '${bucketName}'...`);
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB limit
      });
      
      if (createError) {
        console.log('❌ Failed to create bucket:', createError.message);
        console.log('Error details:', createError);
        return;
      }
      
      console.log('✅ Bucket created successfully');
      console.log('   Name:', newBucket.name);
      console.log('   Public:', newBucket.public);
    }
    
    // Step 3: Test bucket access
    console.log('\n3. Testing bucket access...');
    const { data: testFiles, error: testError } = await supabase.storage
      .from(bucketName)
      .list();
    
    if (testError) {
      console.log('❌ Failed to access bucket:', testError.message);
    } else {
      console.log('✅ Bucket access successful');
      console.log(`   Files in bucket: ${testFiles?.length || 0}`);
    }
    
    // Step 4: Set up RLS policies (these should be handled by the schema)
    console.log('\n4. Checking RLS policies...');
    console.log('ℹ️  RLS policies should be set up via the supabase-schema.sql file');
    console.log('   If policies are missing, run the schema file in your Supabase SQL editor');
    
    console.log('\n🎉 Supabase Storage setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. The product-images bucket is now ready');
    console.log('   2. Image upload functionality should work in the app');
    console.log('   3. Test image upload in ProductManagementScreen');
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Error details:', error);
  }
}

setupSupabaseStorage(); 