/**
 * DogoApp Unified Bottom Navigation
 * Consistent bottom navigation using the design system
 */

import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabColors, Theme, getColorWithOpacity } from '../../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================
export interface TabItem {
  key: string;
  title: string;
  icon: string;
  activeIcon?: string;
  iconType?: 'MaterialIcons' | 'FontAwesome' | 'Ionicons';
  color: string;
  gradient: [string, string];
  badge?: number;
  isProfile?: boolean;
}

interface UnifiedBottomTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tab: string) => void;
  variant?: 'floating' | 'standard' | 'minimal';
  showLabels?: boolean;
  profileImageUri?: string;
  style?: ViewStyle;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export const UnifiedBottomTabs: React.FC<UnifiedBottomTabsProps> = ({
  tabs,
  activeTab,
  onTabPress,
  variant = 'floating',
  showLabels = true,
  profileImageUri,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const animationRefs = useRef<{ [key: string]: Animated.Value }>({});
  const backgroundPosition = useRef(new Animated.Value(0)).current;

  // Initialize animations
  useEffect(() => {
    tabs.forEach((tab) => {
      if (!animationRefs.current[tab.key]) {
        animationRefs.current[tab.key] = new Animated.Value(0);
      }
    });
  }, [tabs]);

  // Animate active tab
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    
    // Animate indicator position
    Animated.spring(backgroundPosition, {
      toValue: activeIndex,
      useNativeDriver: false,
      tension: 150,
      friction: 8,
    }).start();

    // Animate tab icons
    tabs.forEach((tab, index) => {
      const isActive = tab.key === activeTab;
      Animated.spring(animationRefs.current[tab.key], {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }).start();
    });
  }, [activeTab, tabs]);

  const handleTabPress = (tab: TabItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTabPress(tab.key);
  };

  const renderIcon = (tab: TabItem, isActive: boolean) => {
    const iconName = isActive && tab.activeIcon ? tab.activeIcon : tab.icon;
    const iconColor = isActive ? tab.color : Theme.colors.onSurfaceVariant;
    const iconSize = variant === 'minimal' ? 22 : 24;

    const animation = animationRefs.current[tab.key];
    const scale = animation?.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1.1],
    }) || 1;

    const IconComponent = tab.iconType === 'FontAwesome' ? FontAwesome :
                         tab.iconType === 'Ionicons' ? Ionicons : MaterialIcons;

    return (
      <Animated.View style={[styles.iconContainer, { transform: [{ scale }] }]}>
        <IconComponent 
          name={iconName as any} 
          size={iconSize} 
          color={iconColor} 
        />
        {tab.badge && tab.badge > 0 && (
          <View style={[styles.badge, { backgroundColor: Theme.colors.error }]}>
            <Text style={styles.badgeText}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderFloatingTabs = () => {
    const tabWidth = SCREEN_WIDTH / tabs.length;
    const indicatorWidth = tabWidth * 0.6;
    
    const indicatorLeft = backgroundPosition.interpolate({
      inputRange: tabs.map((_, index) => index),
      outputRange: tabs.map((_, index) => index * tabWidth + (tabWidth - indicatorWidth) / 2),
    });

    return (
      <View style={[styles.floatingContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.floatingTabBar}>
          {/* Animated Background Indicator */}
          <Animated.View
            style={[
              styles.floatingIndicator,
              {
                left: indicatorLeft,
                width: indicatorWidth,
                backgroundColor: getColorWithOpacity(Theme.colors.primary, 0.1),
              },
            ]}
          />
          
          {/* Tab Items */}
          <View style={styles.tabsRow}>
            {tabs.map((tab, index) => {
              const isActive = tab.key === activeTab;
              
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.floatingTab}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.7}
                >
                  {renderIcon(tab, isActive)}
                  {showLabels && (
                    <Text
                      style={[
                        styles.tabLabel,
                        { 
                          color: isActive ? tab.color : Theme.colors.onSurfaceVariant,
                          fontWeight: isActive ? '600' : '500',
                        }
                      ]}
                    >
                      {tab.title}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderStandardTabs = () => {
    return (
      <View style={[styles.standardContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.standardTabBar}>
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeTab;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.standardTab}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                {isActive && (
                  <LinearGradient
                    colors={tab.gradient}
                    style={styles.activeBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
                
                {renderIcon(tab, isActive)}
                {showLabels && (
                  <Text
                    style={[
                      styles.tabLabel,
                      { 
                        color: isActive ? '#ffffff' : Theme.colors.onSurfaceVariant,
                        fontWeight: isActive ? '600' : '500',
                      }
                    ]}
                  >
                    {tab.title}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMinimalTabs = () => {
    return (
      <View style={[styles.minimalContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.minimalTabBar}>
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeTab;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.minimalTab}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
              >
                {isActive && (
                  <View style={[styles.minimalIndicator, { backgroundColor: tab.color }]} />
                )}
                
                {renderIcon(tab, isActive)}
                {showLabels && (
                  <Text
                    style={[
                      styles.tabLabel,
                      styles.minimalLabel,
                      { 
                        color: isActive ? tab.color : Theme.colors.onSurfaceVariant,
                        fontWeight: isActive ? '600' : '500',
                      }
                    ]}
                  >
                    {tab.title}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    variant === 'floating' && styles.floatingContainerStyle,
    style,
  ];

  return (
    <View style={containerStyle}>
      {variant === 'floating' && renderFloatingTabs()}
      {variant === 'standard' && renderStandardTabs()}
      {variant === 'minimal' && renderMinimalTabs()}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  // Floating variant
  floatingContainerStyle: {
    paddingHorizontal: Theme.spacing.md,
  },
  floatingContainer: {
    paddingTop: Theme.spacing.sm,
  },
  floatingTabBar: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xxxl,
    position: 'relative',
    ...Theme.shadows.lg,
  },
  floatingIndicator: {
    position: 'absolute',
    top: 8,
    height: 48,
    borderRadius: Theme.borderRadius.xl,
    zIndex: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    zIndex: 1,
  },
  floatingTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
  },

  // Standard variant
  standardContainer: {
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outline,
  },
  standardTabBar: {
    flexDirection: 'row',
    paddingTop: Theme.spacing.sm,
  },
  standardTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
    position: 'relative',
    borderRadius: Theme.borderRadius.md,
    marginHorizontal: 4,
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Theme.borderRadius.md,
  },

  // Minimal variant
  minimalContainer: {
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outline,
  },
  minimalTabBar: {
    flexDirection: 'row',
    paddingTop: Theme.spacing.sm,
  },
  minimalTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
    position: 'relative',
  },
  minimalIndicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 1,
  },

  // Common styles
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    ...Theme.typography.labelSmall,
    textAlign: 'center',
  },
  minimalLabel: {
    fontSize: 10,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...Theme.typography.labelSmall,
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
});

// =============================================================================
// DEFAULT TABS CONFIGURATION
// =============================================================================
export const defaultTabs: TabItem[] = [
  {
    key: 'home',
    title: 'Home',
    icon: 'home',
    activeIcon: 'home',
    iconType: 'MaterialIcons',
    color: TabColors.home.color,
    gradient: TabColors.home.gradient as [string, string],
  },
  {
    key: 'maps',
    title: 'Maps',
    icon: 'map',
    activeIcon: 'map',
    iconType: 'FontAwesome',
    color: TabColors.maps.color,
    gradient: TabColors.maps.gradient as [string, string],
  },
  {
    key: 'community',
    title: 'Community',
    icon: 'people',
    activeIcon: 'people',
    iconType: 'MaterialIcons',
    color: TabColors.community.color,
    gradient: TabColors.community.gradient as [string, string],
  },
  {
    key: 'profile',
    title: 'Profile',
    icon: 'person',
    activeIcon: 'person',
    iconType: 'MaterialIcons',
    color: TabColors.profile.color,
    gradient: TabColors.profile.gradient as [string, string],
    isProfile: true,
  },
];

export default UnifiedBottomTabs;
