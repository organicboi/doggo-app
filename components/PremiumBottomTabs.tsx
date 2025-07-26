import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PremiumBottomTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

interface TabConfig {
  key: string;
  title: string;
  icon: string;
  activeIcon: string;
  gradientColors: [string, string];
  accentColor: string;
  badge?: number;
}

const tabs: TabConfig[] = [
  {
    key: 'home',
    title: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
    gradientColors: ['#667eea', '#764ba2'],
    accentColor: '#667eea',
  },
  {
    key: 'map',
    title: 'Map',
    icon: 'map-outline',
    activeIcon: 'map',
    gradientColors: ['#10b981', '#059669'],
    accentColor: '#10b981',
  },
  {
    key: 'camera',
    title: 'Share',
    icon: 'camera-outline',
    activeIcon: 'camera',
    gradientColors: ['#8b5cf6', '#7c3aed'],
    accentColor: '#8b5cf6',
  },
  {
    key: 'community',
    title: 'Community',
    icon: 'people-outline',
    activeIcon: 'people',
    gradientColors: ['#f59e0b', '#d97706'],
    accentColor: '#f59e0b',
  },
  {
    key: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    gradientColors: ['#ec4899', '#db2777'],
    accentColor: '#ec4899',
  },
];

export default function PremiumBottomTabs({
  activeTab,
  onTabPress,
}: PremiumBottomTabsProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = {
        scale: new Animated.Value(activeTab === tab.key ? 1 : 0.8),
        translateY: new Animated.Value(activeTab === tab.key ? -8 : 0),
        opacity: new Animated.Value(activeTab === tab.key ? 1 : 0.6),
        glowOpacity: new Animated.Value(activeTab === tab.key ? 1 : 0),
      };
      return acc;
    }, {} as Record<string, any>)
  ).current;

  const floatingIndicator = useRef(new Animated.Value(
    tabs.findIndex(tab => tab.key === activeTab) * (SCREEN_WIDTH / tabs.length)
  )).current;

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    
    // Animate floating indicator
    Animated.spring(floatingIndicator, {
      toValue: activeIndex * (SCREEN_WIDTH / tabs.length) + (SCREEN_WIDTH / tabs.length / 2) - 20,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();

    // Animate all tabs
    tabs.forEach((tab) => {
      const isActive = tab.key === activeTab;
      const animations = tabAnimations[tab.key];
      
      Animated.parallel([
        Animated.spring(animations.scale, {
          toValue: isActive ? 1.1 : 0.9,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.spring(animations.translateY, {
          toValue: isActive ? -12 : 0,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(animations.opacity, {
          toValue: isActive ? 1 : 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animations.glowOpacity, {
          toValue: isActive ? 1 : 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeTab]);

  const handleTabPress = async (tabKey: string) => {
    if (tabKey !== activeTab) {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Bounce animation for pressed tab
      const pressedAnimations = tabAnimations[tabKey];
      Animated.sequence([
        Animated.spring(pressedAnimations.scale, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 400,
          friction: 10,
        }),
        Animated.spring(pressedAnimations.scale, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
      ]).start();
      
      onTabPress(tabKey);
    }
  };

  const getActiveTab = () => tabs.find(tab => tab.key === activeTab);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Floating Indicator */}
      <Animated.View
        style={[
          styles.floatingIndicator,
          {
            transform: [{ translateX: floatingIndicator }],
          }
        ]}
      >
        <LinearGradient
          colors={getActiveTab()?.gradientColors || ['#667eea', '#764ba2']}
          style={styles.indicatorGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Main Tab Container with Glassmorphism */}
      <BlurView intensity={95} tint="light" style={styles.tabBlur}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
          style={styles.tabGradient}
        >
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.key;
              const animations = tabAnimations[tab.key];

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabPress(tab.key)}
                  style={styles.tab}
                  android_ripple={{
                    color: `${tab.accentColor}30`,
                    radius: 35,
                    borderless: true,
                  }}
                >
                  <Animated.View
                    style={[
                      styles.tabContent,
                      {
                        transform: [
                          { scale: animations.scale },
                          { translateY: animations.translateY }
                        ],
                        opacity: animations.opacity,
                      }
                    ]}
                  >
                    {/* Glow Effect for Active Tab */}
                    {isActive && (
                      <Animated.View
                        style={[
                          styles.glowEffect,
                          {
                            opacity: animations.glowOpacity,
                            shadowColor: tab.accentColor,
                          }
                        ]}
                      />
                    )}

                    {/* Icon Container */}
                    <View style={[
                      styles.iconContainer,
                      isActive && styles.iconContainerActive
                    ]}>
                      {isActive ? (
                        <LinearGradient
                          colors={tab.gradientColors}
                          style={styles.activeIconGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Ionicons
                            name={tab.activeIcon as any}
                            size={24}
                            color="white"
                          />
                        </LinearGradient>
                      ) : (
                        <Ionicons
                          name={tab.icon as any}
                          size={24}
                          color="#9ca3af"
                        />
                      )}
                      
                      {/* Badge */}
                      {tab.badge && (
                        <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                          <Text style={styles.badgeText}>{tab.badge}</Text>
                        </View>
                      )}
                    </View>

                    {/* Label */}
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isActive ? tab.accentColor : '#9ca3af',
                          fontWeight: isActive ? '700' : '500',
                          fontSize: isActive ? 12 : 11,
                        }
                      ]}
                    >
                      {tab.title}
                    </Text>

                    {/* Active Tab Pulse Effect */}
                    {isActive && (
                      <Animated.View
                        style={[
                          styles.pulseEffect,
                          {
                            backgroundColor: `${tab.accentColor}20`,
                            opacity: animations.glowOpacity,
                          }
                        ]}
                      />
                    )}
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>
      </BlurView>

      {/* Premium Shadow */}
      <View style={styles.shadowContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'transparent']}
          style={styles.shadowGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  floatingIndicator: {
    position: 'absolute',
    top: -6,
    width: 40,
    height: 4,
    borderRadius: 2,
    zIndex: 10,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 2,
  },
  tabBlur: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  tabGradient: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: -18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  iconContainerActive: {
    marginBottom: 6,
  },
  activeIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  pulseEffect: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: -18,
  },
  shadowContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
  },
  shadowGradient: {
    flex: 1,
  },
}); 