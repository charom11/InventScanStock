const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://abatpxobqsbxxqrenlxn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYXRweG9icXNieHhxcmVubHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4NjY1MDcsImV4cCI6MjA2NzQ0MjUwN30.7TS2WBFvW7wHBCla2qHNtpw6oy6okR1rv5kMGz7aWsk';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseStorage() {
  console.log('🔍 Testing Supabase Storage...\n');
  
  try {
    // Test 1: List existing buckets
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
      return;
    }
    
    // Use the existing 'product-images' bucket
    const testBucketName = 'product-images';
    console.log(`\n2. Using existing bucket '${testBucketName}'...`);
    
    // Test 3: Create a test file
    console.log('\n3. Creating test file...');
    const testFileName = 'test-file.txt';
    const testContent = 'This is a test file for Supabase storage';
    const testFilePath = path.join(__dirname, testFileName);
    
    // Write test file to disk
    fs.writeFileSync(testFilePath, testContent);
    console.log(`✅ Test file created: ${testFilePath}`);
    
    // Test 4: Upload file to storage
    console.log('\n4. Uploading test file to storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(testBucketName)
      .upload(`test/${testFileName}`, fs.createReadStream(testFilePath), {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
    } else {
      console.log('✅ File uploaded successfully');
      console.log('   Path:', uploadData.path);
    }
    
    // Test 5: List files in bucket
    console.log('\n5. Listing files in bucket...');
    const { data: files, error: listError } = await supabase.storage
      .from(testBucketName)
      .list('test');
    
    if (listError) {
      console.log('❌ Failed to list files:', listError.message);
    } else {
      console.log('📁 Files in bucket:');
      if (files && files.length > 0) {
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
        });
      } else {
        console.log('   No files found');
      }
    }
    
    // Test 6: Get public URL
    console.log('\n6. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from(testBucketName)
      .getPublicUrl(`test/${testFileName}`);
    
    console.log('🔗 Public URL:', urlData.publicUrl);
    
    // Test 7: Download file
    console.log('\n7. Testing file download...');
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(testBucketName)
      .download(`test/${testFileName}`);
    
    if (downloadError) {
      console.log('❌ Download failed:', downloadError.message);
    } else {
      console.log('✅ File downloaded successfully');
      console.log('   Size:', downloadData.size, 'bytes');
    }
    
    // Test 8: Delete uploaded file
    console.log('\n8. Cleaning up - deleting test file...');
    const { error: deleteError } = await supabase.storage
      .from(testBucketName)
      .remove([`test/${testFileName}`]);
    
    if (deleteError) {
      console.log('❌ Delete failed:', deleteError.message);
    } else {
      console.log('✅ Test file deleted successfully');
    }
    
    // Clean up local test file
    try {
      fs.unlinkSync(testFilePath);
      console.log('✅ Local test file cleaned up');
    } catch (e) {
      console.log('⚠️  Could not delete local test file:', e.message);
    }
    
    console.log('\n🎉 Supabase Storage test completed!');
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Error details:', error);
  }
}

testSupabaseStorage(); 