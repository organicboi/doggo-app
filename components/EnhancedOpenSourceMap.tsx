import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { supabase } from '../lib/supabase';
import DogReviewModal from './DogReviewModal';
import EnhancedDogDetailPanel from './EnhancedDogDetailPanel';
import EnhancedMapHeader from './EnhancedMapHeader';
import MaterialQuickAddModal from './MaterialQuickAddModal';
import PremiumSearchOverlay from './PremiumSearchOverlay';
import WalkRequestModal from './WalkRequestModal';

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

export default function EnhancedOpenSourceMap() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const webViewRef = useRef<WebView>(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Dog | Emergency | null>(null);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDogDetail, setShowDogDetail] = useState(false);
  const [showWalkRequest, setShowWalkRequest] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trackingMode, setTrackingMode] = useState(false);

  // Animations
  const fabScale = useRef(new Animated.Value(1)).current;
  const bottomSheetTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (showBottomSheet) {
      Animated.spring(bottomSheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    } else {
      Animated.spring(bottomSheetTranslateY, {
        toValue: 300,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();
    }
  }, [showBottomSheet]);

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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setUserLocation(userLoc);
      fetchDogsAndEmergencies(userLoc);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
  };

  const fetchDogsAndEmergencies = async (location: UserLocation) => {
    try {
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
        return;
      }

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
        return;
      }

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
          ),
          rating_average: dog.rating_average || 4.5,
          rating_count: dog.rating_count || 10,
        }))
        .filter((dog) => dog.distance_km <= 50)
        .sort((a, b) => a.distance_km - b.distance_km);

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
          ),
        }))
        .filter((emergency) => emergency.distance_km <= 50)
        .sort((a, b) => a.distance_km - b.distance_km);

      setDogs(validDogs);
      setEmergencies(validEmergencies);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleMarkerPress = async (item: Dog | Emergency) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedMarker(item);
      
      if ('name' in item) {
        // It's a dog
        setSelectedDog(item);
        setShowDogDetail(true);
      } else {
        // It's an emergency
        setShowBottomSheet(true);
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  const closeBottomSheet = () => {
    setShowBottomSheet(false);
    setSelectedMarker(null);
  };

  const handleFilterPress = async (filter: FilterType) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveFilter(filter);
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  };

  const centerOnUser = async () => {
    if (userLocation && webViewRef.current) {
      const script = `
        map.setView([${userLocation.latitude}, ${userLocation.longitude}], 13);
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const refreshData = async () => {
    if (userLocation) {
      await fetchDogsAndEmergencies(userLocation);
    }
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
  };

  const handleWalkRequest = (dogId: string) => {
    setShowWalkRequest(true);
    setShowDogDetail(false);
  };

  const handleReviewPress = (dogId: string) => {
    setShowReviewModal(true);
    setShowDogDetail(false);
  };

  const handleContactOwner = (contactInfo: string) => {
    if (contactInfo) {
      Linking.openURL(`tel:${contactInfo}`).catch(() => {
        Alert.alert('Error', 'Could not open phone app');
      });
    }
  };

  const handleWalkRequestSubmit = (walkRequest: any) => {
    Alert.alert(
      'Walk Request Sent!',
      'Your walk request has been sent to the dog owner.',
      [{ text: 'OK' }]
    );
    setShowWalkRequest(false);
    console.log('Walk request submitted:', walkRequest);
  };

  const handleReviewSubmit = (review: any) => {
    Alert.alert(
      'Review Submitted!',
      'Thank you for your review.',
      [{ text: 'OK' }]
    );
    setShowReviewModal(false);
    console.log('Review submitted:', review);
  };

  const filteredData = useMemo(() => {
    let filteredDogs = dogs;
    let filteredEmergencies = emergencies;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDogs = dogs.filter(dog => 
        dog.name?.toLowerCase().includes(query) ||
        dog.breed?.toLowerCase().includes(query) ||
        dog.owner_name?.toLowerCase().includes(query)
      );
      filteredEmergencies = emergencies.filter(emergency =>
        emergency.emergency_type?.toLowerCase().includes(query) ||
        emergency.description?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    switch (activeFilter) {
      case 'dogs':
        filteredEmergencies = [];
        break;
      case 'emergencies':
        filteredDogs = [];
        break;
      case 'stray':
        filteredDogs = filteredDogs.filter(dog => dog.dog_type === 'stray');
        filteredEmergencies = [];
        break;
      case 'owned':
        filteredDogs = filteredDogs.filter(dog => dog.dog_type === 'owned');
        filteredEmergencies = [];
        break;
      case 'rescue':
        filteredDogs = filteredDogs.filter(dog => dog.dog_type === 'rescue');
        filteredEmergencies = [];
        break;
    }

    return { dogs: filteredDogs, emergencies: filteredEmergencies };
  }, [dogs, emergencies, searchQuery, activeFilter]);

  const createMapHtml = () => {
    const centerLat = userLocation?.latitude || 40.7128;
    const centerLng = userLocation?.longitude || -74.0060;
    
    const dogMarkers = filteredData.dogs.map(dog => `
      L.marker([${dog.latitude}, ${dog.longitude}], {
        icon: L.divIcon({
          html: '<div style="background-color: #10b981; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;">🐕</div>',
          className: 'custom-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map).bindPopup('<b>${dog.name}</b><br>${dog.breed || 'Unknown breed'}<br>${dog.dog_type || 'Unknown type'}<br>⭐ ${dog.rating_average}/5 (${dog.rating_count} reviews)<br><small>${dog.distance_km?.toFixed(1)}km away</small>').on('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'marker_click',
          data: ${JSON.stringify(dog)}
        }));
      });
    `).join('');

    const emergencyMarkers = filteredData.emergencies.map(emergency => `
      L.marker([${emergency.latitude}, ${emergency.longitude}], {
        icon: L.divIcon({
          html: '<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;">🚨</div>',
          className: 'custom-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map).bindPopup('<b>${emergency.emergency_type}</b><br>Severity: ${emergency.severity}<br>${emergency.description}<br><small>${emergency.distance_km?.toFixed(1)}km away</small>').on('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'marker_click',
          data: ${JSON.stringify(emergency)}
        }));
      });
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .custom-marker { background: transparent; border: none; }
          .leaflet-popup-content { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          // Add user location marker
          L.marker([${centerLat}, ${centerLng}], {
            icon: L.divIcon({
              html: '<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold;">📍</div>',
              className: 'custom-marker',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          }).addTo(map).bindPopup('<b>Your Location</b>').openPopup();
          
          // Add dog markers
          ${dogMarkers}
          
          // Add emergency markers
          ${emergencyMarkers}
          
          // Handle long press for adding dogs
          let longPressTimer;
          map.on('contextmenu', function(e) {
            longPressTimer = setTimeout(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'long_press',
                data: { latitude: e.latlng.lat, longitude: e.latlng.lng }
              }));
            }, 500);
          });
          
          map.on('click', function() {
            clearTimeout(longPressTimer);
          });
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'marker_click') {
        handleMarkerPress(message.data);
      } else if (message.type === 'long_press') {
        setSelectedMapLocation(message.data);
        setShowQuickAddModal(true);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  if (loading && !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#10b981', '#059669']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading PawPals Map (OpenStreetMap)...</Text>
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

      {/* OpenStreetMap WebView */}
      <WebView
        ref={webViewRef}
        source={{ html: createMapHtml() }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />

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
  webview: {
    flex: 1,
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

  // Streamlined Controls
  streamlinedControls: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
  controlStrip: {
    marginBottom: 16,
  },
  controlBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    padding: 4,
    gap: 8,
  },
  miniControl: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedFab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  fabLabel: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Bottom Sheet Styles
  improvedBottomSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 2000,
  },
  bottomSheetBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomSheetContent: {
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetBody: {
    marginTop: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  severityIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 