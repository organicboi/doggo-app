import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface HomePageProps {
  onSignOut: () => void;
  userEmail?: string;
}

const HomePage: React.FC<HomePageProps> = ({ onSignOut, userEmail }) => {
  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-12 pb-8"
      >
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-2xl font-bold">Welcome to</Text>
            <Text className="text-white text-3xl font-bold">PawPals 🐾</Text>
          </View>
          <Pressable 
            onPress={onSignOut}
            className="bg-white/20 p-3 rounded-full"
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
          </Pressable>
        </View>
        
        <Text className="text-white/90 text-base leading-6">
          Connect with dogs in need, build community, and make every walk count!
        </Text>
      </LinearGradient>

      {/* Quick Stats */}
      <View className="px-6 -mt-4">
        <View className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <View className="bg-blue-100 p-3 rounded-full mb-2">
                <FontAwesome5 name="dog" size={20} color="#3b82f6" />
              </View>
              <Text className="text-gray-600 text-sm">Dogs Nearby</Text>
              <Text className="text-2xl font-bold text-gray-800">24</Text>
            </View>
            <View className="items-center flex-1">
              <View className="bg-green-100 p-3 rounded-full mb-2">
                <Ionicons name="walk" size={20} color="#10b981" />
              </View>
              <Text className="text-gray-600 text-sm">Your Walks</Text>
              <Text className="text-2xl font-bold text-gray-800">12</Text>
            </View>
            <View className="items-center flex-1">
              <View className="bg-purple-100 p-3 rounded-full mb-2">
                <Ionicons name="heart" size={20} color="#8b5cf6" />
              </View>
              <Text className="text-gray-600 text-sm">Helped</Text>
              <Text className="text-2xl font-bold text-gray-800">8</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Actions */}
      <View className="px-6 mt-6">
        <Text className="text-2xl font-bold text-gray-800 mb-4">What would you like to do?</Text>
        
        <View className="space-y-4">
          {/* Find Dogs to Walk */}
          <Pressable className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg">
            <LinearGradient
              colors={['#3b82f6', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl p-6 -m-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-2">Find Dogs to Walk</Text>
                  <Text className="text-white/90 text-sm">Discover friendly dogs nearby ready for adventures</Text>
                </View>
                <View className="bg-white/20 p-4 rounded-full">
                  <Ionicons name="map" size={28} color="white" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Help Stray Dogs */}
          <Pressable className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 shadow-lg">
            <LinearGradient
              colors={['#f97316', '#ef4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl p-6 -m-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-2">Help Stray Dogs</Text>
                  <Text className="text-white/90 text-sm">Report and assist dogs in need of care</Text>
                </View>
                <View className="bg-white/20 p-4 rounded-full">
                  <MaterialIcons name="pets" size={28} color="white" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Community Hub */}
          <Pressable className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 shadow-lg">
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl p-6 -m-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-2">Community Hub</Text>
                  <Text className="text-white/90 text-sm">Share experiences and connect with fellow dog lovers</Text>
                </View>
                <View className="bg-white/20 p-4 rounded-full">
                  <Ionicons name="people" size={28} color="white" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Recent Activity */}
      <View className="px-6 mt-8">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Recent Activity</Text>
        
        <View className="space-y-3">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center">
              <View className="bg-blue-100 p-2 rounded-full mr-3">
                <Ionicons name="walk" size={16} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">Walked with Buddy</Text>
                <Text className="text-gray-600 text-sm">2 hours ago • 30 minutes</Text>
              </View>
              <Text className="text-blue-600 font-semibold">+5 pts</Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center">
              <View className="bg-orange-100 p-2 rounded-full mr-3">
                <MaterialIcons name="report" size={16} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">Reported stray dog</Text>
                <Text className="text-gray-600 text-sm">Yesterday • Central Park area</Text>
              </View>
              <Text className="text-orange-600 font-semibold">+10 pts</Text>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center">
              <View className="bg-green-100 p-2 rounded-full mr-3">
                <Ionicons name="heart" size={16} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">Helped feed Max</Text>
                <Text className="text-gray-600 text-sm">2 days ago • Community effort</Text>
              </View>
              <Text className="text-green-600 font-semibold">+8 pts</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Emergency Alert */}
      <View className="px-6 mt-8">
        <View className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text className="text-red-800 font-bold ml-2">Emergency Alert</Text>
          </View>
          <Text className="text-red-700 text-sm mb-3">
            Injured dog reported near Oak Street. Immediate help needed.
          </Text>
          <Pressable className="bg-red-600 rounded-lg py-2 px-4 self-start">
            <Text className="text-white font-semibold text-sm">Respond Now</Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom Navigation Placeholder */}
      <View className="h-20" />
    </ScrollView>
  );
};

export default HomePage; 