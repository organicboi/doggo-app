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
  ScrollView,
} from 'react-native';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Dog {
  id: string;
  name: string;
  breed: string;
  size: string;
  latitude: number;
  longitude: number;
  owner_name: string;
  rating: number;
  distance?: string;
  is_stray: boolean;
  urgency_level?: 'low' | 'medium' | 'high';
  description?: string;
  photo_url?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const MapScreen: React.FC = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocationPermission();
    loadMockDogs(); // In production, this would fetch from Supabase
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location access to find dogs nearby',
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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setUserLocation(userLoc);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
      setLoading(false);
    }
  };

  // Mock data - In production, this would fetch from Supabase database
  const loadMockDogs = () => {
    const mockDogs: Dog[] = [
      {
        id: '1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        size: 'Large',
        latitude: 37.7849 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4094 + (Math.random() - 0.5) * 0.02,
        owner_name: 'Sarah Johnson',
        rating: 4.8,
        is_stray: false,
        description: 'Friendly and energetic, loves long walks in the park!',
      },
      {
        id: '2',
        name: 'Max',
        breed: 'German Shepherd',
        size: 'Large',
        latitude: 37.7849 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4094 + (Math.random() - 0.5) * 0.02,
        owner_name: 'Mike Chen',
        rating: 4.9,
        is_stray: false,
        description: 'Well-trained and calm, perfect for beginners',
      },
      {
        id: '3',
        name: 'Luna',
        breed: 'Mixed Breed',
        size: 'Medium',
        latitude: 37.7849 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4094 + (Math.random() - 0.5) * 0.02,
        owner_name: 'Stray',
        rating: 0,
        is_stray: true,
        urgency_level: 'high',
        description: 'Needs food and medical attention urgently',
      },
      {
        id: '4',
        name: 'Charlie',
        breed: 'Labrador',
        size: 'Large',
        latitude: 37.7849 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4094 + (Math.random() - 0.5) * 0.02,
        owner_name: 'Emma Wilson',
        rating: 4.7,
        is_stray: false,
        description: 'Loves playing fetch and meeting new people',
      },
      {
        id: '5',
        name: 'Bella',
        breed: 'French Bulldog',
        size: 'Small',
        latitude: 37.7849 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4094 + (Math.random() - 0.5) * 0.02,
        owner_name: 'James Rodriguez',
        rating: 4.6,
        is_stray: false,
        description: 'Short walks preferred, very gentle and sweet',
      },
    ];

    // Calculate distances (mock calculation)
    mockDogs.forEach(dog => {
      const distance = (Math.random() * 2 + 0.1).toFixed(1);
      dog.distance = `${distance} km`;
    });

    setDogs(mockDogs);
  };

  const openGoogleMaps = (dog: Dog) => {
    const scheme = Platform.select({
      ios: 'maps://app?saddr=',
      android: 'google.navigation:q=',
    });

    const latLng = `${dog.latitude},${dog.longitude}`;
    const label = encodeURIComponent(dog.name);

    let url = '';

    if (Platform.OS === 'ios') {
      url = `${scheme}&daddr=${latLng}&q=${label}`;
    } else {
      url = `${scheme}${latLng}(${label})`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback to web Google Maps
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&destination_place_id=${label}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps application');
      });
  };

  const getDogMarkerColor = (dog: Dog) => {
    if (dog.is_stray) {
      switch (dog.urgency_level) {
        case 'high': return '#ef4444'; // Red
        case 'medium': return '#f97316'; // Orange
        default: return '#eab308'; // Yellow
      }
    }
    return '#3b82f6'; // Blue for regular dogs
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 text-lg">Finding dogs nearby...</Text>
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
          We need your location to show dogs nearby. Please enable location services and try again.
        </Text>
        <Pressable
          onPress={requestLocationPermission}
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
          <View>
            <Text className="text-white text-2xl font-bold">Discover Dogs</Text>
            <Text className="text-white/90 text-sm">
              {dogs.length} dogs found nearby
            </Text>
          </View>
          <Pressable
            onPress={centerOnUser}
            className="bg-white/20 p-3 rounded-full"
          >
            <MaterialIcons name="my-location" size={24} color="white" />
          </Pressable>
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
          {dogs.map((dog) => (
            <Marker
              key={dog.id}
              coordinate={{
                latitude: dog.latitude,
                longitude: dog.longitude,
              }}
              pinColor={getDogMarkerColor(dog)}
              onPress={() => setSelectedDog(dog)}
            >
              <Callout onPress={() => openGoogleMaps(dog)}>
                <View className="w-64 p-2">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-lg font-bold text-gray-800 flex-1">
                      {dog.name}
                    </Text>
                    {dog.is_stray && (
                      <View className="bg-red-100 px-2 py-1 rounded-full">
                        <Text className="text-red-600 text-xs font-medium">STRAY</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text className="text-gray-600 text-sm mb-1">
                    {dog.breed} • {dog.size}
                  </Text>
                  
                  {!dog.is_stray && (
                    <Text className="text-gray-600 text-sm mb-1">
                      Owner: {dog.owner_name}
                    </Text>
                  )}
                  
                  {dog.distance && (
                    <Text className="text-blue-600 text-sm mb-2">
                      📍 {dog.distance} away
                    </Text>
                  )}
                  
                  {dog.description && (
                    <Text className="text-gray-700 text-sm mb-3">
                      {dog.description}
                    </Text>
                  )}
                  
                  <View className="bg-blue-500 px-4 py-2 rounded-lg">
                    <Text className="text-white text-center font-medium">
                      🗺️ Get Directions
                    </Text>
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
              <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
              <Text className="text-sm text-gray-600">Urgent Strays</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
              <Text className="text-sm text-gray-600">Stray Dogs</Text>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View className="absolute top-4 left-4 right-4">
          <View className="bg-white rounded-xl p-4 shadow-lg">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-4">
                <View className="items-center">
                  <View className="bg-blue-100 p-2 rounded-full mb-1">
                    <Ionicons name="paw" size={20} color="#3b82f6" />
                  </View>
                  <Text className="text-xs text-gray-600">Available</Text>
                  <Text className="text-lg font-bold text-gray-800">
                    {dogs.filter(d => !d.is_stray).length}
                  </Text>
                </View>
                
                <View className="items-center">
                  <View className="bg-red-100 p-2 rounded-full mb-1">
                    <MaterialIcons name="pets" size={20} color="#ef4444" />
                  </View>
                  <Text className="text-xs text-gray-600">Strays</Text>
                  <Text className="text-lg font-bold text-gray-800">
                    {dogs.filter(d => d.is_stray).length}
                  </Text>
                </View>

                <View className="items-center">
                  <View className="bg-green-100 p-2 rounded-full mb-1">
                    <Ionicons name="location" size={20} color="#10b981" />
                  </View>
                  <Text className="text-xs text-gray-600">Nearby</Text>
                  <Text className="text-lg font-bold text-gray-800">
                    {dogs.filter(d => parseFloat(d.distance?.split(' ')[0] || '0') < 1).length}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
}); 