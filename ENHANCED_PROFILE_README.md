# Enhanced Profile Component

This enhanced profile component provides a comprehensive user profile management system for the DogoApp.

## Features

### 📱 User Interface
- **Cover Image**: Users can upload and change their cover image
- **Avatar Management**: Profile picture upload and management using the Avatar component
- **Stats Display**: Shows user statistics (walks, dogs helped, rating, points)
- **Responsive Design**: Works well on different screen sizes
- **Modern UI**: Beautiful gradient backgrounds and card-based layouts

### 👤 User Information Management
- **Basic Information**: Full name, display name, email, phone, date of birth, gender
- **Location Details**: Complete address management with preferred radius settings
- **User Types**: Toggle between walker and owner roles
- **Notification Settings**: Manage push notifications, email notifications, and SMS notifications

### 🏆 Achievements & Gamification
- **User Achievements**: View and track achievements with progress bars
- **Points System**: Display user points and rewards
- **Stats Tracking**: Total walks, dogs helped, ratings, and more

### 🔐 Verification & Security
- **Verification Status**: Display phone, email, identity, and background check verification
- **Background Checks**: Show background check status and dates
- **Security Features**: Identity verification system

### 💳 Subscription Management
- **Subscription Tiers**: Free, Premium, Pro tiers
- **Subscription Info**: Display current tier and expiration dates
- **Upgrade Options**: Easy access to subscription upgrades

## Database Schema Integration

The component integrates with the following database tables:

### `users` table
- Stores all user profile information
- Handles profile images via Supabase storage buckets
- Manages user preferences and settings

### `user_achievements` table  
- Tracks user achievements and progress
- Links to the `achievements` table for achievement definitions

### Storage Buckets
1. **`user-profile-image`**: Stores user avatar images
2. **`user-cover-image`**: Stores user cover images

## Usage

```tsx
import EnhancedProfile from '../components/EnhancedProfile'
import { Session } from '@supabase/supabase-js'

function ProfileScreen({ session }: { session: Session }) {
  return <EnhancedProfile session={session} />
}
```

## Key Components

### EnhancedProfile.tsx
- Main profile component with edit functionality
- Image upload capabilities
- Form management for all user data

### UserAchievements.tsx
- Modal component showing user achievements
- Progress tracking and completion status
- Achievement categories and rewards

### Avatar.tsx (existing)
- Handles profile picture display and upload
- Integrates with the image service

## Image Service Integration

The component uses the enhanced `ImageService` for:
- **Image Upload**: Handles image compression and upload to Supabase storage
- **Image Processing**: Resizes and optimizes images before upload
- **Storage Management**: Manages files in appropriate storage buckets
- **Permission Handling**: Requests camera and photo library permissions

## Features Implemented

✅ **Complete Profile Management**
- Basic info, location, preferences
- Image uploads for avatar and cover
- Real-time form validation

✅ **Achievement System**
- View completed and in-progress achievements
- Progress bars and completion status
- Points and rewards system

✅ **Subscription Management**  
- Current tier display
- Upgrade options
- Expiration tracking

✅ **Verification System**
- Multiple verification types
- Status indicators
- Background check integration

✅ **Settings & Preferences**
- Notification preferences
- User type toggles (walker/owner)
- Preferred search radius

## Future Enhancements

- [ ] Real-time achievement notifications
- [ ] Social features (friends, following)
- [ ] Advanced privacy settings
- [ ] Backup and export options
- [ ] Dark mode theme support
- [ ] Accessibility improvements

## Dependencies

The component requires these packages (already installed):
- `@expo/vector-icons`
- `expo-image-picker`
- `expo-linear-gradient`
- `react-native-safe-area-context`
- `@supabase/supabase-js`
- `expo-file-system`
- `expo-image-manipulator`

## Notes

- The component automatically creates a user profile if one doesn't exist
- All image uploads are processed and optimized before storage
- The component handles both light and dark themes
- Form validation ensures data integrity
- All database operations include proper error handling
