import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

const SimpleDebugScreen: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addDebugInfo = (info: string) => {
    console.log('[DEBUG]', info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testAllQueries = async () => {
    setLoading(true);
    setDebugInfo([]);
    
    addDebugInfo('🔍 Starting database tests...');

    // Test 1: Count all dogs
    try {
      const { count, error } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        addDebugInfo(`❌ Dogs count error: ${error.message}`);
      } else {
        addDebugInfo(`✅ Total dogs in database: ${count}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Dogs count failed: ${error}`);
    }

    // Test 2: Get first 5 dogs with location
    try {
      const { data: dogs, error } = await supabase
        .from('dogs')
        .select('id, name, breed, latitude, longitude, is_available_for_walks, dog_type')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5);
      
      if (error) {
        addDebugInfo(`❌ Dogs query error: ${error.message}`);
      } else {
        addDebugInfo(`✅ Dogs with location: ${dogs?.length || 0}`);
        dogs?.forEach((dog, i) => {
          addDebugInfo(`  ${i+1}. ${dog.name} (${dog.dog_type}) at ${dog.latitude}, ${dog.longitude}`);
        });
      }
    } catch (error) {
      addDebugInfo(`❌ Dogs query failed: ${error}`);
    }

    // Test 3: Count emergencies
    try {
      const { count, error } = await supabase
        .from('emergency_requests')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        addDebugInfo(`❌ Emergency count error: ${error.message}`);
      } else {
        addDebugInfo(`✅ Total emergencies in database: ${count}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Emergency count failed: ${error}`);
    }

    // Test 4: Get emergencies with location
    try {
      const { data: emergencies, error } = await supabase
        .from('emergency_requests')
        .select('id, emergency_type, severity, latitude, longitude, status')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5);
      
      if (error) {
        addDebugInfo(`❌ Emergency query error: ${error.message}`);
      } else {
        addDebugInfo(`✅ Emergencies with location: ${emergencies?.length || 0}`);
        emergencies?.forEach((emergency, i) => {
          addDebugInfo(`  ${i+1}. ${emergency.emergency_type} (${emergency.severity}) at ${emergency.latitude}, ${emergency.longitude}`);
        });
      }
    } catch (error) {
      addDebugInfo(`❌ Emergency query failed: ${error}`);
    }

    // Test 5: Count posts
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        addDebugInfo(`❌ Posts count error: ${error.message}`);
      } else {
        addDebugInfo(`✅ Total posts in database: ${count}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Posts count failed: ${error}`);
    }

    // Test 6: Get posts with location
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, post_type, latitude, longitude, is_published')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5);
      
      if (error) {
        addDebugInfo(`❌ Posts query error: ${error.message}`);
      } else {
        addDebugInfo(`✅ Posts with location: ${posts?.length || 0}`);
        posts?.forEach((post, i) => {
          addDebugInfo(`  ${i+1}. ${post.title || 'Untitled'} (${post.post_type}) at ${post.latitude}, ${post.longitude}`);
        });
      }
    } catch (error) {
      addDebugInfo(`❌ Posts query failed: ${error}`);
    }

    // Test 7: Test the find_nearby_dogs function
    try {
      const { data: nearbyDogs, error } = await supabase
        .rpc('find_nearby_dogs', {
          user_lat: 18.4482,
          user_lng: 73.8993,
          radius_km: 50
        });
      
      if (error) {
        addDebugInfo(`❌ find_nearby_dogs function error: ${error.message}`);
      } else {
        addDebugInfo(`✅ find_nearby_dogs function returned: ${nearbyDogs?.length || 0} dogs`);
                 nearbyDogs?.forEach((dog: any, i: number) => {
           addDebugInfo(`  ${i+1}. ${dog.name} - ${dog.distance_km?.toFixed(2)}km away`);
         });
      }
    } catch (error) {
      addDebugInfo(`❌ find_nearby_dogs function failed: ${error}`);
    }

    // Test 8: Check current user authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        addDebugInfo(`❌ Auth error: ${error.message}`);
      } else if (user) {
        addDebugInfo(`✅ User authenticated: ${user.email || user.phone || user.id}`);
      } else {
        addDebugInfo(`⚠️ No user authenticated - this might affect RLS queries`);
      }
    } catch (error) {
      addDebugInfo(`❌ Auth check failed: ${error}`);
    }

    addDebugInfo('🏁 All tests completed!');
    setLoading(false);
  };

  const clearLog = () => {
    setDebugInfo([]);
  };

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
            <Text className="text-white text-2xl font-bold">Database Debug</Text>
            <Text className="text-white/90 text-sm">
              Testing Pune data queries
            </Text>
          </View>
          <View className="bg-white/20 p-3 rounded-full">
            <Ionicons name="server" size={24} color="white" />
          </View>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View className="px-6 py-4">
        <View className="flex-row space-x-3">
          <Pressable
            onPress={testAllQueries}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
          >
            <Text className="text-center text-white font-medium">
              {loading ? 'Testing...' : 'Test Database'}
            </Text>
          </Pressable>
          
          <Pressable
            onPress={clearLog}
            className="flex-1 bg-gray-500 py-3 rounded-xl"
          >
            <Text className="text-center text-white font-medium">Clear Log</Text>
          </Pressable>
        </View>
      </View>

      {/* Debug Log */}
      <View className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-gray-800">Database Test Results</Text>
          {loading && <ActivityIndicator size="small" color="#3b82f6" />}
        </View>
        
        <ScrollView className="flex-1 bg-gray-50 rounded-xl p-4">
          {debugInfo.map((info, index) => (
            <Text key={index} className="text-sm text-gray-700 mb-1 font-mono">
              {info}
            </Text>
          ))}
          {debugInfo.length === 0 && (
            <View className="flex-1 justify-center items-center">
                             <Ionicons name="server" size={64} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-4">
                Tap "Test Database" to check your Pune data
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SimpleDebugScreen; 