import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ResponsiveBottomTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

interface TabConfig {
  key: string;
  title: string;
  icon: string;
  activeIcon: string;
  color: string;
  gradientColors: [string, string];
  badge?: number;
}

const tabs: TabConfig[] = [
  {
    key: 'home',
    title: 'Home',
    icon: 'home-outlined',
    activeIcon: 'home',
    color: '#667eea',
    gradientColors: ['#667eea', '#764ba2'],
  },
  {
    key: 'map',
    title: 'Map',
    icon: 'map-outlined',
    activeIcon: 'map',
    color: '#10b981',
    gradientColors: ['#10b981', '#059669'],
  },
  {
    key: 'camera',
    title: 'Share',
    icon: 'camera-alt-outlined',
    activeIcon: 'camera-alt',
    color: '#8b5cf6',
    gradientColors: ['#8b5cf6', '#7c3aed'],
  },
  {
    key: 'community',
    title: 'Community',
    icon: 'groups-outlined',
    activeIcon: 'groups',
    color: '#f59e0b',
    gradientColors: ['#f59e0b', '#d97706'],
  },
  {
    key: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    color: '#ec4899',
    gradientColors: ['#ec4899', '#db2777'],
  },
];

export default function ResponsiveBottomTabs({
  activeTab,
  onTabPress,
}: ResponsiveBottomTabsProps) {
  const insets = useSafeAreaInsets();
  
  // Enhanced animation values for each tab
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = {
        scale: new Animated.Value(activeTab === tab.key ? 1 : 0.85),
        translateY: new Animated.Value(activeTab === tab.key ? -6 : 0),
        opacity: new Animated.Value(activeTab === tab.key ? 1 : 0.6),
        iconScale: new Animated.Value(activeTab === tab.key ? 1.2 : 1),
        glowOpacity: new Animated.Value(activeTab === tab.key ? 1 : 0),
      };
      return acc;
    }, {} as Record<string, any>)
  ).current;

  // Enhanced background indicator animation
  const indicatorPosition = useRef(new Animated.Value(
    tabs.findIndex(tab => tab.key === activeTab) * (SCREEN_WIDTH / tabs.length)
  )).current;

  const indicatorWidth = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    
    // Animate indicator position and width
    Animated.parallel([
      Animated.spring(indicatorPosition, {
        toValue: activeIndex * (SCREEN_WIDTH / tabs.length) + (SCREEN_WIDTH / tabs.length / 2) - 30,
        useNativeDriver: true,
        tension: 300,
        friction: 25,
      }),
      Animated.spring(indicatorWidth, {
        toValue: 60,
        useNativeDriver: false,
        tension: 300,
        friction: 25,
      }),
    ]).start();

    // Animate all tabs with enhanced effects
    tabs.forEach((tab) => {
      const isActive = tab.key === activeTab;
      const animations = tabAnimations[tab.key];
      
      Animated.parallel([
        Animated.spring(animations.scale, {
          toValue: isActive ? 1 : 0.85,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }),
        Animated.spring(animations.translateY, {
          toValue: isActive ? -6 : 0,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }),
        Animated.timing(animations.opacity, {
          toValue: isActive ? 1 : 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(animations.iconScale, {
          toValue: isActive ? 1.2 : 1,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
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
      // Enhanced haptic feedback with different patterns
      await Haptics.impactAsync(
        tabKey === 'map' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
      
      // Enhanced bounce animation for pressed tab
      const pressedAnimations = tabAnimations[tabKey];
      Animated.sequence([
        Animated.spring(pressedAnimations.scale, {
          toValue: 1.15,
          useNativeDriver: true,
          tension: 400,
          friction: 8,
        }),
        Animated.spring(pressedAnimations.scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }),
      ]).start();
      
      onTabPress(tabKey);
    }
  };

  const getActiveTab = () => tabs.find(tab => tab.key === activeTab);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {/* Enhanced Background with Blur */}
      <BlurView intensity={95} tint="light" style={styles.tabBlur}>
        <LinearGradient
          colors={['rgba(255,255,255,0.98)', 'rgba(248,250,252,0.95)']}
          style={styles.tabBackground}
        >
          {/* Enhanced Active Tab Indicator */}
          <Animated.View
            style={[
              styles.enhancedIndicator,
              {
                transform: [{ translateX: indicatorPosition }],
              }
            ]}
          >
            <LinearGradient
              colors={getActiveTab()?.gradientColors || ['#10b981', '#059669']}
              style={styles.indicatorGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Tab Items Container */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const animations = tabAnimations[tab.key];

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabPress(tab.key)}
                  style={styles.responsiveTabItem}
                  android_ripple={{
                    color: `${tab.color}15`,
                    radius: 40,
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
                    {/* Enhanced Glow Effect */}
                    {isActive && (
                      <Animated.View
                        style={[
                          styles.glowEffect,
                          {
                            opacity: animations.glowOpacity,
                            shadowColor: tab.color,
                          }
                        ]}
                      />
                    )}

                    {/* Icon Container with Enhanced States */}
                    <View style={styles.iconContainer}>
                      {isActive ? (
                        <View style={[styles.activeIconWrapper, { 
                          backgroundColor: `${tab.color}12`,
                          borderColor: `${tab.color}25`,
                        }]}>
                          <Animated.View
                            style={[
                              styles.activeIconContainer,
                              {
                                transform: [{ scale: animations.iconScale }]
                              }
                            ]}
                          >
                            <LinearGradient
                              colors={tab.gradientColors}
                              style={styles.activeIconGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <MaterialIcons
                                name={tab.activeIcon as any}
                                size={20}
                                color="white"
                              />
                            </LinearGradient>
                          </Animated.View>
                        </View>
                      ) : (
                        <Animated.View
                          style={[
                            styles.inactiveIconContainer,
                            {
                              transform: [{ scale: animations.iconScale }]
                            }
                          ]}
                        >
                          <MaterialIcons
                            name={tab.icon as any}
                            size={20}
                            color="#9ca3af"
                          />
                        </Animated.View>
                      )}

                      {/* Enhanced Badge */}
                      {tab.badge && (
                        <View style={[styles.enhancedBadge, { backgroundColor: '#ef4444' }]}>
                          <Text style={styles.badgeText}>{tab.badge}</Text>
                        </View>
                      )}
                    </View>

                    {/* Enhanced Label */}
                    <Text
                      style={[
                        styles.enhancedTabLabel,
                        {
                          color: isActive ? tab.color : '#9ca3af',
                          fontWeight: isActive ? '700' : '500',
                          fontSize: isActive ? 11 : 10,
                          marginTop: isActive ? 6 : 4,
                          opacity: isActive ? 1 : 0.8,
                        }
                      ]}
                    >
                      {tab.title}
                    </Text>

                    {/* Active State Indicator Dot */}
                    {isActive && (
                      <Animated.View
                        style={[
                          styles.activeDot,
                          { 
                            backgroundColor: tab.color,
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

      {/* Enhanced Shadow System */}
      <View style={styles.shadowSystem}>
        <LinearGradient
          colors={['rgba(0,0,0,0.08)', 'transparent']}
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
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  tabBackground: {
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 6,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  enhancedIndicator: {
    position: 'absolute',
    top: 4,
    height: 3,
    width: 60,
    borderRadius: 2,
    zIndex: 2,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 2,
    paddingTop: 4,
  },
  responsiveTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    minHeight: 64,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  glowEffect: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: -8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    borderRadius: 18,
    padding: 2,
    borderWidth: 1,
  },
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inactiveIconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  enhancedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
    lineHeight: 12,
  },
  enhancedTabLabel: {
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  shadowSystem: {
    position: 'absolute',
    top: -16,
    left: 12,
    right: 12,
    height: 16,
    zIndex: -1,
  },
  shadowGradient: {
    flex: 1,
  },
}); 