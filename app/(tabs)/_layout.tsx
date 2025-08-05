import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabConfig {
  name: string;
  title: string;
  icon: string;
  iconType: 'FontAwesome' | 'MaterialIcons';
  color: string;
  gradient: [string, string];
  isProfile?: boolean;
}

const tabConfigs: TabConfig[] = [
  { 
    name: 'index', 
    title: 'Home', 
    icon: 'home', 
    iconType: 'FontAwesome',
    color: '#667eea', 
    gradient: ['#667eea', '#764ba2'] 
  },
  { 
    name: 'maps', 
    title: 'Maps', 
    icon: 'map', 
    iconType: 'FontAwesome',
    color: '#10b981', 
    gradient: ['#10b981', '#059669'] 
  },
  { 
    name: 'community', 
    title: 'Community', 
    icon: 'pets', 
    iconType: 'MaterialIcons',
    color: '#f59e0b', 
    gradient: ['#f59e0b', '#d97706'] 
  },
  { 
    name: 'user', 
    title: 'Profile', 
    icon: 'user', 
    iconType: 'FontAwesome',
    color: '#ec4899', 
    gradient: ['#ec4899', '#db2777'],
    isProfile: true
  },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  
  const tabAnims = useRef(
    tabConfigs.reduce((acc, tab) => {
      acc[tab.name] = {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(0.6),
      };
      return acc;
    }, {} as any)
  ).current;

  useEffect(() => {
    loadUserProfileImage();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserProfileImage();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const activeIndex = state.index;
    const tabWidth = (SCREEN_WIDTH - 64) / tabConfigs.length;

    // Animate indicator
    Animated.spring(indicatorAnim, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Animate tabs
    tabConfigs.forEach((tab, index) => {
      const isActive = index === activeIndex;
      Animated.parallel([
        Animated.spring(tabAnims[tab.name].scale, {
          toValue: isActive ? 1.1 : 0.95,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(tabAnims[tab.name].opacity, {
          toValue: isActive ? 1 : 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [state.index]);

  const loadUserProfileImage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get profile image from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profile?.avatar_url) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url);
          setUserProfileImage(data.publicUrl);
        }
      }
    } catch (error) {
      console.error('Error loading user profile image:', error);
    }
  };

  const handlePress = async (routeName: string, index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index].key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const renderTabIcon = (tab: TabConfig, isActive: boolean, index: number) => {
    if (tab.isProfile && userProfileImage) {
      return (
        <View style={styles.profileImageContainer}>
          <View
            style={[
              styles.profileImageWrapper,
              {
                borderColor: isActive ? tab.color : '#d1d5db',
              },
            ]}>
            <Image
              source={{ uri: userProfileImage }}
              style={styles.profileImage}
            />
            {isActive && (
              <LinearGradient
                colors={['rgba(236,72,153,0.3)', 'rgba(219,39,119,0.3)']}
                style={styles.profileImageOverlay}
              />
            )}
          </View>
          {isActive && <View style={[styles.activeIndicator, { backgroundColor: tab.color }]} />}
        </View>
      );
    }

    const IconComponent = tab.iconType === 'FontAwesome' ? FontAwesome : MaterialIcons;
    return (
      <IconComponent 
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
          style={styles.gradient}>
          
          {/* Animated Indicator */}
          <Animated.View
            style={[
              styles.indicator,
              {
                transform: [{ translateX: indicatorAnim }],
                backgroundColor: tabConfigs[state.index]?.color || '#667eea',
                width: (SCREEN_WIDTH - 64) / tabConfigs.length,
              },
            ]}
          />

          {/* Tabs Container */}
          <View style={styles.tabs}>
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const tab = tabConfigs.find(t => t.name === route.name);
              if (!tab) return null;

              const isActive = state.index === index;
              const label = options.tabBarLabel !== undefined ? options.tabBarLabel : tab.title;

              return (
                <Pressable
                  key={route.key}
                  onPress={() => handlePress(route.name, index)}
                  style={styles.tab}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Animated.View
                    style={[
                      styles.tabContent,
                      {
                        transform: [{ scale: tabAnims[tab.name]?.scale || new Animated.Value(1) }],
                        opacity: tabAnims[tab.name]?.opacity || new Animated.Value(0.6),
                      },
                    ]}>
                    {renderTabIcon(tab, isActive, index)}
                    <Text
                      style={[
                        styles.label,
                        {
                          color: isActive ? tab.color : '#9ca3af',
                          fontWeight: isActive ? '600' : '400',
                        },
                      ]}>
                      {label}
                    </Text>
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

export default function TabLayout() {
  return (
    <Tabs 
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ 
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Maps',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
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
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  gradient: {
    padding: 12,
    paddingTop: 16,
    flexDirection: 'row',
    position: 'relative',
    minHeight: 70,
  },
  indicator: {
    position: 'absolute',
    bottom: 4,
    height: 3,
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
    fontWeight: '500',
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
