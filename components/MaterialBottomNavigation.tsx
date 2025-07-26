import React from 'react';
import { BottomNavigation, useTheme } from 'react-native-paper';

interface MaterialBottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function MaterialBottomNavigation({ 
  activeTab, 
  onTabPress 
}: MaterialBottomNavigationProps) {
  const theme = useTheme();

  const routes = [
    { 
      key: 'home', 
      title: 'Home', 
      focusedIcon: 'home',
      unfocusedIcon: 'home-outline',
      badge: false
    },
    { 
      key: 'map', 
      title: 'Map', 
      focusedIcon: 'map',
      unfocusedIcon: 'map-outline',
      badge: false
    },
    { 
      key: 'camera', 
      title: 'Share', 
      focusedIcon: 'camera',
      unfocusedIcon: 'camera-outline',
      badge: false
    },
    { 
      key: 'community', 
      title: 'Community', 
      focusedIcon: 'account-group',
      unfocusedIcon: 'account-group-outline',
      badge: false
    },
    { 
      key: 'profile', 
      title: 'Profile', 
      focusedIcon: 'account',
      unfocusedIcon: 'account-outline',
      badge: false
    },
  ];

  const renderScene = BottomNavigation.SceneMap({
    home: () => null,
    map: () => null,
    camera: () => null,
    community: () => null,
    profile: () => null,
  });

  return (
    <BottomNavigation
      navigationState={{ 
        index: routes.findIndex(route => route.key === activeTab), 
        routes 
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
      }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      sceneAnimationEnabled={false}
      sceneAnimationType='shifting'
      labeled={true}
      compact={false}
      safeAreaInsets={{ bottom: 0 }}
    />
  );
} 