import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { ImageService } from '../lib/imageService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive breakpoints
const isTablet = SCREEN_WIDTH >= 768;
const isSmallScreen = SCREEN_WIDTH < 375;

const tabOverlap = isSmallScreen ? -50 : isTablet ? -90 : -70;

// Dynamic sizing functions
const getResponsiveSize = (base: number, factor: number = 1) => {
  const scale = SCREEN_WIDTH / 375; // Base iPhone size
  return Math.round(base * scale * factor);
};

const getResponsivePadding = () => {
  if (isTablet) return 32;
  if (isSmallScreen) return 16;
  return 20;
};

const getProfileImageSize = () => {
  if (isTablet) return 160;
  if (isSmallScreen) return 120;
  return 140;
};

const getHeaderHeight = () => {
  if (isTablet) return 360;
  if (isSmallScreen) return 280;
  return 320;
};

const getCoverImageHeight = () => {
  if (isTablet) return 280;
  if (isSmallScreen) return 200;
  return 240;
};

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

interface TabConfig {
  key: string;
  title: string;
  icon: string;
  color: string;
  gradient: string[];
}

interface EnhancedProfileScreenProps {
  onSignOut: () => void;
  userEmail: string;
}

const tabs: TabConfig[] = [
  {
    key: 'overview',
    title: 'Overview',
    icon: 'person',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#1d4ed8'],
  },
  {
    key: 'achievements',
    title: 'Achievements',
    icon: 'trophy',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
  },
  {
    key: 'settings',
    title: 'Settings',
    icon: 'settings',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
];

const EnhancedProfileScreen = ({ onSignOut, userEmail }: EnhancedProfileScreenProps) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    display_name: '',
    phone: '',
    city: '',
    state: '',
    date_of_birth: '',
  });

  // Animation values
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = {
        scale: new Animated.Value(activeTab === tab.key ? 1 : 0.9),
        opacity: new Animated.Value(activeTab === tab.key ? 1 : 0.6),
      };
      return acc;
    }, {} as Record<string, any>)
  ).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  // Calculate dimensions for tab indicator
  const tabPadding = getResponsivePadding();
  const tabWidth = (SCREEN_WIDTH - (2 * tabPadding)) / tabs.length;

  useEffect(() => {
    loadProfileData();
    loadAchievements();
  }, []);

  useEffect(() => {
    animateTabChange();
  }, [activeTab]);

  const animateTabChange = () => {
    const tabIndex = tabs.findIndex(tab => tab.key === activeTab);
    
    // Animate content fade out and in
    Animated.sequence([
      Animated.timing(contentFadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate tab indicator
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex * tabWidth,
      useNativeDriver: true,
      tension: 300,
      friction: 26,
    }).start();

    // Animate individual tabs
    tabs.forEach((tab) => {
      const isActive = tab.key === activeTab;
      const animations = tabAnimations[tab.key];

      Animated.parallel([
        Animated.spring(animations.scale, {
          toValue: isActive ? 1 : 0.9,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(animations.opacity, {
          toValue: isActive ? 1 : 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

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

  const handleTabPress = async (tabKey: string) => {
    if (tabKey !== activeTab) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(tabKey);
    }
  };

  const handleImagePicker = async (imageType: 'profile' | 'cover' = 'profile') => {
    try {
      const hasPermissions = await ImageService.requestPermissions();
      if (!hasPermissions) {
        Alert.alert('Permission needed', 'Please allow access to your photos and camera');
        return;
      }

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewContent();
      case 'achievements':
        return renderAchievementsContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderOverviewContent();
    }
  };

  const renderOverviewContent = () => (
    <Animated.View style={{ opacity: contentFadeAnim, paddingHorizontal: 16 }}>
      {/* Roles Section */}
      <View style={{ 
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: '#1f2937', 
          marginBottom: 16,
        }}>
          Your Roles
        </Text>
        <View style={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {profile?.is_walker && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#dbeafe',
                borderWidth: 1,
                borderColor: '#bfdbfe',
              }}
            >
              <FontAwesome5 name="walking" size={14} color="#3b82f6" />
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#3b82f6', 
                marginLeft: 6,
              }}>
                Walker
              </Text>
            </View>
          )}
          {profile?.is_owner && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#d1fae5',
                borderWidth: 1,
                borderColor: '#a7f3d0',
              }}
            >
              <FontAwesome5 name="dog" size={14} color="#10b981" />
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#10b981', 
                marginLeft: 6,
              }}>
                Owner
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ 
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: '#1f2937', 
          marginBottom: 16,
        }}>
          Quick Actions
        </Text>
        <View style={{ gap: 12 }}>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#f9fafb' : 'white',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#f3f4f6',
            })}
          >
            <View
              style={{ 
                backgroundColor: '#dbeafe',
                padding: 12, 
                borderRadius: 12, 
                marginRight: 12,
              }}
            >
              <FontAwesome5 name="dog" size={18} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: 2,
              }}>
                My Dogs
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: '#6b7280',
              }}>
                Manage your dog profiles
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#f9fafb' : 'white',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#f3f4f6',
            })}
          >
            <View
              style={{ 
                backgroundColor: '#d1fae5',
                padding: 12, 
                borderRadius: 12, 
                marginRight: 12,
              }}
            >
              <FontAwesome5 name="history" size={18} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: 2,
              }}>
                Walk History
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: '#6b7280',
              }}>
                View your past walks
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable
            onPress={onSignOut}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#fef2f2' : 'white',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#fee2e2',
            })}
          >
            <View
              style={{ 
                backgroundColor: '#fee2e2',
                padding: 12, 
                borderRadius: 12, 
                marginRight: 12,
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#ef4444', 
                marginBottom: 2,
              }}>
                Sign Out
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: '#6b7280',
              }}>
                Sign out of your account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );

  const renderAchievementsContent = () => (
    <Animated.View style={{ opacity: contentFadeAnim, paddingHorizontal: 16 }}>
      <View style={{ 
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 20, textAlign: 'center' }}>
          🏆 Your Achievements
        </Text>
        {achievements.length > 0 ? (
          <View style={{ gap: 16 }}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: getBadgeColor(achievement.badge_color),
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <FontAwesome5 name="medal" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 2 }}>
                      {achievement.name}
                    </Text>
                    {achievement.is_completed && (
                      <View style={{ 
                        backgroundColor: '#d1fae5', 
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#10b981' }}>
                          Completed
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                    {achievement.description}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                      <View 
                        style={{ 
                          height: '100%', 
                          width: `${Math.min(100, (achievement.progress / achievement.requirement_value) * 100)}%`,
                          backgroundColor: getBadgeColor(achievement.badge_color),
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '600', color: '#6b7280' }}>
                      {achievement.progress}/{achievement.requirement_value}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <FontAwesome5 name="trophy" size={40} color="#d1d5db" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#6b7280', marginBottom: 8 }}>
              No Achievements Yet
            </Text>
            <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center' }}>
              Start walking dogs to earn your first achievement!
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderSettingsContent = () => (
    <Animated.View style={{ opacity: contentFadeAnim, paddingHorizontal: 16 }}>
      {/* Notifications Section */}
      <View style={{ 
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
          Notifications
        </Text>
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                Push Notifications
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                Receive notifications about walks and emergencies
              </Text>
            </View>
            <Switch
              value={profile?.notifications_enabled || false}
              onValueChange={(value) => handleToggleNotification('notifications_enabled', value)}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor="white"
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                Email Notifications
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                Receive email updates about your account
              </Text>
            </View>
            <Switch
              value={profile?.email_notifications || false}
              onValueChange={(value) => handleToggleNotification('email_notifications', value)}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor="white"
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 }}>
                SMS Notifications
              </Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                Receive text messages for urgent updates
              </Text>
            </View>
            <Switch
              value={profile?.sms_notifications || false}
              onValueChange={(value) => handleToggleNotification('sms_notifications', value)}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor="white"
              style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
            />
          </View>
        </View>
      </View>

      {/* Account Info Section */}
      <View style={{ 
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 }}>
          Account Info
        </Text>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, color: '#6b7280', fontWeight: '500' }}>Member Since</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, color: '#6b7280', fontWeight: '500' }}>Background Check</Text>
            <View style={{
              backgroundColor: profile?.background_check_status === 'approved' ? '#d1fae5' : '#fef3c7',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: profile?.background_check_status === 'approved' ? '#10b981' : '#f59e0b'
              }}>
                {profile?.background_check_status?.charAt(0).toUpperCase() + profile?.background_check_status?.slice(1) || 'Pending'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, color: '#6b7280', fontWeight: '500' }}>Search Radius</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>
              {profile?.preferred_radius || 5} km
            </Text>
          </View>
        </View>
      </View>

      {/* Edit Profile Button */}
      <Pressable
        onPress={() => setEditModalVisible(true)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          marginBottom: 16,
        })}
      >
        <LinearGradient
          colors={['#3b82f6', '#1d4ed8']}
          style={{
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>
            Edit Profile
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={{ padding: 24, borderRadius: 24, marginBottom: 16 }}
          >
            <FontAwesome5 name="user" size={32} color="white" />
          </LinearGradient>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#6b7280' }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={{ padding: 24, borderRadius: 24, marginBottom: 16 }}
          >
            <FontAwesome5 name="exclamation-triangle" size={32} color="white" />
          </LinearGradient>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#ef4444' }}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      {/* Modern Header with Cover Image */}
      <View style={{ 
        position: 'relative', 
        height: 200,
        backgroundColor: '#3b82f6',
      }}>
        {/* Cover Image */}
        <Image
          source={{
            uri: profile.cover_image_url || ImageService.getDefaultCoverImage()
          }}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
          resizeMode="cover"
        />
        
        {/* Cover Image Overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(59,130,246,0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        
        {/* Header Controls */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingHorizontal: 16, 
          paddingTop: insets.top + 10,
          position: 'relative',
          zIndex: 2,
        }}>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '800', 
            color: 'white',
          }}>
            Profile
          </Text>
          <Pressable
            onPress={() => handleImagePicker('cover')}
            style={({ pressed }: {pressed: boolean}) => ({
              backgroundColor: 'rgba(255,255,255,0.3)',
              padding: 10,
              borderRadius: 12,
              opacity: pressed || imageUploadLoading ? 0.7 : 1,
            })}
          >
            <Ionicons name="image-outline" size={22} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Profile Info Card */}
      <View style={{
        backgroundColor: 'white',
        marginTop: -50,
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}>
        {/* Profile Image */}
        <Pressable
          onPress={() => handleImagePicker('profile')}
          disabled={imageUploadLoading}
          style={({ pressed }: {pressed: boolean}) => ({
            marginTop: -50,
            opacity: pressed || imageUploadLoading ? 0.8 : 1,
          })}
        >
          <View style={{ position: 'relative' }}>
            <Image
              source={{
                uri: profile.avatar_url || ImageService.getDefaultProfileImage()
              }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 4,
                borderColor: 'white',
                backgroundColor: 'white',
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
                borderRadius: 50,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 12, 
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  Uploading...
                </Text>
              </View>
            ) : (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  borderRadius: 16,
                  backgroundColor: '#3b82f6',
                  padding: 8,
                  borderWidth: 2,
                  borderColor: 'white',
                }}
              >
                <Ionicons name="camera" size={16} color="white" />
              </View>
            )}
          </View>
        </Pressable>

        {/* User Info */}
        <Text style={{ 
          fontSize: 22, 
          fontWeight: '700', 
          color: '#1f2937', 
          marginTop: 12, 
          textAlign: 'center',
        }}>
          {profile.display_name || profile.full_name}
        </Text>
        
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: 4,
          justifyContent: 'center',
        }}>
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={{ 
            fontSize: 14, 
            color: '#6b7280', 
            marginLeft: 4, 
            fontWeight: '500',
          }}>
            {profile.rating_average.toFixed(1)} ({profile.rating_count} reviews)
          </Text>
        </View>

        {/* Subscription Badge */}
        <View
          style={{
            backgroundColor: '#f3f4f6',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 16,
            marginTop: 8,
          }}
        >
          <Text style={{ 
            fontSize: 12, 
            fontWeight: '600', 
            color: '#4b5563', 
            textTransform: 'uppercase',
          }}>
            {profile.subscription_tier} Member
          </Text>
        </View>

        {/* User Stats */}
        <View style={{ 
          flexDirection: 'row', 
          marginTop: 16,
          width: '100%',
          justifyContent: 'space-around',
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '700', 
              color: '#3b82f6', 
            }}>
              {profile?.total_walks || 0}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              fontWeight: '500',
            }}>
              Walks
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '700', 
              color: '#10b981', 
            }}>
              {profile?.total_dogs_helped || 0}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              fontWeight: '500',
            }}>
              Dogs Helped
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '700', 
              color: '#f59e0b', 
            }}>
              {profile?.points || 0}
            </Text>
            <Text style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              fontWeight: '500',
            }}>
              Points
            </Text>
          </View>
        </View>
      </View>

      {/* Modern Tab Navigation */}
      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Tab Items */}
        <View style={{ 
          flexDirection: 'row', 
          minHeight: 56,
          position: 'relative',
        }}>
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key;
            
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleTabPress(tab.key)}
                style={{ 
                  flex: 1, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  paddingVertical: 16,
                }}
                android_ripple={{
                  color: `${tab.color}20`,
                  borderless: false,
                }}
              >
                <Animated.View style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: tabAnimations[tab.key].scale }],
                  opacity: tabAnimations[tab.key].opacity,
                }}>
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={isActive ? tab.color : '#9ca3af'}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? tab.color : '#9ca3af',
                      marginTop: 4,
                    }}
                  >
                    {tab.title}
                  </Text>
                </Animated.View>
              </Pressable>
            );
          })}
          
          {/* Animated Indicator */}
          <Animated.View 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: tabWidth,
              height: 3,
              backgroundColor: tabs.find(tab => tab.key === activeTab)?.color || '#3b82f6',
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              transform: [{ translateX: tabIndicatorAnim }]
            }}
          />
        </View>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={{ flex: 1, marginTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
        <View style={{ height: insets.bottom + (isTablet ? 140 : isSmallScreen ? 100 : 120) }} />
      </ScrollView>

      {/* Edit Profile Modal - Keep existing implementation */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: 24, 
            borderBottomWidth: 1, 
            borderBottomColor: '#e5e7eb',
            backgroundColor: 'white',
          }}>
            <Pressable onPress={() => setEditModalVisible(false)}>
              <Text style={{ fontSize: 16, color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1f2937' }}>
              Edit Profile
            </Text>
            <Pressable onPress={handleSaveProfile}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#3b82f6' }}>Save</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1, padding: 24 }}>
            <View style={{ gap: 24 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Full Name
                </Text>
                <TextInput
                  value={editForm.full_name}
                  onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
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
                    borderRadius: 16,
                    padding: 20,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
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
                    borderRadius: 16,
                    padding: 20,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  placeholder="+1 (555) 123-4567"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    City
                  </Text>
                  <TextInput
                    value={editForm.city}
                    onChangeText={(text) => setEditForm({ ...editForm, city: text })}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 16,
                      padding: 20,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
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
                      borderRadius: 16,
                      padding: 20,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                    placeholder="State"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default EnhancedProfileScreen; 