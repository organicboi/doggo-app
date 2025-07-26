import { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import Auth from '../components/Auth';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading or auth screen if no session
  if (loading) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <View style={{ flex: 1, backgroundColor: '#667eea' }} />
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <Auth />
      </SafeAreaProvider>
    );
  }

  // Show main app if authenticated
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
