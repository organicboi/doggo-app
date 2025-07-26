import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ModernBottomTabsProps {
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

export default function ModernBottomTabs({
  activeTab,
  onTabPress,
}: ModernBottomTabsProps) {
  const insets = useSafeAreaInsets();
  
  // Animation values for each tab
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = {
        scale: new Animated.Value(activeTab === tab.key ? 1 : 0.9),
        translateY: new Animated.Value(activeTab === tab.key ? -4 : 0),
        opacity: new Animated.Value(activeTab === tab.key ? 1 : 0.7),
        iconScale: new Animated.Value(activeTab === tab.key ? 1.1 : 1),
      };
      return acc;
    }, {} as Record<string, any>)
  ).current;

  // Background indicator animation
  const indicatorPosition = useRef(new Animated.Value(
    tabs.findIndex(tab => tab.key === activeTab) * (SCREEN_WIDTH / tabs.length)
  )).current;

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    
    // Animate indicator position
    Animated.spring(indicatorPosition, {
      toValue: activeIndex * (SCREEN_WIDTH / tabs.length),
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
          toValue: isActive ? 1 : 0.9,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.spring(animations.translateY, {
          toValue: isActive ? -4 : 0,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(animations.opacity, {
          toValue: isActive ? 1 : 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(animations.iconScale, {
          toValue: isActive ? 1.1 : 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
      ]).start();
    });
  }, [activeTab]);

  const handleTabPress = async (tabKey: string) => {
    if (tabKey !== activeTab) {
      // Enhanced haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Bounce animation for pressed tab
      const pressedAnimations = tabAnimations[tabKey];
      Animated.sequence([
        Animated.spring(pressedAnimations.scale, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 400,
          friction: 10,
        }),
        Animated.spring(pressedAnimations.scale, {
          toValue: 1,
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
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Background Card */}
      <Card style={styles.tabCard} elevation={Platform.OS === 'android' ? 5 : 0}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.tabBackground}
        >
          {/* Active Tab Indicator */}
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                transform: [{ translateX: indicatorPosition }],
                width: SCREEN_WIDTH / tabs.length,
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

          {/* Tab Items */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const animations = tabAnimations[tab.key];

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabPress(tab.key)}
                  style={styles.tabItem}
                  android_ripple={{
                    color: `${tab.color}20`,
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
                    {/* Icon Container */}
                    <View style={styles.iconContainer}>
                      {isActive ? (
                        <View style={[styles.activeIconWrapper, { backgroundColor: `${tab.color}15` }]}>
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
                            >
                              <MaterialIcons
                                name={tab.activeIcon as any}
                                size={22}
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
                            size={22}
                            color="#9ca3af"
                          />
                        </Animated.View>
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
                          color: isActive ? tab.color : '#9ca3af',
                          fontWeight: isActive ? '700' : '500',
                          fontSize: isActive ? 12 : 11,
                          marginTop: isActive ? 6 : 4,
                        }
                      ]}
                    >
                      {tab.title}
                    </Text>

                    {/* Active Dot Indicator */}
                    {isActive && (
                      <View
                        style={[
                          styles.activeDot,
                          { backgroundColor: tab.color }
                        ]}
                      />
                    )}
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>
      </Card>

      {/* Shadow for iOS */}
      {Platform.OS === 'ios' && (
        <View style={styles.shadowContainer}>
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'transparent']}
            style={styles.shadowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBackground: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    height: 4,
    borderRadius: 2,
    zIndex: 1,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 60,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  activeIconWrapper: {
    borderRadius: 20,
    padding: 4,
  },
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inactiveIconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
  },
  tabLabel: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  shadowContainer: {
    position: 'absolute',
    top: -20,
    left: 16,
    right: 16,
    height: 20,
    zIndex: -1,
  },
  shadowGradient: {
    flex: 1,
  },
}); 