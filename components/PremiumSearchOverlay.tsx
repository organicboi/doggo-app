import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumSearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResultSelect?: (result: SearchResult) => void;
  recentSearches?: string[];
  onClearRecent?: () => void;
}

interface SearchResult {
  id: string;
  type: 'dog' | 'breed' | 'location' | 'emergency';
  title: string;
  subtitle?: string;
  distance?: string;
  icon: string;
  iconColor: string;
}

const popularSearches = [
  'Golden Retriever',
  'Labrador',
  'German Shepherd',
  'Bulldog',
  'Beagle',
  'Stray dogs nearby',
  'Emergency alerts',
  'Dog parks',
  'Pet friendly places',
];

const quickFilters = [
  { id: 'nearby', label: '📍 Nearby', icon: 'location-on', color: '#10b981' },
  { id: 'stray', label: '🏠 Strays', icon: 'pets', color: '#f59e0b' },
  { id: 'emergency', label: '🚨 Alerts', icon: 'warning', color: '#ef4444' },
  { id: 'vaccinated', label: '💉 Vaccinated', icon: 'health-and-safety', color: '#3b82f6' },
  { id: 'friendly', label: '😊 Friendly', icon: 'favorite', color: '#ec4899' },
];

export default function PremiumSearchOverlay({
  visible,
  onClose,
  searchQuery,
  onSearchChange,
  onResultSelect,
  recentSearches = [],
  onClearRecent,
}: PremiumSearchOverlayProps) {
  const [inputFocused, setInputFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
  const searchBarScale = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Show overlay
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnimation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(searchBarScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        inputRef.current?.focus();
      });
    } else {
      // Hide overlay
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnimation, {
          toValue: -SCREEN_HEIGHT,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    // Simulate search results based on query
    if (searchQuery.length > 0) {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'dog' as const,
          title: 'Buddy',
          subtitle: 'Golden Retriever • 2.3km away',
          distance: '2.3km',
          icon: 'pets',
          iconColor: '#10b981',
        },
        {
          id: '2',
          type: 'breed' as const,
          title: 'Golden Retriever',
          subtitle: '12 dogs found nearby',
          icon: 'search',
          iconColor: '#3b82f6',
        },
        {
          id: '3',
          type: 'location' as const,
          title: 'Central Park Dog Area',
          subtitle: 'Dog-friendly zone • 1.8km away',
          distance: '1.8km',
          icon: 'place',
          iconColor: '#f59e0b',
        },
      ].filter(
        (result) =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(mockResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleResultPress = async (result: SearchResult) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onResultSelect?.(result);
    onClose();
  };

  const handleQuickFilterPress = async (filter: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSearchChange(filter.label.replace(/[^\w\s]/gi, '').trim());
  };

  const handleRecentPress = async (search: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSearchChange(search);
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" translucent />

      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(0,0,0,0.6)',
            opacity: overlayOpacity,
          },
        ]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnimation }],
          },
        ]}>
        <BlurView intensity={95} tint="light" style={styles.contentBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
            style={styles.contentGradient}>
            {/* Header */}
            <View style={styles.header}>
              {/* Enhanced Search Bar */}
              <Animated.View
                style={[
                  styles.searchBarContainer,
                  {
                    transform: [{ scale: searchBarScale }],
                  },
                ]}>
                <View style={styles.searchBar}>
                  <MaterialIcons name="search" size={24} color="#10b981" />
                  <TextInput
                    ref={inputRef}
                    style={styles.searchInput}
                    placeholder="Search dogs, breeds, locations..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => onSearchChange('')} style={styles.clearButton}>
                      <MaterialIcons name="close" size={20} color="#9ca3af" />
                    </Pressable>
                  )}
                </View>
              </Animated.View>

              {/* Close Button */}
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <MaterialIcons name="keyboard-arrow-down" size={28} color="#6b7280" />
              </Pressable>
            </View>

            {/* Content */}
            <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Quick Filters */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🔍 Quick Filters</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickFiltersContainer}>
                    {quickFilters.map((filter) => (
                      <Pressable
                        key={filter.id}
                        style={[styles.quickFilter, { borderColor: `${filter.color}30` }]}
                        onPress={() => handleQuickFilterPress(filter)}>
                        <MaterialIcons name={filter.icon as any} size={20} color={filter.color} />
                        <Text style={[styles.quickFilterText, { color: filter.color }]}>
                          {filter.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎯 Search Results</Text>
                    {searchResults.map((result, index) => (
                      <Pressable
                        key={result.id}
                        style={[
                          styles.resultItem,
                          index === searchResults.length - 1 && styles.resultItemLast,
                        ]}
                        onPress={() => handleResultPress(result)}>
                        <View
                          style={[styles.resultIcon, { backgroundColor: `${result.iconColor}15` }]}>
                          <MaterialIcons
                            name={result.icon as any}
                            size={24}
                            color={result.iconColor}
                          />
                        </View>
                        <View style={styles.resultContent}>
                          <Text style={styles.resultTitle}>{result.title}</Text>
                          {result.subtitle && (
                            <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                          )}
                        </View>
                        <View style={styles.resultActions}>
                          {result.distance && (
                            <View style={styles.distanceChip}>
                              <Text style={styles.distanceText}>{result.distance}</Text>
                            </View>
                          )}
                          <MaterialIcons name="arrow-forward-ios" size={16} color="#d1d5db" />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && searchQuery.length === 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>⏱️ Recent Searches</Text>
                      <Pressable onPress={onClearRecent}>
                        <Text style={styles.clearText}>Clear</Text>
                      </Pressable>
                    </View>
                    {recentSearches.map((search, index) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.recentItem,
                          index === recentSearches.length - 1 && styles.recentItemLast,
                        ]}
                        onPress={() => handleRecentPress(search)}>
                        <MaterialIcons name="history" size={20} color="#9ca3af" />
                        <Text style={styles.recentText}>{search}</Text>
                        <MaterialIcons name="north-west" size={16} color="#d1d5db" />
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Popular Searches */}
                {searchQuery.length === 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔥 Popular Searches</Text>
                    <View style={styles.popularContainer}>
                      {popularSearches.map((search, index) => (
                        <Pressable
                          key={index}
                          style={styles.popularChip}
                          onPress={() => handleRecentPress(search)}>
                          <Text style={styles.popularText}>{search}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
    zIndex: 1000,
  },
  contentBlur: {
    flex: 1,
    borderRadius: 0,
  },
  contentGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchBarContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'rgba(16,185,129,0.2)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107,114,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  quickFiltersContainer: {
    paddingRight: 20,
    gap: 12,
  },
  quickFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,231,235,0.5)',
    gap: 16,
  },
  resultItemLast: {
    borderBottomWidth: 0,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceChip: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,231,235,0.3)',
    gap: 12,
  },
  recentItemLast: {
    borderBottomWidth: 0,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  popularContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularChip: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  popularText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
});
