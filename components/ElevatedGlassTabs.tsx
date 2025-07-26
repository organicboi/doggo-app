import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ElevatedGlassTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

interface TabConfig {
  key: string;
  title: string;
  icon: string;
  color: string;
  gradient: [string, string];
  badge?: number;
}

const tabs: TabConfig[] = [
  { key: 'home', title: 'Home', icon: 'home', color: '#1f2937', gradient: ['#1f2937', '#374151'] },
  { key: 'map', title: 'Map', icon: 'map', color: '#10b981', gradient: ['#10b981', '#059669'] },
  { key: 'camera', title: 'Share', icon: 'camera-alt', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'] },
  { key: 'community', title: 'Community', icon: 'groups', color: '#f59e0b', gradient: ['#f59e0b', '#d97706'] },
  { key: 'profile', title: 'Profile', icon: 'person', color: '#6b7280', gradient: ['#6b7280', '#4b5563'] },
];

export default function ElevatedGlassTabs({ activeTab, onTabPress }: ElevatedGlassTabsProps) {
  const insets = useSafeAreaInsets();
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabAnims = useRef(tabs.reduce((acc, t) => { acc[t.key] = { scale: new Animated.Value(1), opacity: new Animated.Value(1) }; return acc; }, {} as any)).current;

  useEffect(() => {
    const index = tabs.findIndex(t => t.key === activeTab);
    Animated.spring(indicatorAnim, { toValue: index * (SCREEN_WIDTH / 5), useNativeDriver: true }).start();
    tabs.forEach(t => {
      const isActive = t.key === activeTab;
      Animated.parallel([
        Animated.spring(tabAnims[t.key].scale, { toValue: isActive ? 1.1 : 0.9, useNativeDriver: true }),
        Animated.timing(tabAnims[t.key].opacity, { toValue: isActive ? 1 : 0.7, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [activeTab]);

  const handlePress = async (key: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(key);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={100} tint="light" style={styles.blurView}>
        <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']} style={styles.gradient}>
          <Animated.View style={[styles.indicator, { transform: [{ translateX: indicatorAnim }], backgroundColor: tabs.find(t => t.key === activeTab)?.color }]} />
          <View style={styles.tabs}>
            {tabs.map(tab => {
              const isActive = tab.key === activeTab;
              return (
                <Pressable key={tab.key} onPress={() => handlePress(tab.key)} style={styles.tab}>
                  <Animated.View style={{ transform: [{ scale: tabAnims[tab.key].scale }], opacity: tabAnims[tab.key].opacity }}>
                    <MaterialIcons name={tab.icon as any} size={24} color={isActive ? tab.color : '#9ca3af'} />
                    <Text style={[styles.label, { color: isActive ? tab.color : '#9ca3af' }]}>{tab.title}</Text>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: 16, 
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurView: { borderRadius: 32, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 }, android: { elevation: 8 } }) },
  gradient: { padding: 12, flexDirection: 'row' },
  indicator: { position: 'absolute', bottom: 0, height: 4, width: SCREEN_WIDTH / 5 - 32, borderRadius: 2 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  tab: { alignItems: 'center', flex: 1 },
  label: { fontSize: 10, marginTop: 4 }
}); 