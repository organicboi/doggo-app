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
  TextInput,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import MapView, { 
  Marker, 
  Region, 
  Callout, 
  Heatmap, 
  Circle,
  Polyline,
  PROVIDER_GOOGLE 
} from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.4;

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
  last_seen?: string;
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

const EnhancedMapScreen: React.FC = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Dog | Emergency | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState(50);
  const [trackingMode, setTrackingMode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const mapRef = useRef<MapView>(null);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Clustering logic
  const clusters = useMemo(() => {
    if (!userLocation) return [];
    
    const allMarkers = [...dogs, ...emergencies].filter(item => 
      item.latitude != null && item.longitude != null
    );
    
    // Simple clustering - group markers within 500m of each other
    const clustered: MarkerCluster[] = [];
    const processed = new Set<string>();
    
    allMarkers.forEach(marker => {
      if (processed.has(marker.id)) return;
      
      const nearby = allMarkers.filter(other => {
        if (processed.has(other.id) || other.id === marker.id) return false;
        const distance = getDistance(
          marker.latitude, marker.longitude,
          other.latitude, other.longitude
        );
        return distance < 0.5; // 500m clustering radius
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
  }, [dogs, emergencies, userLocation]);

  // Filtered data based on search and filters
  const filteredData = useMemo(() => {
    let filteredDogs = dogs;
    let filteredEmergencies = emergencies;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredDogs = dogs.filter(dog => 
        dog.name.toLowerCase().includes(query) ||
        dog.breed?.toLowerCase().includes(query) ||
        dog.owner_name?.toLowerCase().includes(query)
      );
      filteredEmergencies = emergencies.filter(emergency =>
        emergency.emergency_type.toLowerCase().includes(query) ||
        emergency.description.toLowerCase().includes(query)
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

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (showBottomSheet) {
      Animated.spring(bottomSheetAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(bottomSheetAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [showBottomSheet]);

  const initializeMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Please enable location access');
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
      Alert.alert('Error', 'Could not initialize map');
    }
    
    setLoading(false);
  };

  const loadData = async (location: UserLocation) => {
    try {
      // Load dogs with distance calculation
      const { data: nearbyDogs, error: dogsError } = await supabase
        .rpc('find_nearby_dogs', {
          user_lat: location.latitude,
          user_lng: location.longitude,
          radius_km: 100
        });

      if (!dogsError && nearbyDogs) {
        const validDogs = nearbyDogs.filter((dog: any) => 
          dog.latitude != null && 
          dog.longitude != null && 
          typeof dog.latitude === 'number' &&
          typeof dog.longitude === 'number'
        );
        setDogs(validDogs);
      }

      // Load emergencies with distance calculation
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!emergencyError && emergencyData) {
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
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

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

  const openGoogleMaps = (latitude: number, longitude: number, label: string) => {
    const latLng = `${latitude},${longitude}`;
    const encodedLabel = encodeURIComponent(label);

    let url = '';
    if (Platform.OS === 'ios') {
      url = `maps://app?saddr=&daddr=${latLng}&q=${encodedLabel}`;
    } else {
      url = `google.navigation:q=${latLng}(${encodedLabel})`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&destination_place_id=${encodedLabel}`;
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

  const CustomMarker = ({ item, type }: { item: Dog | Emergency, type: 'dog' | 'emergency' }) => (
    <View style={[styles.customMarker, { backgroundColor: getMarkerColor(type, item) }]}>
      <Ionicons 
        name={type === 'dog' ? 'paw' : 'warning'} 
        size={16} 
        color="white" 
      />
    </View>
  );

  const ClusterMarker = ({ cluster }: { cluster: MarkerCluster }) => (
    <View style={[styles.clusterMarker]}>
      <Text style={styles.clusterText}>{cluster.pointCount}</Text>
    </View>
  );

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

  const [searchVisible, setSearchVisible] = useState(false);
  
  const toggleSearch = () => {
    const newValue = !searchVisible;
    setSearchVisible(newValue);
    Animated.spring(searchAnim, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
    }).start();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-green-400 to-blue-500">
        <View className="bg-white rounded-3xl p-8 shadow-2xl">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="mt-4 text-gray-700 text-lg font-medium text-center">
            Loading amazing map...
          </Text>
        </View>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-green-400 to-blue-500 px-6">
        <View className="bg-white rounded-3xl p-8 shadow-2xl items-center">
          <View className="bg-green-100 p-4 rounded-full mb-4">
            <Ionicons name="location-outline" size={48} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Location Required
          </Text>
          <Text className="text-gray-600 text-center mb-6 leading-6">
            We need your location to show nearby dogs and emergencies
          </Text>
          <Pressable
            onPress={initializeMap}
            className="bg-green-500 px-8 py-4 rounded-2xl shadow-lg"
          >
            <Text className="text-white font-bold text-lg">Enable Location</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-2 pb-4"
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-white text-3xl font-bold">PawPals</Text>
            <Text className="text-white/90 text-sm">
              {filteredData.dogs.length} dogs • {filteredData.emergencies.length} emergencies
            </Text>
          </View>
          
          <View className="flex-row space-x-2">
            <Pressable
              onPress={toggleSearch}
              className="bg-white/20 p-3 rounded-full"
            >
              <Ionicons name="search" size={20} color="white" />
            </Pressable>
            
            <Pressable
              onPress={() => setShowHeatmap(!showHeatmap)}
              className={`p-3 rounded-full ${showHeatmap ? 'bg-white/30' : 'bg-white/20'}`}
            >
              <MaterialIcons name="layers" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <Animated.View 
          style={[
            { opacity: searchAnim, transform: [{ scale: searchAnim }] },
            !searchVisible && { height: 0 }
          ]}
        >
          <View className="bg-white/20 rounded-2xl px-4 py-2 flex-row items-center">
            <Ionicons name="search" size={20} color="white" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search dogs, breeds, or emergencies..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              className="flex-1 ml-3 text-white text-base"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="white" />
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mt-3"
        >
          {(['all', 'dogs', 'emergencies', 'stray', 'owned'] as FilterType[]).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`mr-3 px-4 py-2 rounded-full ${
                activeFilter === filter 
                  ? 'bg-white' 
                  : 'bg-white/20'
              }`}
            >
              <Text className={`font-medium capitalize ${
                activeFilter === filter 
                  ? 'text-green-600' 
                  : 'text-white'
              }`}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Map */}
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
        >
          {/* Heatmap for density visualization */}
          {showHeatmap && (
            <Heatmap
              points={[...filteredData.dogs, ...filteredData.emergencies].map(item => ({
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

          {/* Radius Circle */}
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
              onPress={() => {
                // Zoom into cluster
                mapRef.current?.animateToRegion({
                  ...cluster.coordinate,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }, 1000);
              }}
            >
              <ClusterMarker cluster={cluster} />
            </Marker>
          ))}

          {/* Individual Dog Markers */}
          {filteredData.dogs.map((dog) => (
            <Marker
              key={`dog-${dog.id}`}
              coordinate={{
                latitude: dog.latitude,
                longitude: dog.longitude,
              }}
              onPress={() => onMarkerPress(dog, 'dog')}
            >
              <CustomMarker item={dog} type="dog" />
            </Marker>
          ))}

          {/* Individual Emergency Markers */}
          {filteredData.emergencies.map((emergency) => (
            <Marker
              key={`emergency-${emergency.id}`}
              coordinate={{
                latitude: emergency.latitude,
                longitude: emergency.longitude,
              }}
              onPress={() => onMarkerPress(emergency, 'emergency')}
            >
              <CustomMarker item={emergency} type="emergency" />
            </Marker>
          ))}
        </MapView>

        {/* Floating Action Buttons */}
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
              marginTop: 10 
            }]}
          >
            <MaterialIcons name={trackingMode ? 'location-off' : 'location-on'} size={24} color="white" />
          </Pressable>
          
          <Pressable
            onPress={refreshData}
            style={[styles.fab, { 
              backgroundColor: '#f59e0b',
              marginTop: 10 
            }]}
          >
            <MaterialIcons name="refresh" size={24} color="white" />
          </Pressable>

          <Pressable
            onPress={() => {
              const styles = ['standard', 'satellite', 'hybrid', 'terrain'] as MapStyle[];
              const currentIndex = styles.indexOf(mapStyle);
              setMapStyle(styles[(currentIndex + 1) % styles.length]);
            }}
            style={[styles.fab, { 
              backgroundColor: '#8b5cf6',
              marginTop: 10 
            }]}
          >
            <MaterialIcons name="layers" size={24} color="white" />
          </Pressable>
        </Animated.View>

        {/* Enhanced Legend */}
        <BlurView intensity={80} style={styles.legend}>
          <View className="p-4">
            <Text className="font-bold text-gray-800 mb-3 text-lg">Map Legend</Text>
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-4 h-4 rounded-full bg-blue-500 mr-3" />
                  <Text className="text-sm text-gray-700">Owned Dogs</Text>
                </View>
                <Text className="text-xs text-gray-500">{dogs.filter(d => d.dog_type !== 'stray').length}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-4 h-4 rounded-full bg-orange-500 mr-3" />
                  <Text className="text-sm text-gray-700">Stray Dogs</Text>
                </View>
                <Text className="text-xs text-gray-500">{dogs.filter(d => d.dog_type === 'stray').length}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
                  <Text className="text-sm text-gray-700">Emergencies</Text>
                </View>
                <Text className="text-xs text-gray-500">{emergencies.length}</Text>
              </View>
            </View>
            
            <View className="mt-4 pt-3 border-t border-gray-200">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Search Radius: {radiusFilter}km
              </Text>
              <View className="bg-gray-200 rounded-full h-2">
                <View 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(radiusFilter / 100) * 100}%` }}
                />
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Enhanced Bottom Sheet */}
      {showBottomSheet && selectedMarker && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{
                translateY: bottomSheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [BOTTOM_SHEET_HEIGHT, 0],
                })
              }]
            }
          ]}
        >
          <BlurView intensity={100} style={StyleSheet.absoluteFillObject}>
            <View className="flex-1 p-6">
              {/* Handle */}
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
              
              {/* Content */}
              {'name' in selectedMarker ? (
                // Dog Details
                <View>
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-gray-800">{selectedMarker.name}</Text>
                      <Text className="text-gray-600">{selectedMarker.breed} • {selectedMarker.size}</Text>
                    </View>
                    <Pressable
                      onPress={() => toggleFavorite(selectedMarker.id)}
                      className="p-2"
                    >
                      <Ionicons 
                        name={favorites.includes(selectedMarker.id) ? "heart" : "heart-outline"} 
                        size={24} 
                        color={favorites.includes(selectedMarker.id) ? "#ef4444" : "#9ca3af"} 
                      />
                    </Pressable>
                  </View>

                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <View className="flex-row justify-between mb-3">
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-green-600">
                          {selectedMarker.distance_km?.toFixed(1)}km
                        </Text>
                        <Text className="text-xs text-gray-500">Distance</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-blue-600">
                          {selectedMarker.rating_average?.toFixed(1) || 'N/A'}
                        </Text>
                        <Text className="text-xs text-gray-500">Rating</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-purple-600">
                          {selectedMarker.age || 'Unknown'}
                        </Text>
                        <Text className="text-xs text-gray-500">Age</Text>
                      </View>
                    </View>
                  </View>

                  {selectedMarker.owner_name && (
                    <View className="bg-blue-50 rounded-2xl p-4 mb-4">
                      <Text className="text-sm text-gray-600 mb-1">Owner</Text>
                      <Text className="text-lg font-semibold text-gray-800">{selectedMarker.owner_name}</Text>
                    </View>
                  )}

                  <View className="flex-row space-x-3">
                    <Pressable
                      onPress={() => openGoogleMaps(selectedMarker.latitude, selectedMarker.longitude, selectedMarker.name)}
                      className="flex-1 bg-green-500 py-4 rounded-2xl"
                    >
                      <Text className="text-white text-center font-bold text-lg">
                        🗺️ Navigate
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {/* Add contact functionality */}}
                      className="flex-1 bg-blue-500 py-4 rounded-2xl"
                    >
                      <Text className="text-white text-center font-bold text-lg">
                        💬 Contact
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                // Emergency Details
                <View>
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-gray-800 capitalize">
                        {selectedMarker.emergency_type.replace('_', ' ')}
                      </Text>
                      <View className={`self-start px-3 py-1 rounded-full mt-2 ${
                        selectedMarker.severity === 'critical' ? 'bg-red-100' : 
                        selectedMarker.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        <Text className={`text-sm font-medium ${
                          selectedMarker.severity === 'critical' ? 'text-red-600' : 
                          selectedMarker.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
                        }`}>
                          {selectedMarker.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text className="text-gray-700 text-base mb-4 leading-6">
                    {selectedMarker.description}
                  </Text>

                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <View className="flex-row justify-between">
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-green-600">
                          {selectedMarker.distance_km?.toFixed(1)}km
                        </Text>
                        <Text className="text-xs text-gray-500">Distance</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-blue-600">
                          {selectedMarker.volunteers_responded}/{selectedMarker.volunteers_needed}
                        </Text>
                        <Text className="text-xs text-gray-500">Volunteers</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-2xl font-bold text-purple-600">
                          {new Date(selectedMarker.created_at).toLocaleDateString()}
                        </Text>
                        <Text className="text-xs text-gray-500">Reported</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row space-x-3">
                    <Pressable
                      onPress={() => openGoogleMaps(selectedMarker.latitude, selectedMarker.longitude, `Emergency: ${selectedMarker.emergency_type}`)}
                      className="flex-1 bg-red-500 py-4 rounded-2xl"
                    >
                      <Text className="text-white text-center font-bold text-lg">
                        🚨 Respond
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {/* Add share functionality */}}
                      className="bg-gray-500 py-4 px-6 rounded-2xl"
                    >
                      <MaterialIcons name="share" size={24} color="white" />
                    </Pressable>
                  </View>
                </View>
              )}

              <Pressable
                onPress={() => setShowBottomSheet(false)}
                className="mt-4 bg-gray-200 py-3 rounded-2xl"
              >
                <Text className="text-gray-600 text-center font-medium">Close</Text>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterMarker: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
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
    maxWidth: 200,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
}); 

export default EnhancedMapScreen; 