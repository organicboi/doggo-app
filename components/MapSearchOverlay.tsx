import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SearchResult {
  id: string;
  type: 'dog' | 'emergency' | 'location';
  title: string;
  subtitle: string;
  distance?: number;
  latitude: number;
  longitude: number;
}

interface MapSearchOverlayProps {
  visible: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  onResultSelect: (result: SearchResult) => void;
  recentSearches: string[];
  onClearRecent: () => void;
}

const MapSearchOverlay: React.FC<MapSearchOverlayProps> = ({
  visible,
  searchQuery,
  onSearchChange,
  onClose,
  onResultSelect,
  recentSearches,
  onClearRecent,
}) => {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: -SCREEN_HEIGHT,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsLoading(true);
      // Simulate API search with debounce
      const timer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    // Mock search results - replace with actual API calls
         const mockResults: SearchResult[] = [
       {
         id: '1',
         type: 'dog' as const,
         title: 'Golden Retriever - Max',
         subtitle: 'Friendly dog available for walks',
         distance: 0.8,
         latitude: 18.4482,
         longitude: 73.8993,
       },
       {
         id: '2',
         type: 'emergency' as const,
         title: 'Injured Stray Dog',
         subtitle: 'Critical emergency - needs immediate help',
         distance: 1.2,
         latitude: 18.4500,
         longitude: 73.9000,
       },
       {
         id: '3',
         type: 'location' as const,
         title: 'Phoenix Mall',
         subtitle: 'Shopping center with pet-friendly areas',
         distance: 2.5,
         latitude: 18.4600,
         longitude: 73.9100,
       },
     ].filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(mockResults);
    setIsLoading(false);
  };

  const handleResultPress = (result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onResultSelect(result);
    onClose();
  };

  const handleRecentPress = (recent: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSearchChange(recent);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'dog': return 'paw';
      case 'emergency': return 'warning';
      case 'location': return 'location';
      default: return 'search';
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'dog': return '#3b82f6';
      case 'emergency': return '#ef4444';
      case 'location': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <BlurView intensity={95} style={StyleSheet.absoluteFillObject}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                value={searchQuery}
                onChangeText={onSearchChange}
                placeholder="Search dogs, emergencies, locations..."
                style={styles.searchInput}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => onSearchChange('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </Pressable>
              )}
            </View>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {searchQuery.length === 0 && (
              // Recent Searches
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  {recentSearches.length > 0 && (
                    <Pressable onPress={onClearRecent}>
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </Pressable>
                  )}
                </View>
                
                {recentSearches.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color="#d1d5db" />
                    <Text style={styles.emptyStateText}>No recent searches</Text>
                  </View>
                ) : (
                  recentSearches.map((recent, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleRecentPress(recent)}
                      style={styles.recentItem}
                    >
                      <Ionicons name="time-outline" size={16} color="#9ca3af" />
                      <Text style={styles.recentText}>{recent}</Text>
                      <Ionicons name="arrow-up-outline" size={16} color="#9ca3af" />
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {searchQuery.length > 0 && (
              // Search Results
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {isLoading ? 'Searching...' : `Results for "${searchQuery}"`}
                </Text>
                
                                 {isLoading ? (
                   <View style={styles.loadingContainer}>
                     <View style={styles.loadingDot} />
                     <View style={styles.loadingDot} />
                     <View style={styles.loadingDot} />
                   </View>
                ) : suggestions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color="#d1d5db" />
                    <Text style={styles.emptyStateText}>No results found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Try searching for dog names, breeds, or emergency types
                    </Text>
                  </View>
                ) : (
                  suggestions.map((result) => (
                    <Pressable
                      key={result.id}
                      onPress={() => handleResultPress(result)}
                      style={styles.resultItem}
                    >
                      <View style={[styles.resultIcon, { backgroundColor: getResultColor(result.type) + '20' }]}>
                        <Ionicons
                          name={getResultIcon(result.type) as any}
                          size={20}
                          color={getResultColor(result.type)}
                        />
                      </View>
                      
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>{result.title}</Text>
                        <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                      </View>
                      
                      <View style={styles.resultMeta}>
                        {result.distance && (
                          <Text style={styles.distanceText}>
                            {result.distance.toFixed(1)}km
                          </Text>
                        )}
                        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {/* Quick Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Filters</Text>
              <View style={styles.filterContainer}>
                {[
                  { icon: 'paw', label: 'All Dogs', color: '#3b82f6' },
                  { icon: 'warning', label: 'Emergencies', color: '#ef4444' },
                  { icon: 'location', label: 'Nearby', color: '#10b981' },
                  { icon: 'heart', label: 'Favorites', color: '#f59e0b' },
                ].map((filter, index) => (
                  <Pressable key={index} style={styles.filterChip}>
                    <Ionicons name={filter.icon as any} size={16} color={filter.color} />
                    <Text style={[styles.filterText, { color: filter.color }]}>
                      {filter.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  clearAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    marginBottom: 8,
  },
  recentText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    marginBottom: 8,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultMeta: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginHorizontal: 4,
  },
}); 

export default MapSearchOverlay; 