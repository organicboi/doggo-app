import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Surface, Badge, TouchableRipple } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface MaterialBottomTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

interface TabConfig {
  key: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: number;
}

const tabs: TabConfig[] = [
  {
    key: 'home',
    title: 'Home',
    icon: 'home',
  },
  {
    key: 'map',
    title: 'Map',
    icon: 'map',
  },
  {
    key: 'camera',
    title: 'Share',
    icon: 'camera-alt',
  },
  {
    key: 'community',
    title: 'Community',
    icon: 'groups',
  },
  {
    key: 'profile',
    title: 'Profile',
    icon: 'person',
  },
];

export default function MaterialBottomTabs({
  activeTab,
  onTabPress,
}: MaterialBottomTabsProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleTabPress = async (tabKey: string) => {
    if (tabKey !== activeTab) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onTabPress(tabKey);
    }
  };

  return (
    <Surface
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          paddingBottom: insets.bottom,
          borderTopColor: theme.colors.outlineVariant,
        },
      ]}
      elevation={3}
    >
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableRipple
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              rippleColor={`${theme.colors.primary}20`}
              style={styles.tab}
              borderless
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name={tab.icon}
                    size={24}
                    color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  {tab.badge && (
                    <Badge
                      size={16}
                      style={[
                        styles.badge,
                        { backgroundColor: theme.colors.error }
                      ]}
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </View>
                <Text
                  variant="labelSmall"
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive 
                        ? theme.colors.primary 
                        : theme.colors.onSurfaceVariant,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {tab.title}
                </Text>
                {isActive && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                )}
              </View>
            </TouchableRipple>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
  },
  tabLabel: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
}); 