# Enhanced Create Post Feature Setup Guide

## Overview
The community tab now includes an enhanced post creation modal with support for both photos and videos, using the 'dogs' storage bucket for optimal organization.

## Features Added

### 🎯 Enhanced Post Creation Modal
- **Photo Support**: Upload up to 5 photos from gallery or camera
- **Video Support**: Upload 1 video (up to 60 seconds) from gallery or camera  
- **Mixed Media Validation**: Prevents mixing photos and videos in same post
- **Professional UI**: Modern card-based design with clear visual feedback
- **Storage Organization**: Uses structured folder system in 'dogs' bucket

### 📱 Improved User Experience
- **Extended FAB**: Floating action button now shows "Create Post" label
- **Media Selection Grid**: Four clear options - Photos, Videos, Camera, Record
- **Visual Previews**: Thumbnails for photos, play icons for videos
- **Progress Feedback**: Loading states and success/error messages
- **Form Validation**: Prevents incomplete or invalid submissions

### 🎬 Video Features
- **Duration Limit**: 60-second maximum to optimize storage and loading
- **Quality Control**: Optimized compression for mobile viewing
- **Single Video**: Focused experience with one video per post
- **Play Preview**: Visual indicator showing video is selected

## Required Dependencies

Ensure these packages are installed:

```bash
# Image/Video picker for media selection
npx expo install expo-image-picker

# Location services for post location
npx expo install expo-location

# Vector icons (should already be installed)
npx expo install @expo/vector-icons
```

## Storage Configuration

### Supabase Storage Setup
The feature uses the existing 'dogs' bucket with organized folder structure:

```
dogs/
├── community/
│   ├── images/
│   │   └── [timestamp]-[random].jpg
│   └── videos/
│       └── [timestamp]-[random].mp4
└── [other existing folders]
```

### Permissions Required
Make sure these policies exist in your Supabase 'dogs' storage bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload community media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'dogs' AND auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public can view community media" ON storage.objects
FOR SELECT USING (bucket_id = 'dogs');
```

## UI/UX Improvements

### Modern Design Elements
- **Glassmorphism Effects**: Subtle transparency and blur
- **Micro-interactions**: Button press animations and feedback
- **Visual Hierarchy**: Clear sections with proper spacing
- **Accessibility**: Proper contrast ratios and touch targets

### Responsive Layout
- **Flexible Grid**: Media buttons adapt to screen size
- **Scroll Optimization**: Horizontal scrolling for media previews
- **Safe Areas**: Proper padding for notched devices
- **Keyboard Handling**: Form adjusts when keyboard appears

## File Structure

```
components/
├── CreatePostModal.tsx          # Enhanced post creation (UPDATED)
├── FloatingActionButton.tsx     # Extended FAB with label (UPDATED)
├── CommunityPost.tsx           # Displays posts with video support
└── [other community components]

app/(tabs)/
├── community.tsx               # Main community screen (UPDATED)
└── _layout.tsx                # Tab navigation

stores/
└── authStore.ts               # User authentication state
```

## How to Use

### Creating a Post
1. **Tap "Create Post"** - Extended floating action button at bottom-right
2. **Choose Post Type** - Photo, Video, Story, or Help Request
3. **Add Content** - Title (optional) and description (required)
4. **Select Media**:
   - **Photos**: Tap "Photos" to select from gallery (up to 5)
   - **Videos**: Tap "Videos" to select from gallery (1 video max)
   - **Camera**: Tap "Camera" to take a photo instantly
   - **Record**: Tap "Record" to record a video instantly
5. **Tag a Dog** - Optional: Select which dog is featured
6. **Add Location** - Auto-detected or manually entered
7. **Publish** - Tap "Post" to share with the community

### Media Guidelines
- **Photos**: JPEG format, optimized to 0.8 quality
- **Videos**: MP4 format, 60-second limit, 0.8 quality
- **File Naming**: Automatic timestamp + random string
- **Storage Path**: Organized in community/images or community/videos

## Database Schema

The posts table supports video with the `video_url` field:

```sql
-- Posts table already includes:
video_url TEXT,           -- Single video URL
images TEXT[],           -- Array of image URLs
post_type VARCHAR(20),   -- 'photo', 'video', 'story', 'help_request'
```

## Testing Checklist

### Photo Upload ✅
- [ ] Select multiple photos from gallery
- [ ] Take photo with camera
- [ ] Preview shows correctly
- [ ] Upload to correct storage path
- [ ] Post displays in community feed

### Video Upload ✅
- [ ] Select video from gallery
- [ ] Record video with camera
- [ ] Respects 60-second limit
- [ ] Upload to correct storage path
- [ ] Video plays in community feed

### Validation ✅
- [ ] Cannot mix photos and videos
- [ ] Content field is required
- [ ] Character limits enforced
- [ ] File size limits respected

### UI/UX ✅
- [ ] Animations work smoothly
- [ ] Loading states show correctly
- [ ] Error messages are clear
- [ ] Form resets after posting

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Check camera/gallery permissions in device settings
   - Verify Supabase storage policies are correct

2. **Videos not uploading**
   - Ensure video is under 60 seconds
   - Check file size isn't too large
   - Verify 'dogs' bucket exists and is accessible

3. **UI layout issues**
   - Check that all required dependencies are installed
   - Restart Metro bundler after installing new packages

4. **Authentication errors**
   - Verify user is properly logged in
   - Check authStore is correctly implemented

## Performance Optimization

### Image/Video Optimization
- Automatic quality compression (0.8)
- Efficient blob upload method
- Structured storage organization
- Lazy loading in community feed

### UI Performance
- Optimized re-renders with proper state management
- Efficient scroll views for media previews
- Animated transitions with native driver
- Minimal API calls during upload

## Security Considerations

### File Validation
- File type restrictions (images/videos only)
- Size limits to prevent abuse
- Automatic filename generation prevents conflicts

### Access Control
- Authenticated users only for uploads
- Public read for community viewing
- User ownership tracking in database

---

## Next Steps

After setup, users can:
1. Create rich posts with photos or videos
2. Browse community feed with media content
3. Engage through likes, comments, and shares
4. Discover content through hashtags and filters

The enhanced create post feature provides a professional social media experience optimized for the dog community! 🐕✨
