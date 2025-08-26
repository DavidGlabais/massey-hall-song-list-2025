# Supabase Storage Policies Setup (Robust Version)

If you are having trouble with permissions, this script is designed to be more robust. It will first **delete any existing policies** that might be causing conflicts and then create the correct ones from a clean slate.

Follow these steps:

1.  **Go to your Supabase Project Dashboard.**
2.  In the left-hand menu, click on the **SQL Editor** icon.
3.  Click **+ New query**.
4.  Copy the entire block of SQL code below and paste it into the query window.
5.  Click the **RUN** button.

This will reset and create three policies:
*   **Public Read Access:** Allows anyone to view the PDF files.
*   **Authenticated Uploads:** Allows any logged-in user (in our case, the admin) to upload new files.
*   **Authenticated Deletes:** Allows any logged-in user (the admin) to delete files.

---

### SQL Code to Reset and Create Storage Policies

Copy and paste all of the following code into the Supabase SQL Editor:

```sql
-- This is a more robust script that first deletes any existing policies
-- to ensure a clean setup.

-- Step 1: Drop existing policies if they exist (to prevent errors)
-- This will ignore errors if the policies don't exist.
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;


-- Step 2: Re-create the policies correctly

-- Policy 1: Allow anyone to VIEW files.
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'song-files' );

-- Policy 2: Allow LOGGED-IN users to UPLOAD files.
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'song-files' AND auth.role() = 'authenticated' );

-- Policy 3: Allow LOGGED-IN users to DELETE files.
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'song-files' AND auth.role() = 'authenticated' );
```

After running these commands, the upload and delete functionality should work correctly.
