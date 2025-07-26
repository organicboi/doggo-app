import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions, Platform, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { ImageService } from '../lib/imageService';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnhancedBottomTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

interface TabConfig {
  key: string;
  title: string;
  icon: string;
  color: string;
  gradient: [string, string];
  badge?: number;
  isProfile?: boolean;
}

const tabs: TabConfig[] = [
  { key: 'home', title: 'Home', icon: 'home', color: '#1f2937', gradient: ['#1f2937', '#374151'] },
  { key: 'map', title: 'Map', icon: 'map', color: '#10b981', gradient: ['#10b981', '#059669'] },
  { key: 'camera', title: 'Share', icon: 'camera-alt', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'] },
  { key: 'community', title: 'Community', icon: 'groups', color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] },
  { key: 'profile', title: 'Profile', icon: 'person', color: '#ec4899', gradient: ['#ec4899', '#db2777'], isProfile: true },
];

export default function EnhancedBottomTabs({ activeTab, onTabPress }: EnhancedBottomTabsProps) {
  const insets = useSafeAreaInsets();
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabAnims = useRef(tabs.reduce((acc, t) => { 
    acc[t.key] = { 
      scale: new Animated.Value(1), 
      opacity: new Animated.Value(1),
      imageScale: new Animated.Value(1)
    }; 
    return acc; 
  }, {} as any)).current;
  
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfileImage();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserProfileImage();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const index = tabs.findIndex(t => t.key === activeTab);
    
    // Animate indicator
    Animated.spring(indicatorAnim, { 
      toValue: index * (SCREEN_WIDTH / 5), 
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    // Animate tabs
    tabs.forEach(t => {
      const isActive = t.key === activeTab;
      Animated.parallel([
        Animated.spring(tabAnims[t.key].scale, { 
          toValue: isActive ? 1.1 : 0.95, 
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(tabAnims[t.key].opacity, { 
          toValue: isActive ? 1 : 0.6, 
          duration: 200, 
          useNativeDriver: true 
        }),
        // Special animation for profile image
        ...(t.isProfile ? [
          Animated.spring(tabAnims[t.key].imageScale, {
            toValue: isActive ? 1.2 : 1,
            useNativeDriver: true,
            tension: 150,
            friction: 8,
          })
        ] : [])
      ]).start();
    });
  }, [activeTab]);

  const loadUserProfileImage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profileImageUrl = await ImageService.getUserProfileImage(user.id);
        setUserProfileImage(profileImageUrl);
      }
    } catch (error) {
      console.error('Error loading user profile image:', error);
    }
  };

  const handlePress = async (key: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(key);
  };

  const renderTabIcon = (tab: TabConfig, isActive: boolean) => {
    if (tab.isProfile) {
      return (
        <View style={styles.profileImageContainer}>
          <Animated.View 
            style={[
              styles.profileImageWrapper,
              { 
                transform: [{ scale: tabAnims[tab.key].imageScale }],
                borderColor: isActive ? tab.color : '#d1d5db',
              }
            ]}
          >
            <Image
              source={{
                uri: userProfileImage || ImageService.getDefaultProfileImage()
              }}
              style={styles.profileImage}
              defaultSource={{ uri: ImageService.getDefaultProfileImage() }}
            />
            {isActive && (
              <LinearGradient
                colors={['rgba(236,72,153,0.3)', 'rgba(219,39,119,0.3)']}
                style={styles.profileImageOverlay}
              />
            )}
          </Animated.View>
          {isActive && (
            <View style={[styles.activeIndicator, { backgroundColor: tab.color }]} />
          )}
        </View>
      );
    }

    return (
      <MaterialIcons 
        name={tab.icon as any} 
        size={24} 
        color={isActive ? tab.color : '#9ca3af'} 
      />
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView intensity={100} tint="light" style={styles.blurView}>
        <LinearGradient 
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)']} 
          style={styles.gradient}
        >
          {/* Animated Indicator */}
          <Animated.View 
            style={[
              styles.indicator, 
              { 
                transform: [{ translateX: indicatorAnim }], 
                backgroundColor: tabs.find(t => t.key === activeTab)?.color || '#6b7280'
              }
            ]} 
          />
          
          {/* Tabs Container */}
          <View style={styles.tabs}>
            {tabs.map(tab => {
              const isActive = tab.key === activeTab;
              return (
                <Pressable 
                  key={tab.key} 
                  onPress={() => handlePress(tab.key)} 
                  style={styles.tab}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Animated.View 
                    style={[
                      styles.tabContent,
                      { 
                        transform: [{ scale: tabAnims[tab.key].scale }], 
                        opacity: tabAnims[tab.key].opacity 
                      }
                    ]}
                  >
                    {renderTabIcon(tab, isActive)}
                    <Text 
                      style={[
                        styles.label, 
                        { 
                          color: isActive ? tab.color : '#9ca3af',
                          fontWeight: isActive ? '600' : '400',
                        }
                      ]}
                    >
                      {tab.title}
                    </Text>
                    
                    {/* Badge for notifications */}
                    {tab.badge && tab.badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {tab.badge > 99 ? '99+' : tab.badge.toString()}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: 16, 
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurView: { 
    borderRadius: 32, 
    overflow: 'hidden',
    ...Platform.select({ 
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -4 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 16 
      }, 
      android: { 
        elevation: 12 
      } 
    })
  },
  gradient: { 
    padding: 12, 
    paddingTop: 16,
    flexDirection: 'row',
    position: 'relative',
  },
  indicator: { 
    position: 'absolute', 
    bottom: 4, 
    height: 3, 
    width: (SCREEN_WIDTH - 64) / 5, // Account for container padding
    borderRadius: 2,
    left: 12,
  },
  tabs: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '100%',
    alignItems: 'center',
  },
  tab: { 
    alignItems: 'center', 
    flex: 1,
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: { 
    fontSize: 10, 
    marginTop: 4,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  profileImageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  profileImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
}); 