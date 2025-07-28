import { Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper'; // ✅ Import PaperProvider
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import Auth from '../components/Auth';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <PaperProvider>
          <View style={{ flex: 1, backgroundColor: '#667eea' }} />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <PaperProvider>
          <Auth />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <PaperProvider>  {/* ✅ Wrap whole app here */}
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
