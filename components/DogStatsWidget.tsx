import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Animated } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface UserStats {
  totalWalks: number;
  totalDogsWalked: number;
  totalDistance: number; // in km
  averageRating: number;
  currentStreak: number;
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: 'walking' | 'social' | 'rescue' | 'special';
}

interface DogStatsWidgetProps {
  userStats: UserStats;
  recentAchievements: Achievement[];
  onViewFullStats?: () => void;
}

export default function DogStatsWidget({
  userStats,
  recentAchievements,
  onViewFullStats,
}: DogStatsWidgetProps) {
  const [animatedValues] = useState({
    walks: new Animated.Value(0),
    dogs: new Animated.Value(0),
    distance: new Animated.Value(0),
    rating: new Animated.Value(0),
  });

  useEffect(() => {
    // Animate stats on mount
    Animated.stagger(100, [
      Animated.timing(animatedValues.walks, {
        toValue: userStats.totalWalks,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.dogs, {
        toValue: userStats.totalDogsWalked,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.distance, {
        toValue: userStats.totalDistance,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.rating, {
        toValue: userStats.averageRating * 20, // Scale to 100 for animation
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [userStats]);

  const levelProgress =
    (userStats.totalPoints % userStats.nextLevelPoints) / userStats.nextLevelPoints;

  const StatCard = ({
    title,
    value,
    icon,
    color,
    animatedValue,
    suffix = '',
    decimal = 0,
  }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    animatedValue?: Animated.Value;
    suffix?: string;
    decimal?: number;
  }) => (
    <View className="mx-1 flex-1">
      <Card className="p-4">
        <View className="items-center">
          <View
            className="mb-2 h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}20` }}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>

          {animatedValue ? (
            <Animated.Text className="text-2xl font-bold text-gray-800">
              {animatedValue
                .interpolate({
                  inputRange: [0, value],
                  outputRange: [0, value],
                  extrapolate: 'clamp',
                })
                .__getValue()
                .toFixed(decimal)}
              {suffix}
            </Animated.Text>
          ) : (
            <Text className="text-2xl font-bold text-gray-800">
              {value.toFixed(decimal)}
              {suffix}
            </Text>
          )}

          <Text className="text-center text-sm text-gray-600">{title}</Text>
        </View>
      </Card>
    </View>
  );

  const AchievementBadge = ({ achievement }: { achievement: Achievement }) => (
    <Pressable
      className={`mr-3 h-20 w-16 items-center ${achievement.unlocked ? '' : 'opacity-50'}`}>
      <View
        className="mb-1 h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: achievement.unlocked ? achievement.color : '#e5e7eb',
        }}>
        <Ionicons
          name={achievement.icon as any}
          size={20}
          color={achievement.unlocked ? 'white' : '#9ca3af'}
        />
      </View>
      <Text className="text-center text-xs leading-3 text-gray-600">{achievement.title}</Text>
      {!achievement.unlocked && achievement.progress > 0 && (
        <View className="mt-1 h-1 w-12 rounded-full bg-gray-200">
          <View
            className="h-1 rounded-full"
            style={{
              width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
              backgroundColor: achievement.color,
            }}
          />
        </View>
      )}
    </Pressable>
  );

  return (
    <View className="bg-white">
      {/* Level Progress */}
      <Card className="mx-4 mb-4">
        <LinearGradient colors={['#667eea', '#764ba2']} style={{ borderRadius: 12, padding: 16 }}>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">Level {userStats.level}</Text>
            <Text className="text-sm text-white/80">
              {userStats.totalPoints} / {userStats.nextLevelPoints} XP
            </Text>
          </View>

          <ProgressBar
            progress={levelProgress}
            color="rgba(255,255,255,0.9)"
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.2)',
            }}
          />

          <View className="mt-3 flex-row justify-between">
            <View className="items-center">
              <Text className="font-semibold text-white">{userStats.currentStreak}</Text>
              <Text className="text-xs text-white/80">Day Streak</Text>
            </View>
            <View className="items-center">
              <Text className="font-semibold text-white">{userStats.totalPoints}</Text>
              <Text className="text-xs text-white/80">Total XP</Text>
            </View>
            <View className="items-center">
              <Text className="font-semibold text-white">
                {Math.ceil((userStats.nextLevelPoints - userStats.totalPoints) / 10)}
              </Text>
              <Text className="text-xs text-white/80">Walks to Level</Text>
            </View>
          </View>
        </LinearGradient>
      </Card>

      {/* Main Stats */}
      <View className="mb-4 px-4">
        <View className="flex-row">
          <StatCard
            title="Walks Completed"
            value={userStats.totalWalks}
            icon="walk"
            color="#10b981"
            animatedValue={animatedValues.walks}
          />
          <StatCard
            title="Dogs Walked"
            value={userStats.totalDogsWalked}
            icon="paw"
            color="#3b82f6"
            animatedValue={animatedValues.dogs}
          />
        </View>

        <View className="mt-2 flex-row">
          <StatCard
            title="Distance"
            value={userStats.totalDistance}
            icon="map"
            color="#f59e0b"
            animatedValue={animatedValues.distance}
            suffix=" km"
            decimal={1}
          />
          <StatCard
            title="Avg Rating"
            value={userStats.averageRating}
            icon="star"
            color="#8b5cf6"
            suffix="/5"
            decimal={1}
          />
        </View>
      </View>

      {/* Recent Achievements */}
      <View className="mb-4 px-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-gray-800">Recent Achievements</Text>
          <Pressable onPress={onViewFullStats}>
            <Text className="font-medium text-blue-600">View All</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentAchievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View className="px-4 pb-4">
        <Text className="mb-3 text-lg font-semibold text-gray-800">Quick Actions</Text>
        <View className="flex-row">
          <Pressable className="mr-2 flex-1 flex-row items-center rounded-xl bg-blue-50 p-4">
            <Ionicons name="map" size={20} color="#3b82f6" />
            <Text className="ml-2 font-medium text-blue-700">Find Dogs</Text>
          </Pressable>

          <Pressable className="ml-2 flex-1 flex-row items-center rounded-xl bg-green-50 p-4">
            <Ionicons name="add-circle" size={20} color="#10b981" />
            <Text className="ml-2 font-medium text-green-700">Add Walk</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Sample data for testing
export const sampleUserStats: UserStats = {
  totalWalks: 47,
  totalDogsWalked: 23,
  totalDistance: 89.3,
  averageRating: 4.7,
  currentStreak: 7,
  totalPoints: 2340,
  level: 5,
  nextLevelPoints: 2500,
};

export const sampleAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Walk',
    description: 'Complete your first dog walk',
    icon: 'walk',
    color: '#10b981',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    category: 'walking',
  },
  {
    id: '2',
    title: 'Dog Lover',
    description: 'Walk 10 different dogs',
    icon: 'heart',
    color: '#ef4444',
    progress: 10,
    maxProgress: 10,
    unlocked: true,
    category: 'social',
  },
  {
    id: '3',
    title: 'Marathon',
    description: 'Walk 100km total distance',
    icon: 'medal',
    color: '#f59e0b',
    progress: 89,
    maxProgress: 100,
    unlocked: false,
    category: 'walking',
  },
  {
    id: '4',
    title: 'Rescue Hero',
    description: 'Help 5 stray dogs',
    icon: 'shield',
    color: '#8b5cf6',
    progress: 3,
    maxProgress: 5,
    unlocked: false,
    category: 'rescue',
  },
  {
    id: '5',
    title: 'Perfect Rating',
    description: 'Maintain 5-star rating for 10 walks',
    icon: 'star',
    color: '#fbbf24',
    progress: 7,
    maxProgress: 10,
    unlocked: false,
    category: 'social',
  },
];
