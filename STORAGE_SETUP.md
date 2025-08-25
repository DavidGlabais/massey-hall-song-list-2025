# Supabase Storage Setup for PDF Files

## Required Setup Steps

### 1. Create Storage Bucket
In your Supabase dashboard (https://supabase.com/dashboard):

1. Go to **Storage** → **Buckets**
2. Click **"New bucket"**
3. Set bucket name: `song-files`
4. Make it **Public** (check the "Public bucket" option)
5. Click **"Create bucket"**

### 2. Set Storage Policies (if bucket is not public)
If you didn't make the bucket public, you'll need to create policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow uploads for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'song-files' AND auth.role() = 'authenticated');

-- Allow public access to view files
CREATE POLICY "Allow public access to files" ON storage.objects
FOR SELECT USING (bucket_id = 'song-files');

-- Allow authenticated users to delete files
CREATE POLICY "Allow deletes for authenticated users" ON storage.objects
FOR DELETE USING (bucket_id = 'song-files' AND auth.role() = 'authenticated');
```

### 3. Test Upload
After setting up the bucket:
1. Login as admin on your app
2. Try uploading a PDF file
3. Check the browser console for detailed error messages

## Troubleshooting

### "Bucket not found" error:
- Make sure bucket name is exactly `song-files`
- Bucket must be created in your Supabase project

### "Policy" or "RLS" errors:
- Make sure bucket is set to Public, OR
- Create the storage policies above

### "Invalid bucket" error:
- Check your Supabase URL and keys in .env file
- Make sure you're connected to the correct project

## Current Upload Features
- ✅ File type validation (PDF only)
- ✅ File size limit (10MB)
- ✅ Unique filenames with timestamps
- ✅ Admin-only access
- ✅ Inline positioning with song titles
- ✅ Better error messages
- ✅ Console logging for debugging
