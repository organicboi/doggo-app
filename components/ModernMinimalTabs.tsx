import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ModernMinimalTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
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

export default function ModernMinimalTabs({
  activeTab,
  onTabPress,
}: ModernMinimalTabsProps) {
  const insets = useSafeAreaInsets();
  
  // Simple animation values
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = {
        scale: new Animated.Value(activeTab === tab.key ? 1 : 0.9),
        opacity: new Animated.Value(activeTab === tab.key ? 1 : 0.5),
      };
      return acc;
    }, {} as Record<string, any>)
  ).current;

  // Clean sliding indicator
  const indicatorPosition = useRef(new Animated.Value(
    tabs.findIndex(tab => tab.key === activeTab) * (SCREEN_WIDTH / tabs.length)
  )).current;

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    
    // Simple indicator animation
    Animated.timing(indicatorPosition, {
      toValue: activeIndex * (SCREEN_WIDTH / tabs.length) + (SCREEN_WIDTH / tabs.length / 2) - 20,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Simple tab animations
    tabs.forEach((tab) => {
      const isActive = tab.key === activeTab;
      const animations = tabAnimations[tab.key];
      
      Animated.parallel([
        Animated.timing(animations.scale, {
          toValue: isActive ? 1 : 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animations.opacity, {
          toValue: isActive ? 1 : 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeTab]);

  const handleTabPress = async (tabKey: string) => {
    if (tabKey !== activeTab) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Simple press feedback
      const pressedAnimations = tabAnimations[tabKey];
      Animated.sequence([
        Animated.timing(pressedAnimations.scale, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pressedAnimations.scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      onTabPress(tabKey);
    }
  };

  const getActiveTab = () => tabs.find(tab => tab.key === activeTab);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      {/* Clean Background */}
      <View style={styles.tabBar}>
        {/* Simple Active Indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              backgroundColor: getActiveTab()?.color || '#10b981',
              transform: [{ translateX: indicatorPosition }],
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
                style={styles.tabItem}
                android_ripple={{
                  color: `${tab.color}10`,
                  radius: 32,
                  borderless: true,
                }}
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
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    <MaterialIcons
                      name={tab.icon as any}
                      size={22}
                      color={isActive ? tab.color : '#9ca3af'}
                    />
                    
                    {/* Simple Badge */}
                    {tab.badge && (
                      <View style={styles.badge}>
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
                        fontWeight: isActive ? '600' : '400',
                      }
                    ]}
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
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    height: 2,
    width: 40,
    borderRadius: 1,
    zIndex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 4,
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
    minHeight: 48,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    lineHeight: 12,
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
}); 