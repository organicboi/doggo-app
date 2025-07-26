import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { ImageService } from '../lib/imageService';

const { width: screenWidth } = Dimensions.get('window');

interface UserProfile {
  id: string;
  full_name: string;
  display_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  cover_image_url?: string;
  date_of_birth?: string;
  gender?: string;
  city?: string;
  state?: string;
  total_walks: number;
  total_dogs_helped: number;
  rating_average: number;
  rating_count: number;
  points: number;
  is_walker: boolean;
  is_owner: boolean;
  subscription_tier: string;
  background_check_status: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  preferred_radius: number;
  created_at: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  badge_color: string;
  is_completed: boolean;
  progress: number;
  requirement_value: number;
}

interface PremiumProfileScreenProps {
  onSignOut: () => void;
  userEmail?: string;
}

const PremiumProfileScreen: React.FC<PremiumProfileScreenProps> = ({
  onSignOut,
  userEmail,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    display_name: '',
    phone: '',
    city: '',
    state: '',
    date_of_birth: '',
  });

  useEffect(() => {
    loadProfileData();
    loadAchievements();
  }, []);

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
        return;
      }

      setProfile(data);
      setEditForm({
        full_name: data.full_name || '',
        display_name: data.display_name || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
        date_of_birth: data.date_of_birth || '',
      });
    } catch (error) {
      console.error('Error in loadProfileData:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (
            id,
            name,
            description,
            icon_url,
            badge_color,
            requirement_value
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading achievements:', error);
        return;
      }

      const formattedAchievements = data?.map((item: any) => ({
        id: item.achievements.id,
        name: item.achievements.name,
        description: item.achievements.description,
        icon_url: item.achievements.icon_url,
        badge_color: item.achievements.badge_color,
        is_completed: item.is_completed,
        progress: item.progress,
        requirement_value: item.achievements.requirement_value,
      })) || [];

      setAchievements(formattedAchievements);
    } catch (error) {
      console.error('Error in loadAchievements:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfileData(), loadAchievements()]);
    setRefreshing(false);
  };

  const handleImagePicker = async (imageType: 'profile' | 'cover' = 'profile') => {
    try {
      const hasPermissions = await ImageService.requestPermissions();
      if (!hasPermissions) {
        Alert.alert('Permission needed', 'Please allow access to your photos and camera');
        return;
      }

      // Show action sheet for image source selection
      Alert.alert(
        'Select Image Source',
        'Choose how you want to add your image',
        [
          {
            text: 'Camera',
            onPress: () => handleImageSource('camera', imageType),
          },
          {
            text: 'Gallery',
            onPress: () => handleImageSource('gallery', imageType),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleImagePicker:', error);
      Alert.alert('Error', 'Failed to access image picker');
    }
  };

  const handleImageSource = async (source: 'camera' | 'gallery', imageType: 'profile' | 'cover') => {
    try {
      setImageUploadLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const aspect: [number, number] = imageType === 'profile' ? [1, 1] : [2, 1];
      
      const result = source === 'camera'
        ? await ImageService.takePhoto({ aspect, quality: 0.8 })
        : await ImageService.pickImageFromGallery({ aspect, quality: 0.8 });

      if (!result.canceled && result.assets[0] && profile) {
        const uploadResult = await ImageService.uploadAndUpdateProfileImage(
          profile.id,
          result.assets[0].uri,
          imageType
        );

        if (uploadResult.success) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert('Success', `${imageType === 'profile' ? 'Profile' : 'Cover'} photo updated!`);
          // Reload profile data to get updated image URLs
          await loadProfileData();
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to update photo');
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          display_name: editForm.display_name,
          phone: editForm.phone,
          city: editForm.city,
          state: editForm.state,
          date_of_birth: editForm.date_of_birth || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Success', 'Profile updated successfully!');
      setEditModalVisible(false);
      loadProfileData();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleToggleNotification = async (type: 'notifications_enabled' | 'email_notifications' | 'sms_notifications', value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ [type]: value })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Failed to update settings');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      loadProfileData();
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#6b7280' }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#ef4444' }}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section with Cover Image */}
        <View style={{ position: 'relative', height: 280 }}>
          {/* Cover Image */}
          <Image
            source={{
              uri: profile.cover_image_url || ImageService.getDefaultCoverImage()
            }}
            style={{
              width: '100%',
              height: 200,
              position: 'absolute',
              top: 0,
            }}
            resizeMode="cover"
          />
          
          {/* Cover Image Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(236,72,153,0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 200,
            }}
          />
          
          {/* Header Controls */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            paddingHorizontal: 20, 
            paddingTop: 20,
            position: 'relative',
            zIndex: 2,
          }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: 'white' }}>
              Profile
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => handleImagePicker('cover')}
                disabled={imageUploadLoading}
                style={({ pressed }) => ({
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: 12,
                  borderRadius: 12,
                  opacity: pressed || imageUploadLoading ? 0.7 : 1,
                })}
              >
                <Ionicons name="image-outline" size={24} color="white" />
              </Pressable>
              <Pressable
                onPress={() => setSettingsModalVisible(true)}
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
          </View>

          {/* Profile Header */}
          <View style={{ 
            alignItems: 'center', 
            paddingHorizontal: 20,
            position: 'relative',
            zIndex: 2,
            marginTop: 80,
          }}>
            <Pressable
              onPress={() => handleImagePicker('profile')}
              disabled={imageUploadLoading}
              style={({ pressed }) => ({
                opacity: pressed || imageUploadLoading ? 0.8 : 1,
                marginBottom: 16,
              })}
            >
              <View style={{ position: 'relative' }}>
                <Image
                  source={{
                    uri: profile.avatar_url || ImageService.getDefaultProfileImage()
                  }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 4,
                    borderColor: 'white',
                  }}
                />
                {imageUploadLoading ? (
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                      Uploading...
                    </Text>
                  </View>
                ) : (
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
                )}
              </View>
            </Pressable>

            <Text style={{ fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 4 }}>
              {profile.display_name || profile.full_name}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginLeft: 4 }}>
                {profile.rating_average.toFixed(1)} ({profile.rating_count} reviews)
              </Text>
            </View>

            <LinearGradient
              colors={getSubscriptionColor(profile.subscription_tier)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: 'white', textTransform: 'uppercase' }}>
                {profile.subscription_tier} Member
              </Text>
            </LinearGradient>

            <Pressable
              onPress={() => setEditModalVisible(true)}
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
        </View>

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
              {profile.total_walks}
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
              {profile.total_dogs_helped}
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
              {profile.points}
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
            {profile.is_walker && (
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
            {profile.is_owner && (
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

        {/* Achievements Section */}
        <View style={{ margin: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
            Achievements
          </Text>
          {achievements.length > 0 ? (
            <View style={{ gap: 12 }}>
              {achievements.slice(0, 3).map((achievement) => (
                <View
                  key={achievement.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View style={{
                    backgroundColor: achievement.is_completed ? getBadgeColor(achievement.badge_color) : '#f3f4f6',
                    padding: 12,
                    borderRadius: 12,
                    marginRight: 16,
                  }}>
                    <FontAwesome5 
                      name="trophy" 
                      size={20} 
                      color={achievement.is_completed ? 'white' : '#9ca3af'} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 }}>
                      {achievement.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                      {achievement.description}
                    </Text>
                    <View style={{ backgroundColor: '#f3f4f6', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{
                        backgroundColor: getBadgeColor(achievement.badge_color),
                        height: '100%',
                        width: `${Math.min((achievement.progress / achievement.requirement_value) * 100, 100)}%`,
                      }} />
                    </View>
                  </View>
                  {achievement.is_completed && (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}>
              <FontAwesome5 name="trophy" size={32} color="#d1d5db" />
              <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 12, textAlign: 'center' }}>
                Start walking dogs to earn achievements!
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={{ margin: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
            Quick Actions
          </Text>
          <View style={{ gap: 12 }}>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ backgroundColor: '#dbeafe', padding: 12, borderRadius: 12, marginRight: 16 }}>
                <FontAwesome5 name="dog" size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                  My Dogs
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  Manage your dog profiles
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>

            <Pressable
              style={({ pressed }) => ({
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ backgroundColor: '#d1fae5', padding: 12, borderRadius: 12, marginRight: 16 }}>
                <FontAwesome5 name="history" size={20} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
                  Walk History
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  View your past walks
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>

            <Pressable
              onPress={onSignOut}
              style={({ pressed }) => ({
                backgroundColor: 'white',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, marginRight: 16 }}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#ef4444' }}>
                  Sign Out
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>
                  Sign out of your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Pressable onPress={() => setEditModalVisible(false)}>
              <Text style={{ fontSize: 16, color: '#6b7280' }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937' }}>
              Edit Profile
            </Text>
            <Pressable onPress={handleSaveProfile}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#ec4899' }}>Save</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={{ gap: 20 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Full Name
                </Text>
                <TextInput
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                  placeholder="Enter your full name"
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Display Name
                </Text>
                <TextInput
                  value={editForm.display_name}
                  onChangeText={(text) => setEditForm({ ...editForm, display_name: text })}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                  placeholder="How others see you"
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Phone Number
                </Text>
                <TextInput
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                  placeholder="+1 (555) 123-4567"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    City
                  </Text>
                  <TextInput
                    value={editForm.city}
                    onChangeText={(text) => setEditForm({ ...editForm, city: text })}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                    }}
                    placeholder="Your city"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    State
                  </Text>
                  <TextInput
                    value={editForm.state}
                    onChangeText={(text) => setEditForm({ ...editForm, state: text })}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                    }}
                    placeholder="State"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937' }}>
              Settings
            </Text>
            <Pressable onPress={() => setSettingsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={{ gap: 24 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
                  Notifications
                </Text>
                <View style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                        Push Notifications
                      </Text>
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>
                        Receive notifications about walks and emergencies
                      </Text>
                    </View>
                    <Switch
                      value={profile.notifications_enabled}
                      onValueChange={(value) => handleToggleNotification('notifications_enabled', value)}
                      trackColor={{ false: '#d1d5db', true: '#ec4899' }}
                      thumbColor="white"
                    />
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
                    <Switch
                      value={profile.email_notifications}
                      onValueChange={(value) => handleToggleNotification('email_notifications', value)}
                      trackColor={{ false: '#d1d5db', true: '#ec4899' }}
                      thumbColor="white"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>
                        SMS Notifications
                      </Text>
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>
                        Receive text messages for urgent updates
                      </Text>
                    </View>
                    <Switch
                      value={profile.sms_notifications}
                      onValueChange={(value) => handleToggleNotification('sms_notifications', value)}
                      trackColor={{ false: '#d1d5db', true: '#ec4899' }}
                      thumbColor="white"
                    />
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
                  padding: 16,
                  gap: 12,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Member Since</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Background Check</Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: profile.background_check_status === 'approved' ? '#10b981' : '#f59e0b'
                    }}>
                      {profile.background_check_status.charAt(0).toUpperCase() + profile.background_check_status.slice(1)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Search Radius</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                      {profile.preferred_radius} km
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default PremiumProfileScreen; 