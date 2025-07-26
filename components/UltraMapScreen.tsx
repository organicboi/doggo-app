import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  Linking,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
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
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

// Import our custom components
import CustomMapMarker from './CustomMapMarker';
import MapBottomSheet from './MapBottomSheet';
import MapSearchOverlay from './MapSearchOverlay';
import QuickAddModal from './QuickAddModal';

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
  age?: number;
  vaccination_status?: string;
  profile_image_url?: string;
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

interface MarkerCluster {
  id: string;
  coordinate: { latitude: number; longitude: number };
  pointCount: number;
  items: (Dog | Emergency)[];
}

type FilterType = 'all' | 'dogs' | 'emergencies' | 'stray' | 'owned';
type MapStyle = 'standard' | 'satellite' | 'hybrid' | 'terrain';

const UltraMapScreen: React.FC = () => {
  // Core state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Dog | Emergency | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [radiusFilter, setRadiusFilter] = useState(50);
  const [trackingMode, setTrackingMode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Refs and animations
  const mapRef = useRef<MapView>(null);
  const fabAnim = useRef(new Animated.Value(1)).current;

  // Distance calculation function
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Enhanced filtered data with search and filters
  const filteredData = useMemo(() => {
    // Ensure dogs and emergencies arrays exist
    const dogsArray = dogs || [];
    const emergenciesArray = emergencies || [];
    
    let filteredDogs = dogsArray;
    let filteredEmergencies = emergenciesArray;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredDogs = dogsArray.filter(dog => 
        dog.name?.toLowerCase().includes(query) ||
        dog.breed?.toLowerCase().includes(query) ||
        dog.owner_name?.toLowerCase().includes(query) ||
        dog.dog_type?.toLowerCase().includes(query)
      );
      filteredEmergencies = emergenciesArray.filter(emergency =>
        emergency.emergency_type?.toLowerCase().includes(query) ||
        emergency.description?.toLowerCase().includes(query) ||
        emergency.severity?.toLowerCase().includes(query)
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
        filteredDogs = filteredDogs.filter(dog => dog.dog_type !== 'stray');
        filteredEmergencies = [];
        break;
    }

    // Apply radius filter
    if (userLocation) {
      filteredDogs = filteredDogs.filter(dog => 
        (dog.distance_km || 0) <= radiusFilter
      );
      filteredEmergencies = filteredEmergencies.filter(emergency => 
        (emergency.distance_km || 0) <= radiusFilter
      );
    }

    return { dogs: filteredDogs, emergencies: filteredEmergencies };
  }, [dogs, emergencies, searchQuery, activeFilter, radiusFilter, userLocation]);

  // Clustering logic with performance optimization
  const clusters = useMemo(() => {
    if (!userLocation || !filteredData) return [];
    
    const allMarkers = [...(filteredData.dogs || []), ...(filteredData.emergencies || [])];
    if (allMarkers.length < 3) return []; // Don't cluster if too few markers
    
    const clustered: MarkerCluster[] = [];
    const processed = new Set<string>();
    const CLUSTER_RADIUS = 0.5; // 500m clustering radius
    
    allMarkers.forEach(marker => {
      if (processed.has(marker.id)) return;
      
      const nearby = allMarkers.filter(other => {
        if (processed.has(other.id) || other.id === marker.id) return false;
        const distance = getDistance(
          marker.latitude, marker.longitude,
          other.latitude, other.longitude
        );
        return distance < CLUSTER_RADIUS;
      });
      
      if (nearby.length > 0) {
        nearby.forEach(item => processed.add(item.id));
        processed.add(marker.id);
        
        const centerLat = [marker, ...nearby].reduce((sum, item) => sum + item.latitude, 0) / (nearby.length + 1);
        const centerLng = [marker, ...nearby].reduce((sum, item) => sum + item.longitude, 0) / (nearby.length + 1);
        
        clustered.push({
          id: `cluster-${marker.id}`,
          coordinate: { latitude: centerLat, longitude: centerLng },
          pointCount: nearby.length + 1,
          items: [marker, ...nearby]
        });
      }
    });
    
    return clustered;
  }, [filteredData, userLocation]);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required', 
          'Please enable location access to use the map features.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setUserLocation(userLoc);
      await loadData(userLoc);
      
    } catch (error) {
      console.error('Error initializing map:', error);
      Alert.alert('Error', 'Could not initialize map. Please try again.');
    }
    
    setLoading(false);
  };

  const loadData = async (location: UserLocation) => {
    console.log('🔄 Loading data for location:', location);
    
    try {
      // Try the RPC function first
      console.log('📡 Trying RPC function...');
      const { data: nearbyDogs, error: dogsError } = await supabase
        .rpc('find_nearby_dogs', {
          user_lat: location.latitude,
          user_lng: location.longitude,
          radius_km: 100
        });

      if (dogsError) {
        console.log('❌ RPC function error:', dogsError);
        console.log('📡 Fallback to direct table query...');
        
        // Fallback to direct query
        const { data: directDogs, error: directError } = await supabase
          .from('dogs')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(50);

        if (!directError && directDogs) {
          console.log(`✅ Direct query successful! Found ${directDogs.length} dogs`);
          const validDogs = directDogs
            .filter((dog: any) => 
              dog.latitude != null && 
              dog.longitude != null && 
              typeof dog.latitude === 'number' &&
              typeof dog.longitude === 'number'
            )
            .map((dog: any) => ({
              ...dog,
              distance_km: getDistance(
                location.latitude, location.longitude,
                dog.latitude, dog.longitude
              )
            }));
          setDogs(validDogs);
          console.log(`✅ Set ${validDogs.length} valid dogs`);
        } else {
          console.error('❌ Direct query error:', directError);
          setDogs([]);
        }
      } else if (nearbyDogs) {
        console.log(`✅ RPC function successful! Found ${nearbyDogs.length} dogs`);
        console.log('🔍 Sample dog data:', nearbyDogs[0]);
        console.log('🔍 All dog coordinates check:');
        nearbyDogs.forEach((dog: any, index: number) => {
          console.log(`Dog ${index + 1}: ${dog.name} - lat: ${dog.latitude} (${typeof dog.latitude}), lng: ${dog.longitude} (${typeof dog.longitude})`);
        });
        
        const validDogs = nearbyDogs.filter((dog: any) => {
          const hasValidCoords = dog.latitude != null && 
            dog.longitude != null && 
            typeof dog.latitude === 'number' &&
            typeof dog.longitude === 'number' &&
            dog.latitude !== 0 &&
            dog.longitude !== 0;
          
          if (!hasValidCoords) {
            console.log('❌ Invalid dog coords:', dog.name, dog.latitude, dog.longitude);
          }
          return hasValidCoords;
        });
        
        setDogs(validDogs);
        console.log(`✅ Set ${validDogs.length} valid dogs from RPC`);
        if (validDogs.length > 0) {
          console.log('🔍 First valid dog:', validDogs[0]);
        }
      }

      // Load emergencies with distance calculation
      console.log('📡 Loading emergencies...');
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!emergencyError && emergencyData) {
        console.log(`✅ Found ${emergencyData.length} emergencies`);
        const validEmergencies = emergencyData
          .filter(emergency => 
            emergency.latitude != null && 
            emergency.longitude != null &&
            typeof emergency.latitude === 'number' &&
            typeof emergency.longitude === 'number'
          )
          .map(emergency => ({
            ...emergency,
            distance_km: getDistance(
              location.latitude, location.longitude,
              emergency.latitude, emergency.longitude
            )
          }));
        setEmergencies(validEmergencies);
        console.log(`✅ Set ${validEmergencies.length} valid emergencies`);
      } else {
        console.error('❌ Emergency query error:', emergencyError);
        setEmergencies([]);
      }

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setDogs([]);
      setEmergencies([]);
    }
  };

  const openGoogleMaps = (latitude: number, longitude: number, label: string) => {
    const latLng = `${latitude},${longitude}`;
    const encodedLabel = encodeURIComponent(label);

    let url = '';
    if (Platform.OS === 'ios') {
      url = `maps://app?saddr=&daddr=${latLng}&q=${encodedLabel}`;
    } else {
      url = `google.navigation:q=${latLng}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps application');
      });
  };

  const getMarkerColor = (type: 'dog' | 'emergency', item: any) => {
    if (type === 'dog') {
      return item.dog_type === 'stray' ? '#f97316' : '#3b82f6';
    } else {
      switch (item.severity) {
        case 'critical': return '#ef4444';
        case 'high': return '#f97316';
        case 'medium': return '#eab308';
        default: return '#84cc16';
      }
    }
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  const toggleTracking = () => {
    setTrackingMode(!trackingMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const refreshData = async () => {
    if (userLocation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(true);
      await loadData(userLocation);
      setLoading(false);
    }
  };

  const toggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const onMarkerPress = (item: Dog | Emergency, type: 'dog' | 'emergency') => {
    setSelectedMarker(item);
    setShowBottomSheet(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onMapLongPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedMapLocation({ latitude, longitude });
    setShowQuickAddModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onClusterPress = (cluster: MarkerCluster) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...cluster.coordinate,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const handleSearchResult = (result: any) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
    
    // Add to recent searches
    if (!recentSearches.includes(result.title)) {
      setRecentSearches(prev => [result.title, ...prev.slice(0, 4)]);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <View className="bg-white/95 rounded-3xl p-8 shadow-2xl items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-4 text-gray-700 text-lg font-semibold text-center">
            Loading PawPals Map...
          </Text>
          <Text className="mt-2 text-gray-500 text-sm text-center">
            Finding nearby dogs and emergencies
          </Text>
        </View>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 px-6">
        <View className="bg-white/95 rounded-3xl p-8 shadow-2xl items-center max-w-sm">
          <View className="bg-green-100 p-6 rounded-full mb-6">
            <Ionicons name="location" size={48} color="#10b981" />
          </View>
          <Text className="text-3xl font-bold text-gray-800 mb-3 text-center">
            Location Required
          </Text>
          <Text className="text-gray-600 text-center mb-8 leading-6">
            We need your location to show nearby dogs, emergencies, and provide navigation
          </Text>
          <Pressable
            onPress={initializeMap}
            className="bg-gradient-to-r from-green-500 to-blue-500 px-8 py-4 rounded-2xl shadow-lg w-full"
          >
            <Text className="text-white font-bold text-lg text-center">
              Enable Location Access
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Ultra-Modern Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: 'white',
              fontSize: 28,
              fontWeight: 'bold',
            }}>
              PawPals Map
            </Text>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 14,
              marginTop: 4,
            }}>
              {filteredData?.dogs?.length || 0} dogs • {filteredData?.emergencies?.length || 0} emergencies
            </Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            gap: 12,
          }}>
            <Pressable
              onPress={() => {
                setSelectedMapLocation(null);
                setShowQuickAddModal(true);
              }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: 12,
                borderRadius: 24,
              }}
            >
              <Ionicons name="add" size={20} color="white" />
            </Pressable>
            
            <Pressable
              onPress={() => setShowSearchOverlay(true)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: 12,
                borderRadius: 24,
              }}
            >
              <Ionicons name="search" size={20} color="white" />
            </Pressable>
            
            <Pressable
              onPress={() => setShowHeatmap(!showHeatmap)}
              style={{
                backgroundColor: showHeatmap ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                padding: 12,
                borderRadius: 24,
              }}
            >
              <MaterialIcons name="layers" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
        >
          <View style={{
            flexDirection: 'row',
            gap: 8,
            paddingRight: 24,
          }}>
            {(['all', 'dogs', 'emergencies', 'stray', 'owned'] as FilterType[]).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: activeFilter === filter ? 'white' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Text style={{
                  fontWeight: '600',
                  fontSize: 14,
                  color: activeFilter === filter ? '#667eea' : 'white',
                }}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Instruction Banner */}
      <View style={{
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(102, 126, 234, 0.2)',
      }}>
        <Text style={{
          color: '#667eea',
          fontSize: 12,
          fontWeight: '500',
          textAlign: 'center',
        }}>
          💡 Tap + to add at your location • Long press anywhere on map to add at that spot
        </Text>
      </View>

      {/* Ultra-Enhanced Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={userLocation}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType={mapStyle}
          followsUserLocation={trackingMode}
          userLocationUpdateInterval={trackingMode ? 1000 : 10000}
          loadingEnabled={true}
          loadingBackgroundColor="#f3f4f6"
          loadingIndicatorColor="#667eea"
          moveOnMarkerPress={false}
          onLongPress={onMapLongPress}
        >
          {/* Heatmap for density visualization */}
          {showHeatmap && filteredData && (
            <Heatmap
              points={[...(filteredData.dogs || []), ...(filteredData.emergencies || [])].map(item => ({
                latitude: item.latitude,
                longitude: item.longitude,
                weight: 1,
              }))}
              radius={50}
              opacity={0.7}
              gradient={{
                colors: ['#00ff00', '#ffff00', '#ff0000'],
                startPoints: [0.2, 0.5, 1.0],
                colorMapSize: 256,
              }}
            />
          )}

          {/* Search Radius Circle */}
          {userLocation && (
            <Circle
              center={userLocation}
              radius={radiusFilter * 1000}
              strokeColor="rgba(16, 185, 129, 0.3)"
              fillColor="rgba(16, 185, 129, 0.1)"
              strokeWidth={2}
            />
          )}

          {/* Cluster Markers */}
          {clusters.map((cluster) => (
            <Marker
              key={cluster.id}
              coordinate={cluster.coordinate}
              onPress={() => onClusterPress(cluster)}
            >
              <CustomMapMarker
                type="cluster"
                color="#10b981"
                count={cluster.pointCount}
                size="large"
              />
            </Marker>
          ))}

          {/* Individual Dog Markers */}
          {(filteredData?.dogs || [])
            .filter(dog => !clusters.some(cluster => 
              cluster.items.some(item => item.id === dog.id)
            ))
            .map((dog) => (
              <Marker
                key={`dog-${dog.id}`}
                coordinate={{
                  latitude: dog.latitude,
                  longitude: dog.longitude,
                }}
                onPress={() => onMarkerPress(dog, 'dog')}
              >
                <CustomMapMarker
                  type="dog"
                  color={getMarkerColor('dog', dog)}
                  dogType={dog.dog_type}
                  size="medium"
                />
              </Marker>
            ))}

          {/* Individual Emergency Markers */}
          {(filteredData?.emergencies || [])
            .filter(emergency => !clusters.some(cluster => 
              cluster.items.some(item => item.id === emergency.id)
            ))
            .map((emergency) => (
              <Marker
                key={`emergency-${emergency.id}`}
                coordinate={{
                  latitude: emergency.latitude,
                  longitude: emergency.longitude,
                }}
                onPress={() => onMarkerPress(emergency, 'emergency')}
              >
                <CustomMapMarker
                  type="emergency"
                  color={getMarkerColor('emergency', emergency)}
                  severity={emergency.severity}
                  size="medium"
                />
              </Marker>
            ))}
        </MapView>

        {/* Quick Add FAB - Primary */}
        <Animated.View 
          style={[
            styles.quickAddFab,
            { transform: [{ scale: fabAnim }] }
          ]}
        >
          <Pressable
            onPress={() => setShowQuickAddModal(true)}
            style={styles.quickAddButton}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.quickAddGradient}
            >
              <Ionicons name="add" size={28} color="white" />
                          </LinearGradient>
            </Pressable>
          </Animated.View>

        {/* Secondary FABs */}
        <Animated.View 
          style={[
            styles.fabContainer,
            { transform: [{ scale: fabAnim }] }
          ]}
        >
          <Pressable
            onPress={centerOnUser}
            style={[styles.fab, { backgroundColor: '#10b981' }]}
          >
            <MaterialIcons name="my-location" size={24} color="white" />
          </Pressable>
          
          <Pressable
            onPress={toggleTracking}
            style={[styles.fab, { 
              backgroundColor: trackingMode ? '#ef4444' : '#6366f1',
              marginTop: 12 
            }]}
          >
            <MaterialIcons 
              name={trackingMode ? 'location-off' : 'location-on'} 
              size={24} 
              color="white" 
            />
          </Pressable>
          
          <Pressable
            onPress={refreshData}
            style={[styles.fab, { 
              backgroundColor: '#f59e0b',
              marginTop: 12 
            }]}
          >
            <MaterialIcons name="refresh" size={24} color="white" />
          </Pressable>

          <Pressable
            onPress={() => {
              const styles = ['standard', 'satellite', 'hybrid', 'terrain'] as MapStyle[];
              const currentIndex = styles.indexOf(mapStyle);
              setMapStyle(styles[(currentIndex + 1) % styles.length]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.fab, { 
              backgroundColor: '#8b5cf6',
              marginTop: 12 
            }]}
          >
            <MaterialIcons name="layers" size={24} color="white" />
          </Pressable>
        </Animated.View>

        {/* Ultra-Enhanced Legend */}
        <BlurView intensity={80} style={styles.legend}>
          <View className="p-4">
            <Text className="font-bold text-gray-800 mb-3 text-lg">Map Legend</Text>
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-4 h-4 rounded-full bg-blue-500 mr-3" />
                  <Text className="text-sm text-gray-700">Owned Dogs</Text>
                </View>
                <Text className="text-xs text-gray-500 font-semibold">
                  {(dogs || []).filter(d => d.dog_type !== 'stray').length}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-4 h-4 rounded-full bg-orange-500 mr-3" />
                  <Text className="text-sm text-gray-700">Stray Dogs</Text>
                </View>
                <Text className="text-xs text-gray-500 font-semibold">
                  {(dogs || []).filter(d => d.dog_type === 'stray').length}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
                  <Text className="text-sm text-gray-700">Emergencies</Text>
                </View>
                <Text className="text-xs text-gray-500 font-semibold">
                  {(emergencies || []).length}
                </Text>
              </View>
            </View>
            
            <View className="mt-4 pt-3 border-t border-gray-200">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Search Radius: {radiusFilter}km
              </Text>
              <View className="bg-gray-200 rounded-full h-2">
                <View 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((radiusFilter / 100) * 100, 100)}%` }}
                />
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Ultra-Enhanced Bottom Sheet */}
      <MapBottomSheet
        visible={showBottomSheet}
        item={selectedMarker}
        favorites={favorites}
        onClose={() => setShowBottomSheet(false)}
        onToggleFavorite={toggleFavorite}
        onNavigate={openGoogleMaps}
      />

      {/* Ultra-Enhanced Search Overlay */}
      <MapSearchOverlay
        visible={showSearchOverlay}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClose={() => setShowSearchOverlay(false)}
        onResultSelect={handleSearchResult}
        recentSearches={recentSearches}
        onClearRecent={() => setRecentSearches([])}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        visible={showQuickAddModal}
        onClose={() => {
          setShowQuickAddModal(false);
          setSelectedMapLocation(null);
        }}
        userLocation={userLocation}
        selectedLocation={selectedMapLocation}
        onSuccess={refreshData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  quickAddFab: {
    position: 'absolute',
    right: 20,
    bottom: 200,
  },
  quickAddButton: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  quickAddGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 120,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: 220,
  },
}); 

export default UltraMapScreen; 