# Supabase Migration Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to be ready (usually takes 1-2 minutes)

## Step 2: Get Your Credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy your:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Step 3: Update Configuration

1. Open `src/utils/supabase.js`
2. Replace the placeholder values:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Anon Key
   ```

## Step 4: Set Up Database Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script

## Step 5: Configure Storage

1. Go to Storage in your Supabase dashboard
2. The `product-images` bucket should be created automatically by the schema
3. If not, create it manually:
   - Name: `product-images`
   - Public bucket: ✅ (checked)

## Step 6: Test the Migration

1. Start your React Native app
2. Try to sign up/sign in
3. Test adding products and scanning barcodes
4. Verify images are uploaded to Supabase storage

## Step 7: Remove Firebase Dependencies (Optional)

Once everything is working, you can remove Firebase packages:

```bash
npm uninstall @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/database @react-native-firebase/firestore @react-native-firebase/storage
```

## Benefits of Supabase Migration

✅ **Cost-effective**: Free tier with generous limits  
✅ **Open source**: Full control over your data  
✅ **PostgreSQL**: Powerful relational database  
✅ **Real-time**: Built-in real-time subscriptions  
✅ **Auth**: Built-in authentication system  
✅ **Storage**: File storage with CDN  
✅ **Edge Functions**: Serverless functions  
✅ **Better performance**: PostgreSQL is faster than Firestore for complex queries  

## Troubleshooting

### Common Issues:

1. **Authentication errors**: Make sure your Supabase URL and key are correct
2. **Database errors**: Ensure the schema has been applied correctly
3. **Storage errors**: Check that the `product-images` bucket exists and is public
4. **RLS errors**: Verify that Row Level Security policies are in place

### Support:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues) 