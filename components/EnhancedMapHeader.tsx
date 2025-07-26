import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import { ownedDogSvg } from '../assets/svg-strings/ownedDogSvg';
import { rescueDogSvg } from '../assets/svg-strings/rescueDogSvg';
import { strayDogSvg } from '../assets/svg-strings/strayDogSvg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterType = 'all' | 'dogs' | 'emergencies' | 'stray' | 'owned' | 'rescue';

interface EnhancedMapHeaderProps {
  paddingTop: number;
  dogCount: number;
  strayCount: number;
  rescueCount: number;
  ownedCount: number;
  emergencyCount: number;
  activeFilter: FilterType;
  onFilterPress: (filter: FilterType) => void;
  searchQuery: string;
  onSearchPress: () => void;
}

export default function EnhancedMapHeader({
  paddingTop,
  dogCount,
  strayCount,
  rescueCount,
  ownedCount,
  emergencyCount,
  activeFilter,
  onFilterPress,
  searchQuery,
  onSearchPress,
}: EnhancedMapHeaderProps) {
  const theme = useTheme();
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const legendHeight = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleLegend = () => {
    const toValue = isLegendExpanded ? 0 : 1;

    Animated.parallel([
      Animated.spring(legendHeight, {
        toValue: toValue * 200, // Height of legend content
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(rotateAnim, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    setIsLegendExpanded(!isLegendExpanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const FilterChip = ({
    filter,
    label,
    count,
    icon,
    svgIcon,
  }: {
    filter: FilterType;
    label: string;
    count: number;
    icon?: string;
    svgIcon?: string;
  }) => (
    <Pressable
      onPress={() => onFilterPress(filter)}
      style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}>
      <BlurView intensity={activeFilter === filter ? 95 : 80} tint="light" style={styles.chipBlur}>
        <LinearGradient
          colors={
            activeFilter === filter
              ? ['#10b981', '#059669']
              : ['rgba(255,255,255,0.9)', 'rgba(248,250,252,0.8)']
          }
          style={styles.chipContent}>
          <View style={styles.chipIcon}>
            {svgIcon ? (
              <SvgXml
                xml={svgIcon}
                width={16}
                height={16}
                color={activeFilter === filter ? 'white' : '#6b7280'}
              />
            ) : (
              <MaterialIcons
                name={icon as any}
                size={16}
                color={activeFilter === filter ? 'white' : '#6b7280'}
              />
            )}
          </View>
          <Text style={[styles.chipText, activeFilter === filter && styles.activeChipText]}>
            {label}
          </Text>
          {count > 0 && (
            <View
              style={[
                styles.chipBadge,
                { backgroundColor: activeFilter === filter ? 'rgba(255,255,255,0.3)' : '#10b981' },
              ]}>
              <Text
                style={[
                  styles.chipBadgeText,
                  { color: activeFilter === filter ? 'white' : 'white' },
                ]}>
                {count}
              </Text>
            </View>
          )}
        </LinearGradient>
      </BlurView>
    </Pressable>
  );

  const LegendItem = ({
    svgContent,
    label,
    count,
    color,
    description,
  }: {
    svgContent?: string;
    label: string;
    count: number;
    color: string;
    description: string;
  }) => (
    <View style={styles.legendItem}>
      <View style={styles.legendIcon}>
        {svgContent ? (
          <View style={[styles.legendSvgContainer, { borderColor: color }]}>
            <SvgXml xml={svgContent} width={20} height={20} />
          </View>
        ) : (
          <View style={[styles.emergencyIcon, { backgroundColor: color }]}>
            <MaterialIcons name="warning" size={12} color="white" />
          </View>
        )}
      </View>
      <View style={styles.legendContent}>
        <View style={styles.legendItemHeader}>
          <Text style={styles.legendLabel}>{label}</Text>
          <View style={[styles.legendCountBadge, { backgroundColor: color }]}>
            <Text style={styles.legendCountText}>{count}</Text>
          </View>
        </View>
        <Text style={styles.legendDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: paddingTop + 8 }]}>
      <BlurView intensity={90} tint="light" style={styles.headerBlur}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.90)']}
          style={styles.headerContent}>
          {/* Top Row - Title and Legend Toggle */}
          <View style={styles.topRow}>
            <View style={styles.titleSection}>
              <View style={styles.appIcon}>
                <Text style={styles.iconEmoji}>🐾</Text>
              </View>
              <View style={styles.titleText}>
                <Text style={styles.appName}>PawPals</Text>
                <Text style={styles.tagline}>Find & Help Dogs</Text>
              </View>
            </View>

            <Pressable onPress={toggleLegend} style={styles.legendToggle}>
              <View style={styles.statsPreview}>
                <Text style={styles.statsText}>{dogCount} Dogs</Text>
                {emergencyCount > 0 && (
                  <Text style={[styles.statsText, { color: '#ef4444' }]}>
                    {emergencyCount} Alerts
                  </Text>
                )}
              </View>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <MaterialIcons name="expand-more" size={20} color="#6b7280" />
              </Animated.View>
            </Pressable>
          </View>

          {/* Enhanced Search Bar */}
          <Pressable style={styles.searchBar} onPress={onSearchPress}>
            <View style={styles.searchIcon}>
              <MaterialIcons name="search" size={20} color="#10b981" />
            </View>
            <Text style={styles.searchText}>
              {searchQuery || '🔍 Search dogs, breeds, locations...'}
            </Text>
            <View style={styles.voiceIcon}>
              <MaterialIcons name="mic" size={18} color="#6b7280" />
            </View>
          </Pressable>

          {/* Enhanced Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}>
            <FilterChip filter="all" label="All" count={dogCount + emergencyCount} icon="apps" />
            <FilterChip filter="stray" label="Stray" count={strayCount} svgIcon={strayDogSvg} />
            <FilterChip filter="rescue" label="Rescue" count={rescueCount} svgIcon={rescueDogSvg} />
            <FilterChip filter="owned" label="Owned" count={ownedCount} svgIcon={ownedDogSvg} />
            {emergencyCount > 0 && (
              <FilterChip
                filter="emergencies"
                label="Alerts"
                count={emergencyCount}
                icon="warning"
              />
            )}
          </ScrollView>

          {/* Expandable Legend */}
          <Animated.View
            style={[
              styles.legendContainer,
              {
                height: legendHeight,
                opacity: legendHeight.interpolate({
                  inputRange: [0, 200],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
              },
            ]}>
            <View style={styles.legendContent}>
              <View style={styles.legendHeader}>
                <Text style={styles.legendTitle}>Map Legend</Text>
                <Text style={styles.legendSubtitle}>Tap markers to learn more</Text>
              </View>

              <View style={styles.legendItems}>
                <LegendItem
                  svgContent={strayDogSvg}
                  label="Stray Dogs"
                  count={strayCount}
                  color="#f59e0b"
                  description="Need help & care"
                />

                <LegendItem
                  svgContent={rescueDogSvg}
                  label="Rescue Dogs"
                  count={rescueCount}
                  color="#ef4444"
                  description="Available for adoption"
                />

                <LegendItem
                  svgContent={ownedDogSvg}
                  label="Owned Dogs"
                  count={ownedCount}
                  color="#10b981"
                  description="Happy with families"
                />

                {emergencyCount > 0 && (
                  <LegendItem
                    label="Emergency Alerts"
                    count={emergencyCount}
                    color="#dc2626"
                    description="Urgent help needed"
                  />
                )}
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 12,
  },
  headerBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconEmoji: {
    fontSize: 18,
  },
  titleText: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    lineHeight: 24,
  },
  tagline: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 14,
  },
  legendToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statsPreview: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    lineHeight: 12,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.2)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  voiceIcon: {
    padding: 2,
  },

  // Enhanced Filter Chips
  filtersContainer: {
    gap: 8,
    paddingRight: 16,
    marginBottom: 8,
  },
  filterChip: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeFilterChip: {
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  chipBlur: {
    borderRadius: 16,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chipIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeChipText: {
    color: 'white',
  },
  chipBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  chipBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Legend
  legendContainer: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(209,213,219,0.3)',
    marginTop: 8,
  },
  legendContent: {
    paddingTop: 12,
  },
  legendHeader: {
    marginBottom: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  legendSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendSvgContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  emergencyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  legendCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  legendCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
  },
  legendDescription: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 12,
  },
});
