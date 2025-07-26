import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, Linking, Platform, Vibration } from 'react-native';
import MapView, { Marker, Region, Circle } from 'react-native-maps';
import { Searchbar, FAB, Portal, Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import our new components
import EnhancedDogDetailPanel from './EnhancedDogDetailPanel';
import WalkRequestModal from './WalkRequestModal';
import DogReviewModal from './DogReviewModal';
import CustomMapMarker from './CustomMapMarker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Dog {
  id: string;
  name: string;
  breed: string;
  size: string;
  age_years?: number;
  age_months?: number;
  weight?: number;
  color?: string;
  gender?: string;
  dog_type: 'owned' | 'stray' | 'rescue' | 'foster';
  profile_image_url?: string;
  additional_images?: string[];
  description?: string;
  owner_name?: string;
  owner_avatar?: string;
  owner_rating?: number;
  contact_info?: string;

  // Personality & Behavior
  energy_level?: number;
  friendliness?: number;
  playfulness?: number;
  trainability?: number;
  good_with_kids?: boolean;
  good_with_dogs?: boolean;
  good_with_cats?: boolean;

  // Walking & Stats
  total_walks: number;
  rating_average: number;
  rating_count: number;
  last_walk_date?: string;
  preferred_walk_duration?: number;
  walking_pace?: string;
  leash_trained?: boolean;

  // Health
  is_vaccinated?: boolean;
  vaccination_date?: string;
  health_conditions?: string;
  special_needs?: string;

  // Location
  latitude: number;
  longitude: number;
  distance_km?: number;
  is_available_for_walks?: boolean;
}

export default function UltimateDogMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // State management
  const [userLocation, setUserLocation] = useState<Region>({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [showDogDetail, setShowDogDetail] = useState(false);
  const [showWalkRequest, setShowWalkRequest] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusFilter, setRadiusFilter] = useState(5); // km
  const [loading, setLoading] = useState(false);

  // Load mock data - replace with actual API calls
  useEffect(() => {
    loadMockDogs();
  }, []);

  const loadMockDogs = () => {
    const mockDogs: Dog[] = [
      {
        id: '1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        size: 'large',
        age_years: 3,
        dog_type: 'owned',
        latitude: 18.5204 + 0.01,
        longitude: 73.8567 + 0.01,
        profile_image_url: 'https://picsum.photos/400/400?random=1',
        additional_images: [
          'https://picsum.photos/400/400?random=1',
          'https://picsum.photos/400/400?random=2',
          'https://picsum.photos/400/400?random=3',
        ],
        description:
          "Buddy is a friendly and energetic Golden Retriever who loves playing fetch and going on long walks. He's great with kids and other dogs, making him perfect for social interactions in the park.",
        owner_name: 'Sarah Johnson',
        owner_avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        owner_rating: 4.8,
        contact_info: '+1-555-0123',
        energy_level: 4,
        friendliness: 5,
        playfulness: 5,
        trainability: 4,
        good_with_kids: true,
        good_with_dogs: true,
        good_with_cats: false,
        total_walks: 23,
        rating_average: 4.7,
        rating_count: 15,
        preferred_walk_duration: 45,
        walking_pace: 'moderate',
        leash_trained: true,
        is_vaccinated: true,
        vaccination_date: '2024-01-15',
        distance_km: 0.8,
        is_available_for_walks: true,
      },
      {
        id: '2',
        name: 'Luna',
        breed: 'Border Collie Mix',
        size: 'medium',
        age_years: 2,
        dog_type: 'rescue',
        latitude: 18.5204 - 0.008,
        longitude: 73.8567 + 0.015,
        profile_image_url: 'https://picsum.photos/400/400?random=4',
        description:
          'Luna is a smart and active Border Collie mix looking for an experienced walker. She loves mental challenges and agility exercises. Very responsive to training commands.',
        owner_name: 'Mike Chen',
        owner_avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        owner_rating: 4.9,
        contact_info: '+1-555-0456',
        energy_level: 5,
        friendliness: 4,
        playfulness: 4,
        trainability: 5,
        good_with_kids: true,
        good_with_dogs: true,
        good_with_cats: true,
        total_walks: 18,
        rating_average: 4.9,
        rating_count: 12,
        preferred_walk_duration: 60,
        walking_pace: 'fast',
        leash_trained: true,
        is_vaccinated: true,
        special_needs: 'Needs mental stimulation during walks',
        distance_km: 1.2,
        is_available_for_walks: true,
      },
      {
        id: '3',
        name: 'Max',
        breed: 'German Shepherd',
        size: 'large',
        age_years: 5,
        dog_type: 'owned',
        latitude: 18.5204 + 0.005,
        longitude: 73.8567 - 0.012,
        profile_image_url: 'https://picsum.photos/400/400?random=5',
        description:
          "Max is a well-trained German Shepherd with a calm temperament. He's protective but gentle, making him an excellent walking companion for those who prefer larger dogs.",
        owner_name: 'Emily Rodriguez',
        owner_avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
        owner_rating: 4.6,
        contact_info: '+1-555-0789',
        energy_level: 3,
        friendliness: 4,
        playfulness: 3,
        trainability: 5,
        good_with_kids: true,
        good_with_dogs: false,
        good_with_cats: false,
        total_walks: 31,
        rating_average: 4.5,
        rating_count: 20,
        preferred_walk_duration: 40,
        walking_pace: 'moderate',
        leash_trained: true,
        is_vaccinated: true,
        health_conditions: 'Mild hip dysplasia - prefers shorter walks',
        distance_km: 0.6,
        is_available_for_walks: true,
      },
      {
        id: '4',
        name: 'Charlie',
        breed: 'Mixed Breed',
        size: 'medium',
        age_years: 1,
        dog_type: 'stray',
        latitude: 18.5204 - 0.015,
        longitude: 73.8567 - 0.008,
        profile_image_url: 'https://picsum.photos/400/400?random=6',
        description:
          "Charlie is a young stray who has been recently rescued. He's still learning to trust humans but shows great potential. Needs gentle, patient interactions.",
        energy_level: 3,
        friendliness: 2,
        playfulness: 3,
        trainability: 2,
        good_with_kids: false,
        good_with_dogs: true,
        good_with_cats: true,
        total_walks: 3,
        rating_average: 3.8,
        rating_count: 4,
        preferred_walk_duration: 20,
        walking_pace: 'slow',
        leash_trained: false,
        is_vaccinated: false,
        special_needs: 'Needs socialization and basic training',
        distance_km: 1.8,
        is_available_for_walks: false,
      },
    ];

    setDogs(mockDogs);
  };

  const handleDogPress = (dog: Dog) => {
    setSelectedDog(dog);
    setShowDogDetail(true);
    Vibration.vibrate(50);
  };

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
        onPress: () => Linking.openURL(`tel:${contactInfo}`),
      },
      {
        text: 'Text',
        onPress: () => Linking.openURL(`sms:${contactInfo}`),
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

  const getMarkerColor = (dog: Dog) => {
    switch (dog.dog_type) {
      case 'owned':
        return dog.is_available_for_walks ? '#10b981' : '#6b7280';
      case 'stray':
        return '#f59e0b';
      case 'rescue':
        return '#8b5cf6';
      case 'foster':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const filteredDogs = dogs.filter((dog) => {
    const matchesSearch =
      searchQuery === '' ||
      dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dog.breed.toLowerCase().includes(searchQuery.toLowerCase());

    const withinRadius = !dog.distance_km || dog.distance_km <= radiusFilter;

    return matchesSearch && withinRadius;
  });

  return (
    <PaperProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />

        {/* Map */}
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={userLocation}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}>
          {/* Radius Circle */}
          <Circle
            center={userLocation}
            radius={radiusFilter * 1000}
            strokeColor="rgba(59, 130, 246, 0.3)"
            fillColor="rgba(59, 130, 246, 0.1)"
            strokeWidth={2}
          />

          {/* Dog Markers */}
          {filteredDogs.map((dog) => (
            <Marker
              key={dog.id}
              coordinate={{
                latitude: dog.latitude,
                longitude: dog.longitude,
              }}
              onPress={() => handleDogPress(dog)}>
              <CustomMapMarker
                type="dog"
                color={getMarkerColor(dog)}
                dogType={dog.dog_type}
                size="medium"
                isSelected={selectedDog?.id === dog.id}
              />
            </Marker>
          ))}
        </MapView>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { top: insets.top + 10 }]}>
          <Searchbar
            placeholder="Search dogs by name or breed..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={{ fontSize: 16 }}
            iconColor="#6b7280"
          />
        </View>

        {/* Floating Action Buttons */}
        <Portal>
          <FAB.Group
            open={false}
            visible={true}
            icon="menu"
            actions={[
              {
                icon: 'map-marker-radius',
                label: `Radius: ${radiusFilter}km`,
                onPress: () => {
                  const newRadius = radiusFilter === 5 ? 10 : radiusFilter === 10 ? 20 : 5;
                  setRadiusFilter(newRadius);
                },
              },
              {
                icon: 'filter',
                label: 'Filter Dogs',
                onPress: () => Alert.alert('Filters', 'Filter options coming soon!'),
              },
              {
                icon: 'plus',
                label: 'Add Dog',
                onPress: () => Alert.alert('Add Dog', 'Quick add feature coming soon!'),
              },
            ]}
            onStateChange={() => {}}
            fabStyle={{
              backgroundColor: '#3b82f6',
            }}
            style={{
              paddingBottom: insets.bottom + 80,
              paddingRight: 16,
            }}
          />
        </Portal>

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
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchBar: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 12,
  },
});
