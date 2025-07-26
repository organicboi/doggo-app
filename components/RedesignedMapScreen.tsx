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
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Text, useTheme, ActivityIndicator, Card, IconButton } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import EnhancedCustomMapMarker from './EnhancedCustomMapMarker';
import MaterialQuickAddModal from './MaterialQuickAddModal';
import PremiumSearchOverlay from './PremiumSearchOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'android' ? 120 : 110;

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

export default function RedesignedMapScreen() {
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
  const [showBottomSheet, setShowBottomSheet] = useState(false);
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
    setSelectedMarker(item);
    setShowBottomSheet(true);

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
    <View style={styles.container}>
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
            onPress={() => handleMarkerPress(emergency)}>
            <EnhancedCustomMapMarker emergency={emergency} />
          </Marker>
        ))}
      </MapView>

      {/* Redesigned Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Card style={styles.headerCard} elevation={4}>
          <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.headerGradient}>
            {/* Title and Stats Row */}
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.appTitle}>🐾 PawPals</Text>
                <Text style={styles.subtitle}>Find & Help Dogs</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statBadge, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.statNumber}>{filteredData.dogs.length}</Text>
                  <Text style={styles.statLabel}>Dogs</Text>
                </View>
                <View style={[styles.statBadge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.statNumber}>{filteredData.emergencies.length}</Text>
                  <Text style={styles.statLabel}>Alerts</Text>
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <Pressable style={styles.searchButton} onPress={() => setShowSearchOverlay(true)}>
              <MaterialIcons name="search" size={20} color="#6b7280" />
              <Text style={styles.searchPlaceholder}>
                {searchQuery || 'Search dogs, breeds, locations...'}
              </Text>
              <MaterialIcons name="mic" size={18} color="#9ca3af" />
            </Pressable>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}>
              {(['all', 'dogs', 'emergencies', 'stray', 'owned'] as FilterType[]).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => handleFilterPress(filter)}
                  style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}>
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === filter && styles.filterChipTextActive,
                    ]}>
                    {filter === 'all'
                      ? '🌟 All'
                      : filter === 'dogs'
                        ? '🐕 Dogs'
                        : filter === 'emergencies'
                          ? '🚨 Alerts'
                          : filter === 'stray'
                            ? '🏠 Strays'
                            : '👨‍👩‍👧‍👦 Owned'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </LinearGradient>
        </Card>
      </View>

      {/* Floating Controls */}
      <View style={[styles.floatingControls, { bottom: insets.bottom + 120 }]}>
        {/* Left Controls */}
        <View style={styles.leftControls}>
          <Card style={styles.controlCard} elevation={3}>
            <View style={styles.controlsColumn}>
              <IconButton
                icon="my-location"
                size={20}
                iconColor="white"
                style={[styles.controlButton, { backgroundColor: '#10b981' }]}
                onPress={centerOnUser}
              />
              <IconButton
                icon={trackingMode ? 'location-off' : 'location-on'}
                size={20}
                iconColor="white"
                style={[
                  styles.controlButton,
                  {
                    backgroundColor: trackingMode ? '#ef4444' : '#3b82f6',
                    marginTop: 8,
                  },
                ]}
                onPress={() => setTrackingMode(!trackingMode)}
              />
              <IconButton
                icon="refresh"
                size={20}
                iconColor="white"
                style={[
                  styles.controlButton,
                  {
                    backgroundColor: '#f59e0b',
                    marginTop: 8,
                  },
                ]}
                onPress={refreshData}
              />
            </View>
          </Card>
        </View>

        {/* Right FAB */}
        <View style={styles.rightControls}>
          <Animated.View style={[{ transform: [{ scale: fabScale }] }]}>
            <Pressable
              style={styles.mainFab}
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
              <LinearGradient colors={['#10b981', '#059669']} style={styles.fabGradient}>
                <MaterialIcons name="add" size={28} color="white" />
                <Text style={styles.fabText}>Add Dog</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Bottom Sheet */}
      {showBottomSheet && selectedMarker && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: bottomSheetTranslateY }],
              bottom: insets.bottom,
            },
          ]}>
          <Card style={styles.bottomSheetCard} elevation={8}>
            <View style={styles.bottomSheetHandle} />

            <View style={styles.bottomSheetContent}>
              {'name' in selectedMarker ? (
                // Dog content
                <>
                  <View style={styles.dogHeader}>
                    <View style={styles.dogInfo}>
                      <Text style={styles.dogName}>{selectedMarker.name}</Text>
                      <Text style={styles.dogDetails}>
                        {selectedMarker.breed} • {selectedMarker.distance_km?.toFixed(1)}km away
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor:
                            selectedMarker.dog_type === 'stray' ? '#fef3c7' : '#d1fae5',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.typeText,
                          {
                            color: selectedMarker.dog_type === 'stray' ? '#92400e' : '#065f46',
                          },
                        ]}>
                        {selectedMarker.dog_type === 'stray' ? '🏠 Stray' : '👨‍👩‍👧‍👦 Owned'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionButtons}>
                    <Pressable style={[styles.actionButton, { backgroundColor: '#10b981' }]}>
                      <MaterialIcons name="directions" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Navigate</Text>
                    </Pressable>
                    <Pressable style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}>
                      <MaterialIcons name="favorite" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Save</Text>
                    </Pressable>
                    <Pressable style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}>
                      <MaterialIcons name="share" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Share</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                // Emergency content
                <>
                  <View style={styles.emergencyHeader}>
                    <View style={styles.emergencyInfo}>
                      <Text style={styles.emergencyTitle}>🚨 {selectedMarker.emergency_type}</Text>
                      <Text style={styles.emergencyDetails}>
                        {selectedMarker.severity} • {selectedMarker.distance_km?.toFixed(1)}km away
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.severityChip,
                        {
                          backgroundColor:
                            selectedMarker.severity === 'high'
                              ? '#ef4444'
                              : selectedMarker.severity === 'medium'
                                ? '#f59e0b'
                                : '#10b981',
                        },
                      ]}>
                      <Text style={styles.severityText}>{selectedMarker.severity}</Text>
                    </View>
                  </View>

                  <Text style={styles.emergencyDescription}>{selectedMarker.description}</Text>

                  <View style={styles.actionButtons}>
                    <Pressable style={[styles.actionButton, { backgroundColor: '#ef4444' }]}>
                      <MaterialIcons name="volunteer-activism" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Help</Text>
                    </Pressable>
                    <Pressable style={[styles.actionButton, { backgroundColor: '#10b981' }]}>
                      <MaterialIcons name="call" size={18} color="white" />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </Card>

          <Pressable style={styles.closeButton} onPress={closeBottomSheet}>
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </Pressable>
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
    paddingHorizontal: 16,
  },
  headerCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 50,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    opacity: 0.9,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#6b7280',
  },
  filterContainer: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  floatingControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  leftControls: {
    alignItems: 'flex-start',
  },
  controlCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  controlsColumn: {
    padding: 8,
  },
  controlButton: {
    borderRadius: 12,
    margin: 0,
  },
  rightControls: {
    alignItems: 'flex-end',
  },
  mainFab: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    left: 16,
    right: 16,
    height: 280,
  },
  bottomSheetCard: {
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  dogDetails: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  emergencyDetails: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  severityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
  emergencyDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
