# Google Maps API Setup Guide for DogoApp

## ✅ What's Already Configured

Your app is now set up with:
- ✅ Environment variable configuration (`.env` file)
- ✅ Expo configuration (`app.config.js`)
- ✅ API key validation (`lib/config.ts`)
- ✅ Test component (`components/MapTest.tsx`)

## 🔑 Required Google Maps API Services

You need to enable these APIs in your Google Cloud Console:

### 1. **Maps SDK for Android**
- **Purpose**: Display maps on Android devices
- **Location**: Google Cloud Console → APIs & Services → Library
- **Search**: "Maps SDK for Android"

### 2. **Maps SDK for iOS**
- **Purpose**: Display maps on iOS devices
- **Location**: Google Cloud Console → APIs & Services → Library
- **Search**: "Maps SDK for iOS"

### 3. **Places API** (Optional but Recommended)
- **Purpose**: Location search and place details
- **Location**: Google Cloud Console → APIs & Services → Library
- **Search**: "Places API"

### 4. **Geocoding API** (Optional but Recommended)
- **Purpose**: Convert addresses to coordinates
- **Location**: Google Cloud Console → APIs & Services → Library
- **Search**: "Geocoding API"

## 🚀 Setup Steps

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)

2. **Create/Select Project**:
   - Click "Select a project" → "New Project"
   - Name: `DogoApp` (or your preferred name)

3. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Search and enable each API listed above

4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

### Step 2: Secure Your API Key

1. **Click on your API key** to edit it

2. **Application Restrictions**:
   - Select "Android apps"
   - Add package name: `com.akshaygaddi.dogoapp`
   - Select "iOS apps"
   - Add bundle ID: `com.akshaygaddi.dogoapp`

3. **API Restrictions**:
   - Select "Restrict key"
   - Choose the APIs you enabled (Maps SDK for Android, Maps SDK for iOS, etc.)

### Step 3: Update Your Environment

1. **Edit `.env` file**:
   ```bash
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

2. **Replace `your_actual_api_key_here`** with your real API key

### Step 4: Test Your Setup

1. **Run the test component**:
   ```bash
   npm start
   ```

2. **Navigate to the test screen** to verify:
   - ✅ API key is loaded
   - ✅ Map displays correctly
   - ✅ No error messages

## 🔧 Troubleshooting

### Common Issues:

1. **"API key not valid" error**:
   - Check if you've enabled the correct APIs
   - Verify API key restrictions are set correctly
   - Ensure the package name matches your app

2. **Map not loading**:
   - Check your internet connection
   - Verify the API key is correctly set in `.env`
   - Restart the development server

3. **"Missing API key" error**:
   - Ensure `.env` file exists in project root
   - Check that the API key variable name is correct
   - Restart the development server

### Testing Commands:

```bash
# Clear cache and restart
npx expo start --clear

# Check environment variables
echo $GOOGLE_MAPS_API_KEY

# Test on specific platform
npx expo run:android
npx expo run:ios
```

## 📱 Platform-Specific Notes

### Android
- Requires Google Play Services
- API key is embedded in the app bundle
- Test on physical device for best results

### iOS
- Requires iOS 11.0 or later
- API key is embedded in the app bundle
- Test on physical device for best results

## 💰 Billing Information

- **Free Tier**: $200/month credit (usually sufficient for development)
- **Pricing**: Pay-as-you-go after free tier
- **Monitoring**: Set up billing alerts in Google Cloud Console

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** (already configured)
3. **Restrict API keys** to your app's package name
4. **Monitor usage** in Google Cloud Console
5. **Set up billing alerts** to avoid unexpected charges

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Google Cloud Console setup
3. Check the [react-native-maps documentation](https://github.com/react-native-maps/react-native-maps)
4. Review [Google Maps API documentation](https://developers.google.com/maps/documentation) 