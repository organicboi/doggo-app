import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Appearance, ColorSchemeName, Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FloatingModernTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  visible?: boolean; // New: controls tab bar visibility (auto-hide)
  theme?: ColorSchemeName; // New: allow theme override
}

interface TabConfig {
  key: string;
  title: string;
  icon: string;
  color: string;
  badge?: number;
}

const tabs: TabConfig[] = [
  {
    key: 'home',
    title: 'Home',
    icon: 'home',
    color: '#1f2937',
  },
  {
    key: 'map',
    title: 'Map',
    icon: 'map',
    color: '#10b981',
  },
  {
    key: 'camera',
    title: 'Share',
    icon: 'camera-alt',
    color: '#8b5cf6',
  },
  {
    key: 'community',
    title: 'Community',
    icon: 'groups',
    color: '#f59e0b',
  },
  {
    key: 'profile',
    title: 'Profile',
    icon: 'person',
    color: '#6b7280',
  },
];

const TAB_WIDTH = (SCREEN_WIDTH - 64) / tabs.length; // 32px padding on each side

export default React.memo(function FloatingModernTabs({
  activeTab,
  onTabPress,
  visible = true, // Default to visible
  theme,
}: FloatingModernTabsProps) {
  const insets = useSafeAreaInsets();
  // Theme detection
  const colorScheme = theme || Appearance.getColorScheme() || 'light';
  const isDark = colorScheme === 'dark';

  // Simplified animations
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = {
        scale: new Animated.Value(activeTab === tab.key ? 1 : 0.85),
        opacity: new Animated.Value(activeTab === tab.key ? 1 : 0.6),
      };
      return acc;
    }, {} as Record<string, any>)
  ).current;

  // Floating pill indicator
  const pillPosition = useRef(new Animated.Value(
    tabs.findIndex(tab => tab.key === activeTab) * TAB_WIDTH
  )).current;

  // Animated visibility for auto-hide
  const visibilityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // Animated badge state
  const badgeAnims = useMemo(() =>
    tabs.reduce((acc, tab) => {
      acc[tab.key] = new Animated.Value(0); // 0: hidden, 1: visible
      return acc;
    }, {} as Record<string, Animated.Value>)
  , []);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    
    // Smooth pill animation
    Animated.spring(pillPosition, {
      toValue: activeIndex * TAB_WIDTH + 4, // 4px offset for padding
      useNativeDriver: true,
      tension: 200,
      friction: 20,
    }).start();

    // Simple tab state changes
    tabs.forEach((tab) => {
      const isActive = tab.key === activeTab;
      const animations = tabAnimations[tab.key];
      
      Animated.parallel([
        Animated.timing(animations.scale, {
          toValue: isActive ? 1 : 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animations.opacity, {
          toValue: isActive ? 1 : 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Animated badge state
    tabs.forEach(tab => {
      if (tab.badge) {
        Animated.spring(badgeAnims[tab.key], {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(badgeAnims[tab.key], {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [activeTab, tabs.map(t => t.badge).join(',')]);

  const handleTabPress = async (tabKey: string) => {
    if (tabKey !== activeTab) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Gentle press feedback
      const pressedAnimations = tabAnimations[tabKey];
      Animated.sequence([
        Animated.timing(pressedAnimations.scale, {
          toValue: 1.1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(pressedAnimations.scale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
      
      onTabPress(tabKey);
    }
  };

  const getActiveTab = () => tabs.find(tab => tab.key === activeTab);

  // Dynamic colors
  const backgroundColor = isDark ? '#18181b' : '#ffffff';
  const pillAlpha = isDark ? '25' : '15';
  const borderColor = isDark ? '#27272a' : '#e5e7eb';

  return (
    <Animated.View
      style={{
        opacity: visibilityAnim,
        transform: [{ translateY: visibilityAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [80, 0],
        }) }],
        // Ensure pointerEvents is none when hidden
        pointerEvents: visible ? 'auto' : 'none',
      }}
      accessible={false}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}> 
        {/* Floating Tab Container */}
        <View style={[styles.floatingContainer, { backgroundColor, borderColor }]}> 
          {/* Animated Background Pill */}
          <Animated.View
            style={[
              styles.backgroundPill,
              {
                backgroundColor: `${getActiveTab()?.color || '#10b981'}${pillAlpha}`,
                transform: [{ translateX: pillPosition }],
                width: TAB_WIDTH - 8,
              }
            ]}
          />

          {/* Tab Items */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const animations = tabAnimations[tab.key];
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabPress(tab.key)}
                  style={[styles.tabItem, { width: TAB_WIDTH, minHeight: 48, minWidth: 48 }]}
                  android_ripple={{
                    color: `${tab.color}20`,
                    radius: 28,
                    borderless: true,
                  }}
                  accessibilityLabel={tab.title}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  importantForAccessibility="yes"
                >
                  <Animated.View
                    style={[
                      styles.tabContent,
                      {
                        transform: [{ scale: animations.scale }],
                        opacity: animations.opacity,
                      }
                    ]}
                  >
                    {/* Icon with optional animated badge */}
                    <View style={styles.iconWrapper}>
                      <MaterialIcons
                        name={tab.icon as any}
                        size={24}
                        color={isActive ? tab.color : '#9ca3af'}
                        accessibilityIgnoresInvertColors={false}
                      />
                      {/* Animated Badge */}
                      {tab.badge ? (
                        <Animated.View
                          style={{
                            ...styles.badge,
                            transform: [
                              { scale: badgeAnims[tab.key] },
                            ],
                            opacity: badgeAnims[tab.key],
                          }}
                        >
                          <View style={styles.badgeDot} />
                        </Animated.View>
                      ) : null}
                    </View>
                    {/* Clean Typography */}
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isActive ? tab.color : '#9ca3af',
                          fontWeight: isActive ? '600' : '500',
                          opacity: isActive ? 1 : 0.8,
                        }
                      ]}
                      accessibilityElementsHidden={true}
                    >
                      {tab.title}
                    </Text>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
    paddingTop: 8,
  },
  floatingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
    position: 'relative',
    borderWidth: 1, // Add border for dark mode
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  backgroundPill: {
    position: 'absolute',
    top: 8,
    height: 48,
    borderRadius: 20,
    zIndex: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    zIndex: 1,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: '100%',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: 0.2,
  },
}); 