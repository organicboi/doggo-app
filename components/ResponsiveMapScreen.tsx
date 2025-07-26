import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
  Animated,
  Pressable,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Text, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import EnhancedSvgMapMarker from './EnhancedSvgMapMarker';
import MaterialQuickAddModal from './MaterialQuickAddModal';
import PremiumSearchOverlay from './PremiumSearchOverlay';
import EnhancedMapHeader from './EnhancedMapHeader';
import EnhancedDogDetailPanel from './EnhancedDogDetailPanel';
import WalkRequestModal from './WalkRequestModal';
import DogReviewModal from './DogReviewModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Dog {
  id: string;
  name: string;
  breed?: string;
  size?: string;
  latitude: number;
  longitude: number;
  owner_name?: string;
  owner_avatar?: string;
  owner_rating?: number;
  rating_average?: number;
  rating_count?: number;
  distance_km?: number;
  dog_type?: string;
  age_years?: number;
  age_months?: number;
  weight?: number;
  color?: string;
  gender?: string;
  is_vaccinated?: boolean;
  vaccination_date?: string;
  health_conditions?: string;
  special_needs?: string;
  profile_image_url?: string;
  additional_images?: string[];
  contact_info?: string;
  description?: string;

  // Personality & Behavior
  energy_level?: number;
  friendliness?: number;
  playfulness?: number;
  trainability?: number;
  good_with_kids?: boolean;
  good_with_dogs?: boolean;
  good_with_cats?: boolean;

  // Walking & Stats
  total_walks?: number;
  last_walk_date?: string;
  preferred_walk_duration?: number;
  walking_pace?: string;
  leash_trained?: boolean;

  // Location
  is_available_for_walks?: boolean;
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

type FilterType = 'all' | 'dogs' | 'emergencies' | 'stray' | 'owned' | 'rescue';

export default function ResponsiveMapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Core state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedMarker, setSelectedMarker] = useState<Dog | Emergency | null>(null);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDogDetail, setShowDogDetail] = useState(false);
  const [showWalkRequest, setShowWalkRequest] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [trackingMode, setTrackingMode] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const bottomSheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  // Refs
  const mapRef = useRef<MapView>(null);

  // Enhanced filter data
  const filteredData = useMemo(() => {
    let filteredDogs = dogs;
    let filteredEmergencies = emergencies;

    if (activeFilter !== 'all') {
      if (activeFilter === 'dogs') {
        filteredEmergencies = [];
      } else if (activeFilter === 'emergencies') {
        filteredDogs = [];
      } else if (activeFilter === 'stray') {
        filteredDogs = dogs.filter((dog) => dog.dog_type === 'stray');
        filteredEmergencies = [];
      } else if (activeFilter === 'rescue') {
        filteredDogs = dogs.filter((dog) => dog.dog_type === 'rescue');
        filteredEmergencies = [];
      } else if (activeFilter === 'owned') {
        filteredDogs = dogs.filter((dog) => dog.dog_type === 'owned');
        filteredEmergencies = [];
      }
    }

    if (searchQuery) {
      filteredDogs = filteredDogs.filter(
        (dog) =>
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
        Alert.alert(
          'Permission denied',
          'Location permission is required to show your position on the map.'
        );
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

      // Process dogs data
      const validDogs = (dogsData || [])
        .filter(
          (dog: any) =>
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
          ),
          // Add default values for enhanced features
          rating_average: dog.rating_average || 4.5,
          rating_count: dog.rating_count || 10,
          total_walks: dog.total_walks || 15,
          energy_level: dog.energy_level || 3,
          friendliness: dog.friendliness || 4,
          playfulness: dog.playfulness || 3,
          trainability: dog.trainability || 4,
          good_with_kids: dog.good_with_kids ?? true,
          good_with_dogs: dog.good_with_dogs ?? true,
          good_with_cats: dog.good_with_cats ?? false,
          is_available_for_walks: dog.is_available_for_walks ?? true,
          preferred_walk_duration: dog.preferred_walk_duration || 30,
          walking_pace: dog.walking_pace || 'moderate',
          leash_trained: dog.leash_trained ?? true,
          is_vaccinated: dog.is_vaccinated ?? true,
        }))
        .filter((dog) => dog.distance_km <= 50)
        .sort((a, b) => a.distance_km - b.distance_km);

      // Process emergencies data
      const validEmergencies = (emergenciesData || [])
        .filter(
          (emergency: any) =>
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
          ),
        }))
        .filter((emergency) => emergency.distance_km <= 50)
        .sort((a, b) => a.distance_km - b.distance_km);

      console.log(
        `✅ Set ${validDogs.length} valid dogs and ${validEmergencies.length} emergencies`
      );
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
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Enhanced interaction handlers
  const handleMarkerPress = async (item: Dog | Emergency) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if ('name' in item) {
      // It's a dog - show enhanced detail panel
      setSelectedDog(item as Dog);
      setShowDogDetail(true);
    } else {
      // It's an emergency - show bottom sheet
      setSelectedMarker(item);
      setShowBottomSheet(true);

      Animated.spring(bottomSheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
        velocity: 0,
      }).start();
    }
  };

  const closeBottomSheet = () => {
    Animated.timing(bottomSheetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowBottomSheet(false);
      setSelectedMarker(null);
    });
  };

  const handleFilterPress = async (filter: FilterType) => {
    if (filter !== activeFilter) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveFilter(filter);
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

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches((prev) => [query, ...prev.slice(0, 4)]);
    }
  };

  // Enhanced dog interaction handlers
  const handleWalkRequest = (dogId: string) => {
    const dog = dogs.find((d) => d.id === dogId);
    if (dog) {
      setSelectedDog(dog);
      setShowDogDetail(false);
      setShowWalkRequest(true);
    }
  };

  const handleReviewPress = (dogId: string) => {
    const dog = dogs.find((d) => d.id === dogId);
    if (dog) {
      setSelectedDog(dog);
      setShowDogDetail(false);
      setShowReviewModal(true);
    }
  };

  const handleContactOwner = (contactInfo: string) => {
    Alert.alert('Contact Owner', 'How would you like to contact the owner?', [
      {
        text: 'Call',
        onPress: () => {
          const phoneUrl = `tel:${contactInfo}`;
          Linking.openURL(phoneUrl);
        },
      },
      {
        text: 'Text',
        onPress: () => {
          const smsUrl = `sms:${contactInfo}`;
          Linking.openURL(smsUrl);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleWalkRequestSubmit = (walkRequest: any) => {
    Alert.alert(
      'Walk Request Sent!',
      `Your walk request for ${selectedDog?.name} has been sent to the owner. They will be notified and can accept or decline your request.`,
      [{ text: 'OK' }]
    );
    // Here you would typically send the request to your backend
    console.log('Walk request submitted:', walkRequest);
  };

  const handleReviewSubmit = (review: any) => {
    Alert.alert(
      'Review Submitted!',
      `Thank you for reviewing ${selectedDog?.name}. Your review helps other dog walkers make informed decisions.`,
      [{ text: 'OK' }]
    );
    // Here you would typically send the review to your backend
    console.log('Review submitted:', review);
  };

  if (loading && !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#10b981', '#059669']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading PawPals Map...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={userLocation || undefined}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        onLongPress={(event) => {
          const { coordinate } = event.nativeEvent;
          setSelectedMapLocation(coordinate);
          setShowQuickAddModal(true);
        }}>
        {/* Dog markers */}
        {filteredData.dogs.map((dog) => (
          <Marker
            key={`dog-${dog.id}`}
            coordinate={{
              latitude: dog.latitude,
              longitude: dog.longitude,
            }}
            onPress={() => handleMarkerPress(dog)}>
            <EnhancedSvgMapMarker dog={dog} />
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
            onPress={() => handleMarkerPress(emergency)}>
            <EnhancedSvgMapMarker emergency={emergency} />
          </Marker>
        ))}
      </MapView>

      {/* Enhanced Map Header */}
      <EnhancedMapHeader
        paddingTop={insets.top}
        dogCount={filteredData.dogs.length}
        strayCount={filteredData.dogs.filter((dog) => dog.dog_type === 'stray').length}
        rescueCount={filteredData.dogs.filter((dog) => dog.dog_type === 'rescue').length}
        ownedCount={filteredData.dogs.filter((dog) => dog.dog_type === 'owned').length}
        emergencyCount={filteredData.emergencies.length}
        activeFilter={activeFilter}
        onFilterPress={handleFilterPress}
        searchQuery={searchQuery}
        onSearchPress={() => setShowSearchOverlay(true)}
      />

      {/* Streamlined Floating Controls */}
      <View style={[styles.streamlinedControls, { bottom: insets.bottom + 100 }]}>
        {/* Compact Control Strip */}
        <View style={styles.controlStrip}>
          <BlurView intensity={90} tint="light" style={styles.controlBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(248,250,252,0.8)']}
              style={styles.controlsRow}>
              <Pressable
                style={[styles.miniControl, { backgroundColor: '#10b981' }]}
                onPress={centerOnUser}>
                <MaterialIcons name="my-location" size={16} color="white" />
              </Pressable>

              <Pressable
                style={[
                  styles.miniControl,
                  {
                    backgroundColor: trackingMode ? '#ef4444' : '#3b82f6',
                  },
                ]}
                onPress={() => setTrackingMode(!trackingMode)}>
                <MaterialIcons
                  name={trackingMode ? 'location-off' : 'location-on'}
                  size={16}
                  color="white"
                />
              </Pressable>

              <Pressable
                style={[styles.miniControl, { backgroundColor: '#f59e0b' }]}
                onPress={refreshData}>
                <MaterialIcons name="refresh" size={16} color="white" />
              </Pressable>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Enhanced Add Button */}
        <Animated.View style={[{ transform: [{ scale: fabScale }] }]}>
          <Pressable
            style={styles.enhancedFab}
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
            }}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.fabContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <MaterialIcons name="add" size={24} color="white" />
              <Text style={styles.fabLabel}>Add Dog</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* Enhanced Dog Detail Panel */}
      <EnhancedDogDetailPanel
        visible={showDogDetail}
        dog={selectedDog}
        onClose={() => setShowDogDetail(false)}
        onWalkRequest={handleWalkRequest}
        onReviewPress={handleReviewPress}
        onContactOwner={handleContactOwner}
      />

      {/* Walk Request Modal */}
      <WalkRequestModal
        visible={showWalkRequest}
        dog={selectedDog}
        onClose={() => setShowWalkRequest(false)}
        onSubmit={handleWalkRequestSubmit}
      />

      {/* Review Modal */}
      <DogReviewModal
        visible={showReviewModal}
        dog={selectedDog}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
      />

      {/* Emergency Bottom Sheet (for non-dog markers) */}
      {showBottomSheet && !('name' in (selectedMarker || {})) && (
        <Animated.View
          style={[
            styles.improvedBottomSheet,
            {
              bottom: insets.bottom + 16,
              transform: [{ translateY: bottomSheetTranslateY }],
            },
          ]}>
          <BlurView intensity={95} tint="light" style={styles.bottomSheetBlur}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.9)']}
              style={styles.bottomSheetContent}>
              <View style={styles.sheetHandle} />
              <Pressable style={styles.sheetCloseButton} onPress={closeBottomSheet}>
                <MaterialIcons name="close" size={16} color="#6b7280" />
              </Pressable>

              <View style={styles.sheetBody}>
                {selectedMarker && 'emergency_type' in selectedMarker && (
                  <>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>
                          {selectedMarker.emergency_type?.replace('_', ' ').toUpperCase()} EMERGENCY
                        </Text>
                        <Text style={styles.itemSubtitle}>
                          {selectedMarker.distance_km?.toFixed(1)}km away
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.severityIndicator,
                          {
                            backgroundColor:
                              selectedMarker.severity === 'high'
                                ? '#ef4444'
                                : selectedMarker.severity === 'medium'
                                  ? '#f59e0b'
                                  : '#10b981',
                          },
                        ]}>
                        <Text style={styles.severityLabel}>{selectedMarker.severity}</Text>
                      </View>
                    </View>

                    <Text style={styles.description}>{selectedMarker.description}</Text>

                    <View style={styles.quickActions}>
                      <Pressable style={[styles.quickAction, { backgroundColor: '#ef4444' }]}>
                        <MaterialIcons name="phone" size={16} color="white" />
                        <Text style={styles.actionText}>Call</Text>
                      </Pressable>
                      <Pressable style={[styles.quickAction, { backgroundColor: '#10b981' }]}>
                        <MaterialIcons name="volunteer-activism" size={16} color="white" />
                        <Text style={styles.actionText}>Help</Text>
                      </Pressable>
                      <Pressable style={[styles.quickAction, { backgroundColor: '#3b82f6' }]}>
                        <MaterialIcons name="directions" size={16} color="white" />
                        <Text style={styles.actionText}>Navigate</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      )}

      {/* Search Overlay */}
      <PremiumSearchOverlay
        visible={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
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
    backgroundColor: 'transparent',
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

  // Compact Header Styles
  compactHeader: {
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
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
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
  compactStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statCount: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  statText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    opacity: 0.9,
  },

  // Enhanced Search Bar
  enhancedSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
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

  // Compact Filters
  compactFilters: {
    gap: 6,
    paddingRight: 16,
  },
  compactFilterChip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(209,213,219,0.8)',
  },
  activeFilterChip: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeFilterText: {
    color: 'white',
  },

  // Streamlined Controls
  streamlinedControls: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  controlStrip: {
    alignItems: 'flex-start',
  },
  controlBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  miniControl: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // Enhanced FAB
  enhancedFab: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  fabLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },

  // Improved Bottom Sheet
  improvedBottomSheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 240,
  },
  bottomSheetBlur: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomSheetContent: {
    flex: 1,
    paddingTop: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  severityIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  severityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  sheetCloseButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
