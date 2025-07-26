# Supabase Setup Instructions for DogoApp

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in your project details:
   - Name: `dogoapp` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users

## 2. Get Your Project Keys

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" 
4. Copy the following values:
   - `Project URL`
   - `anon public` key

## 3. Update Your Configuration

1. Open `lib/supabase.ts`
2. Replace the placeholder values:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your Project URL
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon public key
   ```

## 4. Set Up Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Set up Storage
insert into storage.buckets (id, name)
  values ('avatars', 'avatars');

-- Set up storage policies
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can update their own avatar." on storage.objects
  for update using (auth.uid()::text = (storage.foldername(name))[1]);
```

## 5. Optional: Set Up Environment Variables

For better security, you can use environment variables:

1. Create a `.env` file in your project root:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

2. Update `lib/supabase.ts` to use environment variables:
   ```typescript
   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
   ```

## 6. Test Your Setup

1. Run your app: `npm start`
2. Try to sign up with a new account
3. Check if the user appears in your Supabase Auth dashboard
4. Try updating the profile and uploading an avatar

## Features Included

✅ **Authentication**
- Email/password sign up and sign in
- Session management with auto-refresh
- Secure token storage using AsyncStorage

✅ **User Profiles**
- Profile creation and updates
- Avatar upload functionality
- Username and website fields

✅ **Modern UI/UX**
- Gradient backgrounds
- Glass morphism effects
- Smooth animations
- Responsive design
- Platform-specific optimizations

✅ **Enhanced Bottom Navigation**
- Blur effects on iOS
- Modern styling
- Focus states
- Platform-specific heights

## Troubleshooting

**Issue**: "Invalid API key" error
**Solution**: Double-check that you've copied the correct anon public key from your Supabase project settings.

**Issue**: "Table doesn't exist" error
**Solution**: Make sure you've run the SQL schema setup in your Supabase SQL Editor.

**Issue**: Avatar upload fails
**Solution**: Ensure the storage bucket and policies are set up correctly as shown in step 4.

## Next Steps

- Set up additional tables for your dog-related features
- Configure email templates in Supabase Auth
- Set up push notifications
- Add social authentication providers
- Implement real-time features using Supabase Realtime 