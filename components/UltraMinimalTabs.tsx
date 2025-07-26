import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UltraMinimalTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

interface TabConfig {
  key: string;
  icon: string;
  color: string;
  badge?: boolean;
}

const tabs: TabConfig[] = [
  {
    key: 'home',
    icon: 'home',
    color: '#1f2937',
  },
  {
    key: 'map',
    icon: 'map',
    color: '#10b981',
  },
  {
    key: 'camera',
    icon: 'camera-alt',
    color: '#8b5cf6',
  },
  {
    key: 'community',
    icon: 'groups',
    color: '#f59e0b',
    badge: true,
  },
  {
    key: 'profile',
    icon: 'person',
    color: '#6b7280',
  },
];

const TAB_SIZE = 56;
const TAB_SPACING = (SCREEN_WIDTH - (tabs.length * TAB_SIZE)) / (tabs.length + 1);

export default function UltraMinimalTabs({
  activeTab,
  onTabPress,
}: UltraMinimalTabsProps) {
  const insets = useSafeAreaInsets();
  
  // Minimal animations
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.key] = {
        scale: new Animated.Value(activeTab === tab.key ? 1 : 0.8),
        backgroundOpacity: new Animated.Value(activeTab === tab.key ? 1 : 0),
      };
      return acc;
    }, {} as Record<string, any>)
  ).current;

  useEffect(() => {
    tabs.forEach((tab) => {
      const isActive = tab.key === activeTab;
      const animations = tabAnimations[tab.key];
      
      Animated.parallel([
        Animated.spring(animations.scale, {
          toValue: isActive ? 1 : 0.8,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.timing(animations.backgroundOpacity, {
          toValue: isActive ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeTab]);

  const handleTabPress = async (tabKey: string) => {
    if (tabKey !== activeTab) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Minimal press feedback
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
      {/* Ultra Clean Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          const animations = tabAnimations[tab.key];

          return (
            <View
              key={tab.key}
              style={[
                styles.tabWrapper,
                {
                  marginLeft: index === 0 ? TAB_SPACING : TAB_SPACING / 2,
                  marginRight: index === tabs.length - 1 ? TAB_SPACING : TAB_SPACING / 2,
                }
              ]}
            >
              <Pressable
                onPress={() => handleTabPress(tab.key)}
                style={styles.tabItem}
                android_ripple={{
                  color: `${tab.color}30`,
                  radius: 28,
                  borderless: true,
                }}
              >
                {/* Animated Background Circle */}
                <Animated.View
                  style={[
                    styles.activeBackground,
                    {
                      backgroundColor: `${tab.color}12`,
                      opacity: animations.backgroundOpacity,
                    }
                  ]}
                />

                {/* Icon with Animation */}
                <Animated.View
                  style={[
                    styles.iconContainer,
                    {
                      transform: [{ scale: animations.scale }],
                    }
                  ]}
                >
                  <MaterialIcons
                    name={tab.icon as any}
                    size={26}
                    color={isActive ? tab.color : '#9ca3af'}
                  />
                  
                  {/* Minimal Badge Dot */}
                  {tab.badge && (
                    <View style={styles.badgeDot} />
                  )}
                </Animated.View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 12,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabWrapper: {
    alignItems: 'center',
  },
  tabItem: {
    width: TAB_SIZE,
    height: TAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    width: TAB_SIZE,
    height: TAB_SIZE,
    borderRadius: TAB_SIZE / 2,
    zIndex: 0,
  },
  iconContainer: {
    position: 'relative',
    zIndex: 1,
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
}); 