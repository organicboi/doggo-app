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

## 5. Set Up Environment Variables (Recommended)

For better security, create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Your `lib/supabase.ts` is already configured to use these environment variables.

## 6. Test Your Setup

1. Run your app: `npm start`
2. Try to sign up with a new account
3. Check if the user appears in your Supabase Auth dashboard
4. Try updating the profile and uploading an avatar

## ✨ New Features Included

### **🛡️ Safe Area Context Implementation**
- **Proper Safe Area Handling**: All screens now properly handle device safe areas including notches, status bars, and home indicators
- **Cross-Platform Compatibility**: Optimized for both iOS and Android with platform-specific adjustments
- **Dynamic Insets**: Uses `useSafeAreaInsets()` hook for real-time safe area calculations

### **🎨 Enhanced UI/UX**
- **Modern Authentication Screen**: 
  - Glassmorphism design with backdrop blur effects
  - Enhanced shadows and gradients
  - Improved typography with text shadows
  - Better keyboard handling and scroll behavior

- **Beautiful Profile Management**:
  - Enhanced avatar upload with modern styling
  - Improved form inputs with better spacing
  - Professional card layouts with backdrop blur

- **Premium Home Dashboard**:
  - Time-based personalized greetings
  - Enhanced quick action cards with better shadows
  - Improved activity feed with modern styling
  - Better spacing and typography throughout

### **📱 Advanced Bottom Tab Navigation**
- **Safe Area Aware**: Automatically adjusts height based on device safe areas
- **Platform Optimizations**: 
  - iOS: Blur background with rounded corners
  - Android: Semi-transparent background with proper shadows
- **Enhanced Visual Feedback**:
  - Icon size animations on focus
  - Shadow effects for active tabs
  - Improved spacing and typography
  - Better touch targets

### **🔧 Technical Improvements**
- **SafeAreaProvider**: Properly configured with `initialWindowMetrics` for optimal performance
- **Edge Configuration**: Strategic use of safe area edges (`['top']`) to avoid over-padding
- **Scroll Optimization**: Enhanced scroll views with proper content sizing
- **Performance**: Optimized rendering with proper safe area calculations

## Features Included

✅ **Authentication**
- Email/password sign up and sign in
- Session management with auto-refresh
- Secure token storage using AsyncStorage
- Modern glassmorphism UI design

✅ **User Profiles**
- Profile creation and updates
- Avatar upload functionality
- Username and website fields
- Enhanced form design

✅ **Safe Area Context**
- Proper handling of device safe areas
- Dynamic inset calculations
- Platform-specific optimizations
- No content behind system UI elements

✅ **Modern UI/UX**
- Gradient backgrounds with enhanced shadows
- Glassmorphism and backdrop blur effects
- Smooth animations and transitions
- Responsive design for all screen sizes
- Professional typography with text shadows

✅ **Enhanced Bottom Navigation**
- Safe area aware tab bar
- Platform-specific blur effects
- Modern styling with rounded corners
- Enhanced visual feedback and animations

## Troubleshooting

**Issue**: "Invalid API key" error
**Solution**: Double-check that you've copied the correct anon public key from your Supabase project settings.

**Issue**: "Table doesn't exist" error
**Solution**: Make sure you've run the SQL schema setup in your Supabase SQL Editor.

**Issue**: Avatar upload fails
**Solution**: Ensure the storage bucket and policies are set up correctly as shown in step 4.

**Issue**: Content appears behind status bar or home indicator
**Solution**: The app now uses SafeAreaProvider and proper safe area handling. Make sure you've imported the components correctly.

**Issue**: Bottom tabs appear behind home indicator
**Solution**: The tab bar now automatically adjusts its height based on device safe areas using `useSafeAreaInsets()`.

## Next Steps

- Set up additional tables for your dog-related features
- Configure email templates in Supabase Auth
- Set up push notifications
- Add social authentication providers
- Implement real-time features using Supabase Realtime
- Add more screens to your app with consistent safe area handling 