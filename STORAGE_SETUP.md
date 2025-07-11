# Supabase Storage Setup Guide

## Manual Storage Bucket Creation

Since the storage bucket creation failed due to Row Level Security (RLS) policies, you need to create it manually in the Supabase dashboard.

### Step 1: Access Supabase Dashboard

1. Go to [supabase.com](https://supabase.com) and sign in
2. Navigate to your project: `abatpxobqsbxxqrenlxn`
3. Go to **Storage** in the left sidebar

### Step 2: Create Storage Bucket

1. Click **"New bucket"** button
2. Enter the following details:
   - **Name**: `product-images`
   - **Public bucket**: ✅ (checked)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
3. Click **"Create bucket"**

### Step 3: Verify Bucket Creation

1. You should see the `product-images` bucket in your storage list
2. The bucket should show as **Public**
3. Test the bucket by running: `node test-supabase-storage.js`

### Step 4: RLS Policies

The RLS policies for storage are already defined in `supabase-schema.sql`. Make sure you've run this schema in your Supabase SQL editor.

### Troubleshooting

If you encounter issues:

1. **Permission denied**: Make sure you're logged in as the project owner
2. **RLS errors**: Check that the storage policies are applied correctly
3. **Bucket not found**: Refresh the dashboard and check again

## Testing Storage

After creating the bucket, run the test script:

```bash
node test-supabase-storage.js
```

This will verify that:
- The bucket exists and is accessible
- File upload/download works
- Public URLs are generated correctly

## Next Steps

Once the storage bucket is created:
1. Image picker functionality will work in ProductManagementScreen
2. Product images will be stored in Supabase storage
3. Images will be accessible via public URLs 