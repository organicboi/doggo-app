import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

const ProfileDemo: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  // Mock data for demonstration
  const mockProfile = {
    id: '123',
    full_name: 'Sarah Johnson',
    display_name: 'Sarah',
    email: 'sarah@example.com',
    phone: '+1 (555) 123-4567',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b9a9e3e0?w=200&h=200&fit=crop&crop=face',
    city: 'San Francisco',
    state: 'CA',
    total_walks: 47,
    total_dogs_helped: 23,
    rating_average: 4.8,
    rating_count: 34,
    points: 1250,
    is_walker: true,
    is_owner: true,
    subscription_tier: 'premium',
    background_check_status: 'approved',
    notifications_enabled: true,
    email_notifications: true,
    sms_notifications: false,
    preferred_radius: 5,
    created_at: '2024-01-15',
  };

  const mockAchievements = [
    {
      id: '1',
      name: 'First Walk',
      description: 'Complete your first dog walk',
      badge_color: 'bronze',
      is_completed: true,
      progress: 1,
      requirement_value: 1,
    },
    {
      id: '2',
      name: 'Walk Enthusiast',
      description: 'Complete 10 dog walks',
      badge_color: 'silver',
      is_completed: true,
      progress: 47,
      requirement_value: 10,
    },
    {
      id: '3',
      name: 'Community Helper',
      description: 'Help 5 stray dogs',
      badge_color: 'gold',
      is_completed: false,
      progress: 23,
      requirement_value: 25,
    },
  ];

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'gold': return '#fbbf24';
      case 'silver': return '#94a3b8';
      case 'bronze': return '#f97316';
      case 'platinum': return '#e879f9';
      default: return '#6b7280';
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'premium': return ['#8b5cf6', '#7c3aed'];
      case 'pro': return ['#f59e0b', '#d97706'];
      default: return ['#6b7280', '#4b5563'];
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <View style={{ flex: 1 }}>
            {/* Header Section */}
            <LinearGradient
              colors={['#ec4899', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingTop: 20, paddingBottom: 40 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 30 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: 'white' }}>
                  Profile
                </Text>
                <Pressable
                  style={({ pressed }) => ({
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: 12,
                    borderRadius: 12,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="settings-outline" size={24} color="white" />
                </Pressable>
              </View>

              {/* Profile Header */}
              <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
                <View style={{ position: 'relative', marginBottom: 16 }}>
                  <Image
                    source={{ uri: mockProfile.avatar_url }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      borderWidth: 4,
                      borderColor: 'white',
                    }}
                  />
                  <View style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: 20,
                    padding: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}>
                    <Ionicons name="camera" size={20} color="#ec4899" />
                  </View>
                </View>

                <Text style={{ fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 4 }}>
                  {mockProfile.display_name}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginLeft: 4 }}>
                    {mockProfile.rating_average} ({mockProfile.rating_count} reviews)
                  </Text>
                </View>

                <LinearGradient
                  colors={getSubscriptionColor(mockProfile.subscription_tier)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 20,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: 'white', textTransform: 'uppercase' }}>
                    {mockProfile.subscription_tier} Member
                  </Text>
                </LinearGradient>

                <Pressable
                  style={({ pressed }) => ({
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 24,
                    paddingVertical: 10,
                    borderRadius: 25,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                    Edit Profile
                  </Text>
                </Pressable>
              </View>
            </LinearGradient>

            {/* Stats Section */}
            <View style={{ 
              flexDirection: 'row', 
              marginTop: -30, 
              marginHorizontal: 20, 
              backgroundColor: 'white', 
              borderRadius: 16, 
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ backgroundColor: '#dbeafe', padding: 12, borderRadius: 12, marginBottom: 8 }}>
                  <FontAwesome5 name="walking" size={20} color="#3b82f6" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#1f2937' }}>
                  {mockProfile.total_walks}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                  Walks
                </Text>
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ backgroundColor: '#d1fae5', padding: 12, borderRadius: 12, marginBottom: 8 }}>
                  <FontAwesome5 name="heart" size={20} color="#10b981" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#1f2937' }}>
                  {mockProfile.total_dogs_helped}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                  Dogs Helped
                </Text>
              </View>

              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 12, marginBottom: 8 }}>
                  <FontAwesome5 name="trophy" size={20} color="#f59e0b" />
                </View>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#1f2937' }}>
                  {mockProfile.points}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                  Points
                </Text>
              </View>
            </View>

            {/* Roles Section */}
            <View style={{ margin: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
                Your Roles
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {mockProfile.is_walker && (
                  <View style={{
                    backgroundColor: '#dbeafe',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <FontAwesome5 name="walking" size={14} color="#3b82f6" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#3b82f6', marginLeft: 6 }}>
                      Walker
                    </Text>
                  </View>
                )}
                {mockProfile.is_owner && (
                  <View style={{
                    backgroundColor: '#d1fae5',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <FontAwesome5 name="dog" size={14} color="#10b981" />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#10b981', marginLeft: 6 }}>
                      Owner
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );

      case 'achievements':
        return (
          <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 20, textAlign: 'center' }}>
              🏆 Achievements
            </Text>
            <View style={{ gap: 16 }}>
              {mockAchievements.map((achievement) => (
                <View
                  key={achievement.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <View style={{
                    backgroundColor: achievement.is_completed ? getBadgeColor(achievement.badge_color) : '#f3f4f6',
                    padding: 16,
                    borderRadius: 16,
                    marginRight: 16,
                  }}>
                    <FontAwesome5 
                      name="trophy" 
                      size={24} 
                      color={achievement.is_completed ? 'white' : '#9ca3af'} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 4 }}>
                      {achievement.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                      {achievement.description}
                    </Text>
                    <View style={{ backgroundColor: '#f3f4f6', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{
                        backgroundColor: getBadgeColor(achievement.badge_color),
                        height: '100%',
                        width: `${Math.min((achievement.progress / achievement.requirement_value) * 100, 100)}%`,
                      }} />
                    </View>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                      {achievement.progress}/{achievement.requirement_value}
                    </Text>
                  </View>
                  {achievement.is_completed && (
                    <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                  )}
                </View>
              ))}
            </View>
          </View>
        );

      case 'settings':
        return (
          <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 20, textAlign: 'center' }}>
              ⚙️ Settings
            </Text>
            
            <View style={{ gap: 24 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
                  Notifications
                </Text>
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 20,
                  gap: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                        Push Notifications
                      </Text>
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>
                        Receive notifications about walks and emergencies
                      </Text>
                    </View>
                    <View style={{
                      width: 50,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: mockProfile.notifications_enabled ? '#ec4899' : '#d1d5db',
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}>
                      <View style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: 'white',
                        alignSelf: mockProfile.notifications_enabled ? 'flex-end' : 'flex-start',
                      }} />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                        Email Notifications
                      </Text>
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>
                        Receive email updates about your account
                      </Text>
                    </View>
                    <View style={{
                      width: 50,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: mockProfile.email_notifications ? '#ec4899' : '#d1d5db',
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}>
                      <View style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: 'white',
                        alignSelf: mockProfile.email_notifications ? 'flex-end' : 'flex-start',
                      }} />
                    </View>
                  </View>
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
                  Account Info
                </Text>
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 20,
                  gap: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Member Since</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                      {new Date(mockProfile.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Background Check</Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: mockProfile.background_check_status === 'approved' ? '#10b981' : '#f59e0b'
                    }}>
                      ✅ Approved
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Search Radius</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                      {mockProfile.preferred_radius} km
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="light-content" backgroundColor="#ec4899" />
      
      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      }}>
        {[
          { key: 'overview', label: 'Overview', icon: 'person' },
          { key: 'achievements', label: 'Achievements', icon: 'trophy' },
          { key: 'settings', label: 'Settings', icon: 'settings' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveSection(tab.key)}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={activeSection === tab.key ? '#ec4899' : '#9ca3af'}
            />
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: activeSection === tab.key ? '#ec4899' : '#9ca3af',
              marginTop: 4,
            }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {renderSection()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileDemo; 