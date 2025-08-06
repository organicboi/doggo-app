import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { UnifiedBottomTabs, type TabItem } from '../../components/ui/UnifiedBottomTabs';
import { TabColors } from '../../lib/theme';

// Updated tab configuration using the new design system
const modernTabs: TabItem[] = [
  {
    key: 'index',
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
    icon: 'pets',
    activeIcon: 'pets',
    iconType: 'MaterialIcons',
    color: TabColors.community.color,
    gradient: TabColors.community.gradient as [string, string],
  },
  {
    key: 'user',
    title: 'Profile',
    icon: 'person',
    activeIcon: 'person',
    iconType: 'MaterialIcons',
    color: TabColors.profile.color,
    gradient: TabColors.profile.gradient as [string, string],
    isProfile: true,
  },
];

function ModernTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('index');

  useEffect(() => {
    const routeName = state.routes[state.index]?.name || 'index';
    setActiveTab(routeName);
  }, [state.index]);

  const handleTabPress = (tabKey: string) => {
    // Find the corresponding route name
    const tab = modernTabs.find(t => t.key === tabKey);
    if (tab) {
      const event = navigation.emit({
        type: 'tabPress',
        target: state.routes.find((route: any) => route.name === tab.key)?.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        router.push(`/(tabs)/${tab.key === 'index' ? '' : tab.key}` as any);
      }
    }
  };

  return (
    <UnifiedBottomTabs
      tabs={modernTabs}
      activeTab={activeTab}
      onTabPress={handleTabPress}
      variant="floating"
      showLabels={true}
    />
  );
}

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs 
        tabBar={(props) => <ModernTabBar {...props} />}
        screenOptions={{ 
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            href: '/',
          }}
        />
        <Tabs.Screen
          name="maps"
          options={{
            title: 'Maps',
            href: '/maps',
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: 'Community',
            href: '/community',
          }}
        />
        <Tabs.Screen
          name="user"
          options={{
            title: 'Profile',
            href: '/user',
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
