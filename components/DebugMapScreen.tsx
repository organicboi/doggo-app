import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

interface UserLocation {
  latitude: number;
  longitude: number;
}

const DebugMapScreen: React.FC = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  const addDebugInfo = (info: string) => {
    console.log('[DEBUG]', info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    initializeDebug();
  }, []);

  const initializeDebug = async () => {
    addDebugInfo('Starting debug initialization...');
    
    // Test Supabase connection
    await testSupabaseConnection();
    
    // Get location
    const location = await requestLocationPermission();
    
    // Test data queries - use the location we just got
    if (location) {
      await testDataQueries(location);
    } else if (userLocation) {
      await testDataQueries(userLocation);
    }
    
    setLoading(false);
  };

  const testSupabaseConnection = async () => {
    try {
      addDebugInfo('Testing Supabase connection...');
      
      // Check if environment variables are set
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      addDebugInfo(`Supabase URL: ${url ? 'SET' : 'NOT SET'}`);
      addDebugInfo(`Supabase Key: ${key ? 'SET' : 'NOT SET'}`);
      
      if (!url || url === 'your-supabase-url' || !key || key === 'your-supabase-anon-key') {
        addDebugInfo('❌ Supabase credentials not properly configured!');
        return;
      }

      // Test a simple query
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        addDebugInfo(`❌ Supabase connection error: ${error.message}`);
        addDebugInfo(`Error code: ${error.code}`);
        addDebugInfo(`Error details: ${JSON.stringify(error.details)}`);
      } else {
        addDebugInfo('✅ Supabase connection successful!');
        setSupabaseConnected(true);
      }
    } catch (error) {
      addDebugInfo(`❌ Supabase test failed: ${error}`);
    }
  };

  const requestLocationPermission = async (): Promise<UserLocation | null> => {
    try {
      addDebugInfo('Requesting location permission...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        addDebugInfo('❌ Location permission denied');
        return null;
      }

      addDebugInfo('✅ Location permission granted');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userLoc);
      addDebugInfo(`✅ Location obtained: ${userLoc.latitude.toFixed(4)}, ${userLoc.longitude.toFixed(4)}`);
      
      return userLoc;
    } catch (error) {
      addDebugInfo(`❌ Location error: ${error}`);
      return null;
    }
  };

  const testDataQueries = async (location?: UserLocation) => {
    const testLocation = location || userLocation;
    if (!testLocation || !supabaseConnected) {
      addDebugInfo('❌ Cannot test queries: missing location or Supabase connection');
      return;
    }

    addDebugInfo('Testing data queries...');

    // Test dogs query
    try {
      addDebugInfo('Testing dogs query...');
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select('id, name, breed, latitude, longitude, is_available_for_walks')
        .eq('is_available_for_walks', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5);

      if (dogsError) {
        addDebugInfo(`❌ Dogs query error: ${dogsError.message}`);
      } else {
        addDebugInfo(`✅ Dogs query successful! Found ${dogsData?.length || 0} dogs`);
        if (dogsData && dogsData.length > 0) {
          dogsData.forEach((dog, index) => {
            addDebugInfo(`  Dog ${index + 1}: ${dog.name} at ${dog.latitude}, ${dog.longitude}`);
          });
        }
      }
    } catch (error) {
      addDebugInfo(`❌ Dogs query failed: ${error}`);
    }

    // Test emergency requests query
    try {
      addDebugInfo('Testing emergency requests query...');
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_requests')
        .select('id, emergency_type, latitude, longitude, status')
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5);

      if (emergencyError) {
        addDebugInfo(`❌ Emergency requests query error: ${emergencyError.message}`);
      } else {
        addDebugInfo(`✅ Emergency requests query successful! Found ${emergencyData?.length || 0} emergencies`);
        if (emergencyData && emergencyData.length > 0) {
          emergencyData.forEach((emergency, index) => {
            addDebugInfo(`  Emergency ${index + 1}: ${emergency.emergency_type} at ${emergency.latitude}, ${emergency.longitude}`);
          });
        }
      }
    } catch (error) {
      addDebugInfo(`❌ Emergency requests query failed: ${error}`);
    }

    // Test posts query
    try {
      addDebugInfo('Testing posts query...');
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, title, latitude, longitude, is_published')
        .eq('is_published', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5);

      if (postsError) {
        addDebugInfo(`❌ Posts query error: ${postsError.message}`);
      } else {
        addDebugInfo(`✅ Posts query successful! Found ${postsData?.length || 0} posts`);
        if (postsData && postsData.length > 0) {
          postsData.forEach((post, index) => {
            addDebugInfo(`  Post ${index + 1}: ${post.title || 'Untitled'} at ${post.latitude}, ${post.longitude}`);
          });
        }
      }
    } catch (error) {
      addDebugInfo(`❌ Posts query failed: ${error}`);
    }

    // Test database functions
    try {
      addDebugInfo('Testing find_nearby_dogs function...');
      const { data: nearbyDogs, error: functionError } = await supabase
        .rpc('find_nearby_dogs', {
          user_lat: testLocation.latitude,
          user_lng: testLocation.longitude,
          radius_km: 10
        });

      if (functionError) {
        addDebugInfo(`❌ find_nearby_dogs function error: ${functionError.message}`);
      } else {
        addDebugInfo(`✅ find_nearby_dogs function successful! Found ${nearbyDogs?.length || 0} dogs`);
      }
    } catch (error) {
      addDebugInfo(`❌ find_nearby_dogs function failed: ${error}`);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  const retestConnection = async () => {
    setLoading(true);
    setDebugInfo([]);
    await initializeDebug();
    setLoading(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 text-lg">Running diagnostics...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-4 pb-4"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Debug Mode</Text>
            <Text className="text-white/90 text-sm">
              Diagnosing map data issues
            </Text>
          </View>
          <View className="bg-white/20 p-3 rounded-full">
            <Ionicons name="bug" size={24} color="white" />
          </View>
        </View>
      </LinearGradient>

      {/* Status Cards */}
      <View className="px-6 py-4">
        <View className="flex-row space-x-4 mb-4">
          <View className={`flex-1 p-4 rounded-xl ${supabaseConnected ? 'bg-green-100' : 'bg-red-100'}`}>
            <Text className={`font-bold ${supabaseConnected ? 'text-green-800' : 'text-red-800'}`}>
              Supabase
            </Text>
            <Text className={`text-sm ${supabaseConnected ? 'text-green-600' : 'text-red-600'}`}>
              {supabaseConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          
          <View className={`flex-1 p-4 rounded-xl ${userLocation ? 'bg-green-100' : 'bg-red-100'}`}>
            <Text className={`font-bold ${userLocation ? 'text-green-800' : 'text-red-800'}`}>
              Location
            </Text>
            <Text className={`text-sm ${userLocation ? 'text-green-600' : 'text-red-600'}`}>
              {userLocation ? 'Obtained' : 'Missing'}
            </Text>
          </View>
        </View>

        {userLocation && (
          <View className="bg-blue-100 p-4 rounded-xl mb-4">
            <Text className="font-bold text-blue-800 mb-1">Your Location</Text>
            <Text className="text-blue-600 text-sm">
              Lat: {userLocation.latitude.toFixed(6)}
            </Text>
            <Text className="text-blue-600 text-sm">
              Lng: {userLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row space-x-3 mb-4">
          <Pressable
            onPress={retestConnection}
            className="flex-1 bg-blue-500 py-3 rounded-xl"
          >
            <Text className="text-center text-white font-medium">Retest All</Text>
          </Pressable>
          
          <Pressable
            onPress={clearDebugInfo}
            className="flex-1 bg-gray-500 py-3 rounded-xl"
          >
            <Text className="text-center text-white font-medium">Clear Log</Text>
          </Pressable>
        </View>
      </View>

      {/* Debug Log */}
      <View className="flex-1 px-6">
        <Text className="text-lg font-bold text-gray-800 mb-3">Debug Log</Text>
        <ScrollView className="flex-1 bg-gray-50 rounded-xl p-4">
          {debugInfo.map((info, index) => (
            <Text key={index} className="text-sm text-gray-700 mb-1 font-mono">
              {info}
            </Text>
          ))}
          {debugInfo.length === 0 && (
            <Text className="text-gray-500 text-center">No debug information yet</Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default DebugMapScreen; 