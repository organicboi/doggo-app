import Constants from 'expo-constants';

// // Environment variables
// export const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

// Supabase configuration
export const SUPABASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// App configuration
export const APP_CONFIG = {
  // GOOGLE_MAPS_API_KEY,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
};

// Validate required environment variables
export const validateEnvironment = () => {
  const missingVars = [];
  
  // if (!GOOGLE_MAPS_API_KEY) {
  //   missingVars.push('GOOGLE_MAPS_API_KEY');
  // }
  
  if (!SUPABASE_URL) {
    missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  
  if (!SUPABASE_ANON_KEY) {
    missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars.join(', '));
    return false;
  }
  
  return true;
}; 