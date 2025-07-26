import React from 'react';
import { View } from 'react-native';
import { BottomNavigation as PaperBottomNavigation, useTheme } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const routes = [
    {
      key: 'home',
      title: 'Home',
      focusedIcon: 'home',
      unfocusedIcon: 'home-outline',
    },
    {
      key: 'map',
      title: 'Map',
      focusedIcon: 'map',
      unfocusedIcon: 'map-outline',
    },
    {
      key: 'camera',
      title: 'Share',
      focusedIcon: 'camera',
      unfocusedIcon: 'camera-outline',
    },
    {
      key: 'community',
      title: 'Community',
      focusedIcon: 'account-group',
      unfocusedIcon: 'account-group-outline',
    },
    {
      key: 'profile',
      title: 'Profile',
      focusedIcon: 'account',
      unfocusedIcon: 'account-outline',
    },
  ];

  const renderScene = PaperBottomNavigation.SceneMap({
    home: () => <View />,
    map: () => <View />,
    camera: () => <View />,
    community: () => <View />,
    profile: () => <View />,
  });

  return (
    <View style={{ paddingBottom: insets.bottom }}>
      <PaperBottomNavigation
        navigationState={{
          index: routes.findIndex((route) => route.key === activeTab),
          routes,
        }}
        onIndexChange={(index) => onTabPress(routes[index].key)}
        renderScene={renderScene}
        barStyle={{
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 65,
        }}
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.onSurfaceVariant}
        sceneAnimationEnabled={false}
        sceneAnimationType="shifting"
        labeled={true}
        compact={false}
        safeAreaInsets={{ bottom: 0 }}
      />
    </View>
  );
}
