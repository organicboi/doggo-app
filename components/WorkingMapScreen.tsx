import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

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
}

interface UserLocation {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const WorkingMapScreen: React.FC = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    console.log('Initializing map...');
    
    try {
      // Get location
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
      console.log('Got user location:', userLoc);

      // Load data using the working function from debug results
      await loadData(userLoc);
      
    } catch (error) {
      console.error('Error initializing map:', error);
      Alert.alert('Error', 'Could not initialize map');
    }
    
    setLoading(false);
  };

  const loadData = async (location: UserLocation) => {
    console.log('Loading data for location:', location);

    try {
      // Use the find_nearby_dogs function that we know works from debug
      const { data: nearbyDogs, error: dogsError } = await supabase
        .rpc('find_nearby_dogs', {
          user_lat: location.latitude,
          user_lng: location.longitude,
          radius_km: 50 // Use larger radius since debug showed dogs up to 23km away
        });

      if (dogsError) {
        console.error('Dogs error:', dogsError);
      } else if (nearbyDogs) {
        console.log('Loaded dogs:', nearbyDogs.length);
        // Filter out any dogs with invalid coordinates
        const validDogs = nearbyDogs.filter((dog: any) => 
          dog.latitude != null && 
          dog.longitude != null && 
          dog.latitude !== 0 && 
          dog.longitude !== 0 &&
          typeof dog.latitude === 'number' &&
          typeof dog.longitude === 'number'
        );
        console.log('Valid dogs after filtering:', validDogs.length);
        setDogs(validDogs);
      }

      // Load emergencies directly (since we know they exist from debug)
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('latitude', 0)
        .neq('longitude', 0);

      if (emergencyError) {
        console.error('Emergency error:', emergencyError);
      } else if (emergencyData) {
        console.log('Loaded emergencies:', emergencyData.length);
        // Filter out any emergencies with invalid coordinates
        const validEmergencies = emergencyData.filter(emergency => 
          emergency.latitude != null && 
          emergency.longitude != null && 
          emergency.latitude !== 0 && 
          emergency.longitude !== 0 &&
          typeof emergency.latitude === 'number' &&
          typeof emergency.longitude === 'number'
        );
        console.log('Valid emergencies after filtering:', validEmergencies.length);
        setEmergencies(validEmergencies);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
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

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  const refreshData = async () => {
    if (userLocation) {
      setLoading(true);
      await loadData(userLocation);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 text-lg">Loading map...</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <Ionicons name="location-outline" size={64} color="#9ca3af" />
        <Text className="text-2xl font-bold text-gray-800 mt-4 text-center">
          Location Access Required
        </Text>
        <Text className="text-gray-600 text-center mt-2 leading-6">
          Please enable location access to use the map.
        </Text>
        <Pressable
          onPress={initializeMap}
          className="mt-6 bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Enable Location</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-4 pb-4"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">PawPals Map</Text>
            <Text className="text-white/90 text-sm">
              {dogs.length} dogs • {emergencies.length} emergencies
            </Text>
          </View>
          
          <View className="flex-row space-x-2">
            <Pressable
              onPress={refreshData}
              className="bg-white/20 p-3 rounded-full"
            >
              <MaterialIcons name="refresh" size={24} color="white" />
            </Pressable>
            
            <Pressable
              onPress={centerOnUser}
              className="bg-white/20 p-3 rounded-full"
            >
              <MaterialIcons name="my-location" size={24} color="white" />
            </Pressable>
          </View>
        </View>
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
        >
          {/* Dog Markers */}
          {dogs.filter(dog => dog.latitude != null && dog.longitude != null).map((dog) => (
            <Marker
              key={`dog-${dog.id}`}
              coordinate={{
                latitude: dog.latitude,
                longitude: dog.longitude,
              }}
              pinColor={getMarkerColor('dog', dog)}
            >
              <Callout onPress={() => openGoogleMaps(dog.latitude, dog.longitude, dog.name)}>
                <View className="w-64 p-2">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-lg font-bold text-gray-800 flex-1">{dog.name}</Text>
                    {dog.dog_type === 'stray' && (
                      <View className="bg-orange-100 px-2 py-1 rounded-full">
                        <Text className="text-orange-600 text-xs font-medium">STRAY</Text>
                      </View>
                    )}
                  </View>
                  {dog.breed && dog.size && (
                    <Text className="text-gray-600 text-sm mb-1">{dog.breed} • {dog.size}</Text>
                  )}
                  {dog.owner_name && (
                    <Text className="text-gray-600 text-sm mb-1">Owner: {dog.owner_name}</Text>
                  )}
                  {dog.distance_km && (
                    <Text className="text-blue-600 text-sm mb-2">📍 {dog.distance_km.toFixed(1)}km away</Text>
                  )}
                  <View className="bg-blue-500 px-4 py-2 rounded-lg">
                    <Text className="text-white text-center font-medium">🗺️ Get Directions</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}

          {/* Emergency Markers */}
          {emergencies.filter(emergency => emergency.latitude != null && emergency.longitude != null).map((emergency) => (
            <Marker
              key={`emergency-${emergency.id}`}
              coordinate={{
                latitude: emergency.latitude,
                longitude: emergency.longitude,
              }}
              pinColor={getMarkerColor('emergency', emergency)}
            >
              <Callout onPress={() => openGoogleMaps(emergency.latitude, emergency.longitude, `Emergency: ${emergency.emergency_type}`)}>
                <View className="w-64 p-2">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-lg font-bold text-gray-800 flex-1">
                      {emergency.emergency_type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <View className={`px-2 py-1 rounded-full ${
                      emergency.severity === 'critical' ? 'bg-red-100' : 
                      emergency.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
                    }`}>
                      <Text className={`text-xs font-medium ${
                        emergency.severity === 'critical' ? 'text-red-600' : 
                        emergency.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {emergency.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-700 text-sm mb-2">{emergency.description}</Text>
                  <Text className="text-gray-600 text-sm mb-1">
                    Volunteers: {emergency.volunteers_responded}/{emergency.volunteers_needed}
                  </Text>
                  <View className="bg-red-500 px-4 py-2 rounded-lg">
                    <Text className="text-white text-center font-medium">🚨 Respond</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Legend */}
        <View className="absolute bottom-4 left-4 bg-white rounded-xl p-4 shadow-lg">
          <Text className="font-bold text-gray-800 mb-2">Legend</Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              <Text className="text-sm text-gray-600">Available Dogs</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
              <Text className="text-sm text-gray-600">Stray Dogs</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
              <Text className="text-sm text-gray-600">Emergencies</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WorkingMapScreen;

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
}); 