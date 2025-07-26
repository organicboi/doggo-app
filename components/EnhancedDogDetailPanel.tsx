import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Modal } from 'react-native-paper';

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
  dog_type: string;
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
  distance_km?: number;
  is_available_for_walks?: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  created_at: string;
  review_photos?: string[];
}

interface EnhancedDogDetailPanelProps {
  visible: boolean;
  dog: Dog | null;
  onClose: () => void;
  onWalkRequest?: (dogId: string) => void;
  onReviewPress?: (dogId: string) => void;
  onContactOwner?: (contactInfo: string) => void;
}

function EnhancedDogDetailPanel({
  visible,
  dog,
  onClose,
  onWalkRequest,
  onReviewPress,
  onContactOwner,
}: EnhancedDogDetailPanelProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation] = useState(new Animated.Value(1));
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // Slide animation effect
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(screenHeight);
    }
  }, [visible, slideAnim]);

  // Mock reviews data - replace with actual API call
  useEffect(() => {
    if (dog?.id) {
      // Simulate loading reviews
      const mockReviews: Review[] = [
        {
          id: '1',
          rating: 5,
          comment: `${dog.name} is absolutely wonderful! So friendly and well-behaved during our walk. Highly recommend!`,
          reviewer_name: 'Sarah Johnson',
          reviewer_avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
          created_at: '2024-01-15T10:30:00Z',
          review_photos: ['https://picsum.photos/400/300?random=1'],
        },
        {
          id: '2',
          rating: 4,
          comment: `Great dog! Very energetic and loves to play. Perfect for an active walk in the park.`,
          reviewer_name: 'Mike Chen',
          reviewer_avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
          created_at: '2024-01-10T14:20:00Z',
        },
      ];
      setReviews(mockReviews);
    }
  }, [dog?.id]);

  // Define all hooks before any conditional returns
  const handleLike = useCallback(() => {
    if (!isLiked && dog) {
      Vibration.vibrate(50);
    }
    setIsLiked((prev) => !prev);

    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isLiked, likeAnimation, dog]);

  const renderPersonalityMeter = useCallback(
    (label: string, value: number, icon: string, color: string) => (
      <View className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name={icon as any} size={18} color={color} />
            <Text className="ml-2 font-medium text-gray-700">{label}</Text>
          </View>
          <Text className="text-sm text-gray-600">{value}/5</Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-gray-200">
          <View
            className="h-full rounded-full"
            style={{
              width: `${(value / 5) * 100}%`,
              backgroundColor: color,
            }}
          />
        </View>
      </View>
    ),
    []
  );

  const renderReview = useCallback(
    (review: Review, index: number) => (
      <View key={review.id} className="mb-3 rounded-xl bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center">
          <Image
            source={{
              uri: review.reviewer_avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
            }}
            className="h-10 w-10 rounded-full"
          />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-800">{review.reviewer_name}</Text>
            <View className="flex-row items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={14}
                  color={star <= review.rating ? '#fbbf24' : '#e5e7eb'}
                />
              ))}
              <Text className="ml-2 text-xs text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
        <Text className="leading-5 text-gray-700">{review.comment}</Text>
        {review.review_photos && review.review_photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            {review.review_photos.map((photo, photoIndex) => (
              <Image
                key={photoIndex}
                source={{ uri: photo }}
                className="mr-2 h-20 w-20 rounded-lg"
              />
            ))}
          </ScrollView>
        )}
      </View>
    ),
    []
  );

  // Now it's safe to have a conditional return
  if (!dog) return null;

  const images = dog.additional_images || (dog.profile_image_url ? [dog.profile_image_url] : []);

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'flex-end',
      }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}>
      <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <Animated.View
          style={[
            {
              height: screenHeight * 0.85,
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: 'hidden',
            },
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          {/* Header Image Carousel */}
          <View style={{ height: 250, position: 'relative' }}>
            {images.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                  setCurrentImageIndex(newIndex);
                }}>
                {images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={{ width: screenWidth, height: 250 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            ) : (
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={{ width: screenWidth, height: 250 }}
                className="items-center justify-center">
                <Ionicons name="camera" size={48} color="white" />
                <Text className="mt-2 text-lg text-white">No Photo Available</Text>
              </LinearGradient>
            )}

            {/* Image Indicators */}
            {images.length > 1 && (
              <View className="absolute bottom-4 flex-row self-center">
                {images.map((_, index) => (
                  <View
                    key={index}
                    className={`mx-1 h-2 w-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </View>
            )}

            {/* Header Controls */}
            <View className="absolute left-4 right-4 top-4 flex-row justify-between">
              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-black/30">
                <Ionicons name="close" size={24} color="white" />
              </Pressable>

              <Pressable onPress={handleLike}>
                <Animated.View
                  style={{
                    transform: [{ scale: likeAnimation }],
                  }}
                  className="h-10 w-10 items-center justify-center rounded-full bg-black/30">
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isLiked ? '#ef4444' : 'white'}
                  />
                </Animated.View>
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView className="flex-1 px-6 py-4">
            {/* Dog Info Header */}
            <View className="mb-6 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="mb-1 text-3xl font-bold text-gray-800">{dog.name}</Text>
                <Text className="mb-2 text-lg text-gray-600">
                  {dog.breed} • {dog.size}
                  {dog.age_years && ` • ${dog.age_years} years old`}
                </Text>

                {/* Rating and Stats */}
                <View className="flex-row items-center">
                  <View className="flex-row items-center rounded-full bg-yellow-50 px-3 py-1">
                    <Ionicons name="star" size={16} color="#fbbf24" />
                    <Text className="ml-1 font-semibold text-yellow-700">
                      {dog.rating_average.toFixed(1)}
                    </Text>
                    <Text className="ml-1 text-sm text-yellow-600">
                      ({dog.rating_count} reviews)
                    </Text>
                  </View>

                  <View className="ml-2 flex-row items-center rounded-full bg-blue-50 px-3 py-1">
                    <Ionicons name="walk" size={16} color="#3b82f6" />
                    <Text className="ml-1 font-semibold text-blue-700">
                      {dog.total_walks} walks
                    </Text>
                  </View>
                </View>
              </View>

              <View
                className={`rounded-full px-3 py-1 ${
                  dog.dog_type === 'stray' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                <Text
                  className={`text-sm font-medium ${
                    dog.dog_type === 'stray' ? 'text-orange-700' : 'text-green-700'
                  }`}>
                  {dog.dog_type === 'stray' ? '🏠 Stray' : '👨‍👩‍👧‍👦 Owned'}
                </Text>
              </View>
            </View>

            {/* Description */}
            {dog.description && (
              <View className="mb-6">
                <Text className="mb-2 text-lg font-semibold text-gray-800">About {dog.name}</Text>
                <Text className="leading-6 text-gray-700">{dog.description}</Text>
              </View>
            )}

            {/* Personality Meters */}
            <View className="mb-6">
              <Text className="mb-4 text-lg font-semibold text-gray-800">Personality</Text>
              <View className="rounded-xl bg-gray-50 p-4">
                {dog.energy_level &&
                  renderPersonalityMeter('Energy Level', dog.energy_level, 'flash', '#f59e0b')}
                {dog.friendliness &&
                  renderPersonalityMeter('Friendliness', dog.friendliness, 'happy', '#10b981')}
                {dog.playfulness &&
                  renderPersonalityMeter(
                    'Playfulness',
                    dog.playfulness,
                    'game-controller',
                    '#8b5cf6'
                  )}
                {dog.trainability &&
                  renderPersonalityMeter('Trainability', dog.trainability, 'school', '#3b82f6')}
              </View>
            </View>

            {/* Compatibility */}
            <View className="mb-6">
              <Text className="mb-3 text-lg font-semibold text-gray-800">Good With</Text>
              <View className="flex-row">
                {[
                  { label: 'Kids', value: dog.good_with_kids, icon: 'people' },
                  { label: 'Dogs', value: dog.good_with_dogs, icon: 'paw' },
                  { label: 'Cats', value: dog.good_with_cats, icon: 'leaf' },
                ].map((item, index) => (
                  <View
                    key={index}
                    className={`mx-1 flex-1 rounded-xl p-3 ${
                      item.value ? 'bg-green-50' : 'bg-gray-50'
                    }`}>
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={item.value ? '#10b981' : '#9ca3af'}
                      style={{ alignSelf: 'center', marginBottom: 8 }}
                    />
                    <Text
                      className={`text-center text-sm font-medium ${
                        item.value ? 'text-green-700' : 'text-gray-500'
                      }`}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Walking Info */}
            <View className="mb-6">
              <Text className="mb-3 text-lg font-semibold text-gray-800">Walking Preferences</Text>
              <View className="rounded-xl bg-blue-50 p-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-gray-700">Duration</Text>
                  <Text className="font-semibold text-blue-700">
                    {dog.preferred_walk_duration || 30} minutes
                  </Text>
                </View>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-gray-700">Pace</Text>
                  <Text className="font-semibold capitalize text-blue-700">
                    {dog.walking_pace || 'moderate'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700">Leash Trained</Text>
                  <Text
                    className={`font-semibold ${
                      dog.leash_trained ? 'text-green-700' : 'text-red-700'
                    }`}>
                    {dog.leash_trained ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Reviews Section */}
            <View className="mb-6">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-800">
                  Reviews ({reviews.length})
                </Text>
                <Pressable onPress={() => onReviewPress?.(dog.id)}>
                  <Text className="font-medium text-blue-600">Write Review</Text>
                </Pressable>
              </View>

              {reviews.length > 0 ? (
                <View>
                  {(showAllReviews ? reviews : reviews.slice(0, 2)).map(renderReview)}

                  {reviews.length > 2 && (
                    <Pressable
                      onPress={() => setShowAllReviews(!showAllReviews)}
                      className="items-center rounded-xl bg-gray-100 p-4">
                      <Text className="font-medium text-gray-700">
                        {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View className="items-center rounded-xl bg-gray-50 p-6">
                  <Ionicons name="star-outline" size={32} color="#9ca3af" />
                  <Text className="mt-2 text-gray-500">No reviews yet</Text>
                  <Text className="text-sm text-gray-400">Be the first to review {dog.name}!</Text>
                </View>
              )}
            </View>

            {/* Owner Info */}
            {dog.owner_name && (
              <View className="mb-6">
                <Text className="mb-3 text-lg font-semibold text-gray-800">Owner</Text>
                <View className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <View className="flex-row items-center">
                    <Image
                      source={{
                        uri: dog.owner_avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
                      }}
                      className="h-12 w-12 rounded-full"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold text-gray-800">{dog.owner_name}</Text>
                      {dog.owner_rating && (
                        <View className="flex-row items-center">
                          <Ionicons name="star" size={14} color="#fbbf24" />
                          <Text className="ml-1 text-gray-600">
                            {dog.owner_rating.toFixed(1)} rating
                          </Text>
                        </View>
                      )}
                    </View>
                    {dog.contact_info && (
                      <Pressable
                        onPress={() => onContactOwner?.(dog.contact_info!)}
                        className="rounded-lg bg-blue-500 px-4 py-2">
                        <Text className="font-medium text-white">Contact</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Distance Info */}
            {dog.distance_km && (
              <View className="mb-6">
                <View className="rounded-xl bg-purple-50 p-4">
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={20} color="#8b5cf6" />
                    <Text className="ml-2 font-medium text-purple-700">
                      {dog.distance_km.toFixed(1)} km away
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View className="border-t border-gray-100 bg-white px-6 py-4">
            <View className="flex-row space-x-3">
              {dog.is_available_for_walks && (
                <Pressable
                  onPress={() => onWalkRequest?.(dog.id)}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-blue-500 py-4">
                  <Ionicons name="walk" size={20} color="white" />
                  <Text className="ml-2 font-semibold text-white">Request Walk</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  // Handle directions
                  Alert.alert('Directions', `Navigate to ${dog.name}?`);
                }}
                className="flex-row items-center justify-center rounded-xl bg-gray-100 px-6 py-4">
                <Ionicons name="navigate" size={20} color="#374151" />
                <Text className="ml-2 font-semibold text-gray-700">Directions</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

export default memo(EnhancedDogDetailPanel);
