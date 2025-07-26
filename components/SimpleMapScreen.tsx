import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
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
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const SimpleMapScreen: React.FC = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestLocationPermission();
    loadMockDogs();
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

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please try again.');
      setLoading(false);
    }
  };

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
      {
        id: '6',
        name: 'Rocky',
        breed: 'Pitbull Mix',
        size: 'Large',
        latitude: 37.7849 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4094 + (Math.random() - 0.5) * 0.02,
        owner_name: 'Alex Thompson',
        rating: 4.9,
        is_stray: false,
        description: 'Strong and loyal, needs experienced walker',
      },
      {
        id: '7',
        name: 'Milo',
        breed: 'Beagle',
        size: 'Medium',
        latitude: 37.7849 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4094 + (Math.random() - 0.5) * 0.02,
        owner_name: 'Jessica Lee',
        rating: 4.5,
        is_stray: false,
        description: 'Curious and friendly, loves sniffing around',
      },
      {
        id: '8',
        name: 'Shadow',
        breed: 'Mixed Breed',
        size: 'Medium',
        latitude: 37.7849 + (Math.random() - 0.5) * 0.02,
        longitude: -122.4094 + (Math.random() - 0.5) * 0.02,
        owner_name: 'Stray',
        rating: 0,
        is_stray: true,
        urgency_level: 'medium',
        description: 'Needs regular feeding and care',
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
    const latLng = `${dog.latitude},${dog.longitude}`;
    const label = encodeURIComponent(dog.name);

    let url = '';

    if (Platform.OS === 'ios') {
      url = `maps://app?saddr=&daddr=${latLng}&q=${label}`;
    } else {
      url = `google.navigation:q=${latLng}(${label})`;
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

  const getDogCardColor = (dog: Dog) => {
    if (dog.is_stray) {
      switch (dog.urgency_level) {
        case 'high': return ['#ef4444', '#dc2626']; // Red gradient
        case 'medium': return ['#f97316', '#ea580c']; // Orange gradient
        default: return ['#eab308', '#ca8a04']; // Yellow gradient
      }
    }
    return ['#3b82f6', '#1d4ed8']; // Blue gradient for regular dogs
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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-4 pb-4"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Dogs Near You</Text>
            <Text className="text-white/90 text-sm">
              {dogs.length} dogs found • Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          </View>
          <View className="bg-white/20 p-3 rounded-full">
            <MaterialIcons name="location-on" size={24} color="white" />
          </View>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View className="px-6 py-4">
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <View className="bg-blue-100 p-2 rounded-full mb-1">
                <Ionicons name="paw" size={20} color="#3b82f6" />
              </View>
              <Text className="text-xs text-gray-600">Available</Text>
              <Text className="text-lg font-bold text-gray-800">
                {dogs.filter(d => !d.is_stray).length}
              </Text>
            </View>
            
            <View className="items-center flex-1">
              <View className="bg-red-100 p-2 rounded-full mb-1">
                <MaterialIcons name="pets" size={20} color="#ef4444" />
              </View>
              <Text className="text-xs text-gray-600">Strays</Text>
              <Text className="text-lg font-bold text-gray-800">
                {dogs.filter(d => d.is_stray).length}
              </Text>
            </View>

            <View className="items-center flex-1">
              <View className="bg-green-100 p-2 rounded-full mb-1">
                <Ionicons name="location" size={20} color="#10b981" />
              </View>
              <Text className="text-xs text-gray-600">Nearby</Text>
              <Text className="text-lg font-bold text-gray-800">
                {dogs.filter(d => parseFloat(d.distance?.split(' ')[0] || '0') < 1).length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Dogs List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Dogs Available for Walking
        </Text>
        
        {dogs.map((dog) => (
          <LinearGradient
            key={dog.id}
            colors={getDogCardColor(dog) as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-2xl mb-4 p-1"
          >
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-xl font-bold text-gray-800 flex-1">
                      {dog.name}
                    </Text>
                    {dog.is_stray && (
                      <View className="bg-red-100 px-2 py-1 rounded-full">
                        <Text className="text-red-600 text-xs font-medium">
                          STRAY {dog.urgency_level?.toUpperCase()}
                        </Text>
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
                  
                  {dog.rating > 0 && (
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text className="text-gray-600 text-sm ml-1">
                        {dog.rating} rating
                      </Text>
                    </View>
                  )}
                </View>
                
                <View className="items-center">
                  <View className={`p-3 rounded-full ${dog.is_stray ? 'bg-red-100' : 'bg-blue-100'}`}>
                    <MaterialIcons 
                      name={dog.is_stray ? "pets" : "pets"} 
                      size={24} 
                      color={dog.is_stray ? "#ef4444" : "#3b82f6"} 
                    />
                  </View>
                  {dog.distance && (
                    <Text className="text-xs text-gray-500 mt-1">
                      {dog.distance}
                    </Text>
                  )}
                </View>
              </View>
              
              {dog.description && (
                <Text className="text-gray-700 text-sm mb-3">
                  {dog.description}
                </Text>
              )}
              
              <Pressable
                onPress={() => openGoogleMaps(dog)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl py-3"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-xl py-3"
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Get Directions to {dog.name}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        ))}
        
        <View className="h-6" /> {/* Bottom spacing */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SimpleMapScreen; 