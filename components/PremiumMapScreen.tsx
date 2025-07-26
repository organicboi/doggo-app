import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
  Pressable,
  StatusBar,
} from 'react-native';
import MapView, { 
  Marker, 
  Region, 
  Heatmap, 
  Circle,
  PROVIDER_GOOGLE 
} from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Text, 
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import EnhancedCustomMapMarker from './EnhancedCustomMapMarker';
import MaterialQuickAddModal from './MaterialQuickAddModal';
import PremiumSearchOverlay from './PremiumSearchOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Dog {
  id: string;
  name: string;
  breed?: string;
  size?: string;
  latitude: number;
  longitude: number;
  owner_name?: string;
  rating_average?: number;
  distance_km?: number;
  dog_type?: string;
  age_years?: number;
  age_months?: number;
  is_vaccinated?: boolean;
  profile_image_url?: string;
  contact_info?: string;
  description?: string;
}

interface Emergency {
  id: string;
  emergency_type: string;
  severity: string;
  description: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  volunteers_needed: number;
  volunteers_responded: number;
  created_at: string;
  contact_info?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type FilterType = 'all' | 'dogs' | 'emergencies' | 'stray' | 'owned';
type MapStyle = 'standard' | 'satellite' | 'hybrid' | 'terrain';

export default function PremiumMapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Core state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Enhanced UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [selectedMarker, setSelectedMarker] = useState<Dog | Emergency | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [trackingMode, setTrackingMode] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const searchBarScale = useRef(new Animated.Value(1)).current;
  const filterChipsTranslateY = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const bottomSheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Refs
  const mapRef = useRef<MapView>(null);

  // Enhanced filter data with better filtering logic
  const filteredData = useMemo(() => {
    let filteredDogs = dogs;
    let filteredEmergencies = emergencies;

    if (activeFilter !== 'all') {
      if (activeFilter === 'dogs') {
        filteredEmergencies = [];
      } else if (activeFilter === 'emergencies') {
        filteredDogs = [];
      } else if (activeFilter === 'stray') {
        filteredDogs = dogs.filter(dog => dog.dog_type === 'stray');
        filteredEmergencies = [];
      } else if (activeFilter === 'owned') {
        filteredDogs = dogs.filter(dog => dog.dog_type === 'owned');
        filteredEmergencies = [];
      }
    }

    if (searchQuery) {
      filteredDogs = filteredDogs.filter(dog => 
        dog.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dog.breed?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return { dogs: filteredDogs, emergencies: filteredEmergencies };
  }, [dogs, emergencies, activeFilter, searchQuery]);

  // Location and data fetching
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your position on the map.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setUserLocation(userLoc);
      fetchDogsAndEmergencies(userLoc);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
  };

  const fetchDogsAndEmergencies = async (location: UserLocation) => {
    console.log('🔄 Loading data for location:', location);
    
    try {
      setLoading(true);
      
      console.log('📡 Loading dogs with direct query...');
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('latitude', 0)
        .neq('longitude', 0)
        .limit(100);

      if (dogsError) {
        console.error('❌ Dogs query error:', dogsError);
        throw dogsError;
      }

      console.log('📡 Loading emergencies...');
      const { data: emergenciesData, error: emergenciesError } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('latitude', 0)
        .neq('longitude', 0);

      if (emergenciesError) {
        console.error('❌ Emergency error:', emergenciesError);
        throw emergenciesError;
      }

      // Process dogs data with distance calculation
      const validDogs = (dogsData || [])
        .filter((dog: any) => 
          dog.latitude != null && 
          dog.longitude != null && 
          typeof dog.latitude === 'number' &&
          typeof dog.longitude === 'number' &&
          dog.latitude !== 0 &&
          dog.longitude !== 0
        )
        .map((dog: any) => ({
          ...dog,
          distance_km: getDistance(
            location.latitude, 
            location.longitude, 
            dog.latitude, 
            dog.longitude
          )
        }))
        .filter(dog => dog.distance_km <= 50) // 50km radius
        .sort((a, b) => a.distance_km - b.distance_km);

      // Process emergencies data
      const validEmergencies = (emergenciesData || [])
        .filter((emergency: any) => 
          emergency.latitude != null && 
          emergency.longitude != null && 
          typeof emergency.latitude === 'number' &&
          typeof emergency.longitude === 'number' &&
          emergency.latitude !== 0 &&
          emergency.longitude !== 0
        )
        .map((emergency: any) => ({
          ...emergency,
          distance_km: getDistance(
            location.latitude, 
            location.longitude, 
            emergency.latitude, 
            emergency.longitude
          )
        }))
        .filter(emergency => emergency.distance_km <= 50) // 50km radius
        .sort((a, b) => a.distance_km - b.distance_km);

      console.log(`✅ Set ${validDogs.length} valid dogs and ${validEmergencies.length} emergencies`);
      setDogs(validDogs);
      setEmergencies(validEmergencies);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load dogs and emergencies data.');
    } finally {
      setLoading(false);
    }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Enhanced interaction handlers
  const handleMarkerPress = async (item: Dog | Emergency) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMarker(item);
    setShowBottomSheet(true);
    
    // Animate bottom sheet
    Animated.spring(bottomSheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const closeBottomSheet = () => {
    Animated.spring(bottomSheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowBottomSheet(false);
      setSelectedMarker(null);
    });
  };

  const handleSearchFocus = () => {
    setShowSearchOverlay(true);
    Animated.parallel([
      Animated.spring(overlayOpacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(searchBarScale, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start();
  };

  const handleSearchBlur = () => {
    Animated.parallel([
      Animated.spring(overlayOpacity, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(searchBarScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start(() => {
      setShowSearchOverlay(false);
    });
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const handleFilterPress = async (filter: FilterType) => {
    if (filter !== activeFilter) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveFilter(filter);
      
      // Animate filter chips
      Animated.sequence([
        Animated.timing(filterChipsTranslateY, {
          toValue: -2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(filterChipsTranslateY, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  const centerOnUser = async () => {
    if (userLocation && mapRef.current) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  const refreshData = async () => {
    if (userLocation) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await fetchDogsAndEmergencies(userLocation);
    }
  };

  if (loading && !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading PawPals Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        mapType={mapStyle}
        initialRegion={userLocation || undefined}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        onLongPress={(event) => {
          const { coordinate } = event.nativeEvent;
          setSelectedMapLocation(coordinate);
          setShowQuickAddModal(true);
        }}
      >
        {/* Dog markers */}
        {filteredData.dogs.map((dog) => (
          <Marker
            key={`dog-${dog.id}`}
            coordinate={{
              latitude: dog.latitude,
              longitude: dog.longitude,
            }}
            onPress={() => handleMarkerPress(dog)}
          >
            <EnhancedCustomMapMarker dog={dog} />
          </Marker>
        ))}

        {/* Emergency markers */}
        {filteredData.emergencies.map((emergency) => (
          <Marker
            key={`emergency-${emergency.id}`}
            coordinate={{
              latitude: emergency.latitude,
              longitude: emergency.longitude,
            }}
            onPress={() => handleMarkerPress(emergency)}
          >
            <EnhancedCustomMapMarker emergency={emergency} />
          </Marker>
        ))}
      </MapView>

      {/* Premium Header with Glassmorphism */}
      <Animated.View 
        style={[
          styles.header,
          { 
            paddingTop: insets.top + 10,
            opacity: headerOpacity,
          }
        ]}
      >
        <BlurView intensity={95} tint="light" style={styles.headerBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.headerGradient}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <View style={styles.titleContainer}>
                <Text style={styles.mainTitle}>🐾 PawPals</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statChip}>
                    <Text style={styles.statNumber}>{filteredData.dogs.length}</Text>
                    <Text style={styles.statLabel}>Dogs</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text style={[styles.statNumber, { color: '#ef4444' }]}>{filteredData.emergencies.length}</Text>
                    <Text style={styles.statLabel}>Alerts</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Premium Search Bar */}
            <Animated.View 
              style={[
                styles.searchContainer,
                { transform: [{ scale: searchBarScale }] }
              ]}
            >
              <Pressable 
                style={styles.searchBar}
                onPress={handleSearchFocus}
              >
                <MaterialIcons name="search" size={24} color="#666" />
                <Text style={styles.searchPlaceholder}>
                  {searchQuery || "🔍 Search dogs, breeds..."}
                </Text>
                <View style={styles.searchActions}>
                  <Pressable style={styles.voiceButton}>
                    <MaterialIcons name="mic" size={20} color="#666" />
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>

            {/* Enhanced Filter Chips */}
            <Animated.View 
              style={[
                styles.filterContainer,
                { transform: [{ translateY: filterChipsTranslateY }] }
              ]}
            >
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                {(['all', 'dogs', 'emergencies', 'stray', 'owned'] as FilterType[]).map((filter) => (
                  <Pressable
                    key={filter}
                    onPress={() => handleFilterPress(filter)}
                    style={[
                      styles.filterChip,
                      activeFilter === filter && styles.filterChipActive
                    ]}
                  >
                    <Text style={[
                      styles.filterChipText,
                      activeFilter === filter && styles.filterChipTextActive
                    ]}>
                      {filter === 'all' ? '🌟 All' :
                       filter === 'dogs' ? '🐕 Dogs' :
                       filter === 'emergencies' ? '🚨 Alerts' :
                       filter === 'stray' ? '🏠 Strays' : '👨‍👩‍👧‍👦 Owned'}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Premium Floating Action Controls */}
      <View style={[styles.floatingControls, { bottom: insets.bottom + 100 }]}>
        {/* Left side controls */}
        <View style={styles.leftControls}>
          <BlurView intensity={95} tint="light" style={styles.controlGroup}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
              style={styles.controlGroupGradient}
            >
              <Pressable 
                style={[styles.controlButton, { backgroundColor: '#10b981' }]}
                onPress={centerOnUser}
              >
                <MaterialIcons name="my-location" size={20} color="white" />
              </Pressable>
              
              <Pressable 
                style={[styles.controlButton, { 
                  backgroundColor: trackingMode ? '#ef4444' : '#3b82f6',
                  marginTop: 8
                }]}
                onPress={() => setTrackingMode(!trackingMode)}
              >
                <MaterialIcons 
                  name={trackingMode ? 'location-off' : 'location-on'} 
                  size={20} 
                  color="white" 
                />
              </Pressable>
              
              <Pressable 
                style={[styles.controlButton, { 
                  backgroundColor: '#f59e0b',
                  marginTop: 8
                }]}
                onPress={refreshData}
              >
                <MaterialIcons name="refresh" size={20} color="white" />
              </Pressable>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Right side - Premium Add Button */}
        <View style={styles.rightControls}>
          <Animated.View style={[{ transform: [{ scale: fabScale }] }]}>
            <Pressable 
              style={styles.premiumFab}
              onPress={() => setShowQuickAddModal(true)}
              onPressIn={() => {
                Animated.spring(fabScale, {
                  toValue: 0.95,
                  useNativeDriver: true,
                  tension: 300,
                  friction: 10,
                }).start();
              }}
              onPressOut={() => {
                Animated.spring(fabScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  tension: 300,
                  friction: 10,
                }).start();
              }}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.fabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="add" size={28} color="white" />
                <Text style={styles.fabText}>Add</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Premium Bottom Sheet */}
      {showBottomSheet && selectedMarker && (
        <Animated.View 
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: bottomSheetTranslateY }],
              bottom: insets.bottom,
            }
          ]}
        >
          <BlurView intensity={95} tint="light" style={styles.bottomSheetBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.bottomSheetGradient}
            >
              {/* Handle */}
              <View style={styles.bottomSheetHandle} />
              
              {/* Content */}
              <View style={styles.bottomSheetContent}>
                {'name' in selectedMarker ? (
                  // Dog content
                  <>
                    <View style={styles.bottomSheetHeader}>
                      <View style={styles.dogInfo}>
                        <Text style={styles.bottomSheetTitle}>{selectedMarker.name}</Text>
                        <Text style={styles.bottomSheetSubtitle}>
                          {selectedMarker.breed} • {selectedMarker.distance_km?.toFixed(1)}km away
                        </Text>
                      </View>
                      <View style={styles.dogTypeChip}>
                        <Text style={styles.dogTypeText}>
                          {selectedMarker.dog_type === 'stray' ? '🏠 Stray' : '👨‍👩‍👧‍👦 Owned'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.bottomSheetActions}>
                      <Pressable style={styles.actionButton}>
                        <MaterialIcons name="directions" size={20} color="#10b981" />
                        <Text style={styles.actionButtonText}>Navigate</Text>
                      </Pressable>
                      <Pressable style={styles.actionButton}>
                        <MaterialIcons name="favorite-border" size={20} color="#ef4444" />
                        <Text style={styles.actionButtonText}>Save</Text>
                      </Pressable>
                      <Pressable style={styles.actionButton}>
                        <MaterialIcons name="share" size={20} color="#3b82f6" />
                        <Text style={styles.actionButtonText}>Share</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  // Emergency content
                  <>
                    <View style={styles.bottomSheetHeader}>
                      <View style={styles.emergencyInfo}>
                        <Text style={styles.bottomSheetTitle}>🚨 {selectedMarker.emergency_type}</Text>
                        <Text style={styles.bottomSheetSubtitle}>
                          {selectedMarker.severity} • {selectedMarker.distance_km?.toFixed(1)}km away
                        </Text>
                      </View>
                      <View style={[styles.severityChip, { 
                        backgroundColor: selectedMarker.severity === 'high' ? '#ef4444' : 
                                        selectedMarker.severity === 'medium' ? '#f59e0b' : '#10b981'
                      }]}>
                        <Text style={styles.severityText}>{selectedMarker.severity}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.emergencyDescription}>{selectedMarker.description}</Text>
                    
                    <View style={styles.bottomSheetActions}>
                      <Pressable style={[styles.actionButton, styles.primaryAction]}>
                        <MaterialIcons name="volunteer-activism" size={20} color="white" />
                        <Text style={[styles.actionButtonText, { color: 'white' }]}>Help</Text>
                      </Pressable>
                      <Pressable style={styles.actionButton}>
                        <MaterialIcons name="call" size={20} color="#10b981" />
                        <Text style={styles.actionButtonText}>Call</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </LinearGradient>
          </BlurView>
          
          {/* Close button */}
          <Pressable 
            style={styles.closeButton}
            onPress={closeBottomSheet}
          >
            <MaterialIcons name="close" size={24} color="#666" />
          </Pressable>
        </Animated.View>
      )}

      {/* Premium Search Overlay */}
      <PremiumSearchOverlay
        visible={showSearchOverlay}
        onClose={handleSearchBlur}
        searchQuery={searchQuery}
        onSearchChange={handleSearchQueryChange}
        recentSearches={recentSearches}
        onClearRecent={() => setRecentSearches([])}
      />

      {/* Quick Add Modal */}
      <MaterialQuickAddModal
        visible={showQuickAddModal}
        onClose={() => {
          setShowQuickAddModal(false);
          setSelectedMapLocation(null);
        }}
        userLocation={userLocation}
        selectedLocation={selectedMapLocation}
        onSuccess={refreshData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBlur: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: -2,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceButton: {
    padding: 4,
  },
  filterContainer: {
    marginTop: 4,
  },
  filterScrollContent: {
    paddingRight: 20,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(107,114,128,0.2)',
  },
  filterChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  floatingControls: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  leftControls: {
    alignItems: 'flex-start',
  },
  controlGroup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  controlGroupGradient: {
    padding: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rightControls: {
    alignItems: 'flex-end',
  },
  premiumFab: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 280,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomSheetBlur: {
    flex: 1,
  },
  bottomSheetGradient: {
    flex: 1,
    paddingTop: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dogInfo: {
    flex: 1,
  },
  emergencyInfo: {
    flex: 1,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  bottomSheetSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  dogTypeChip: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  dogTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  severityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
  emergencyDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  bottomSheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(107,114,128,0.2)',
    gap: 6,
  },
  primaryAction: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
}); 