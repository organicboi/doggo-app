import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal as NativeModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View
} from 'react-native';

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
  latitude?: number;
  longitude?: number;

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
  const [activeTab, setActiveTab] = useState<'about' | 'personality' | 'reviews'>('about');
  
  const [likeAnimation] = useState(new Animated.Value(1));
  const [tabAnimation] = useState(new Animated.Value(0));
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Enhanced slide animation with spring effect
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim]);

  // Tab animation
  useEffect(() => {
    Animated.spring(tabAnimation, {
      toValue: activeTab === 'about' ? 0 : activeTab === 'personality' ? 1 : 2,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab, tabAnimation]);

  // Mock reviews data
  useEffect(() => {
    if (dog?.id) {
      const mockReviews: Review[] = [
        {
          id: '1',
          rating: 5,
          comment: `${dog.name} is absolutely wonderful! So friendly and well-behaved during our walk. The owner was very communicative and ${dog.name} seemed to really enjoy the exercise. Would definitely walk again!`,
          reviewer_name: 'Sarah Johnson',
          reviewer_avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
          created_at: '2024-01-15T10:30:00Z',
          review_photos: ['https://picsum.photos/400/300?random=1'],
        },
        {
          id: '2',
          rating: 4,
          comment: `Great dog! Very energetic and loves to play. Perfect for an active walk in the park. ${dog.name} was well-trained and responded well to commands.`,
          reviewer_name: 'Mike Chen',
          reviewer_avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
          created_at: '2024-01-10T14:20:00Z',
        },
        {
          id: '3',
          rating: 5,
          comment: `Had an amazing time walking ${dog.name}! Such a sweet and gentle dog. The walk was perfect and ${dog.name} was very social with other dogs we met.`,
          reviewer_name: 'Emma Wilson',
          reviewer_avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
          created_at: '2024-01-08T16:45:00Z',
        },
      ];
      setReviews(mockReviews);
    }
  }, [dog?.id]);

  const handleLike = useCallback(() => {
    if (!isLiked && dog) {
      Vibration.vibrate(50);
    }
    setIsLiked((prev) => !prev);

    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.3,
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

  const handleDirections = useCallback(() => {
    if (!dog?.latitude || !dog?.longitude) {
      Alert.alert('Location Unavailable', 'GPS coordinates are not available for this dog.');
      return;
    }

    const lat = dog.latitude;
    const lng = dog.longitude;
    const label = encodeURIComponent(`${dog.name} - ${dog.breed}`);

    let url = '';
    
    if (Platform.OS === 'ios') {
      // iOS - Try Apple Maps first, fallback to Google Maps
      url = `maps://app?daddr=${lat},${lng}&q=${label}`;
    } else {
      // Android - Google Maps
      url = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback to Google Maps web
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to open maps application.');
      });
  }, [dog]);

  const renderPersonalityMeter = useCallback(
    (label: string, value: number, icon: string, color: string) => (
      <View style={styles.personalityMeter}>
        <View style={styles.personalityHeader}>
          <View style={styles.personalityLabelContainer}>
            <View style={[styles.personalityIcon, { backgroundColor: `${color}20` }]}>
              <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <Text style={styles.personalityLabel}>{label}</Text>
          </View>
          <View style={styles.personalityValue}>
            <Text style={styles.personalityValueText}>{value}</Text>
            <Text style={styles.personalityValueMax}>/5</Text>
          </View>
        </View>
        <View style={styles.personalityBarContainer}>
          <Animated.View
            style={[
              styles.personalityBar,
              {
                width: `${(value / 5) * 100}%`,
                backgroundColor: color,
              }
            ]}
          />
        </View>
      </View>
    ),
    []
  );

  const renderReview = useCallback(
    (review: Review, index: number) => (
      <Animated.View 
        key={review.id} 
        style={[
          styles.reviewCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }
        ]}
      >
        <View style={styles.reviewContent}>
          <View style={styles.reviewHeader}>
            <Image
              source={{
                uri: review.reviewer_avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
              }}
              style={styles.reviewerAvatar}
            />
            <View style={styles.reviewerInfo}>
              <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
              <View style={styles.reviewRatingContainer}>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={14}
                      color={star <= review.rating ? '#fbbf24' : '#e5e7eb'}
                    />
                  ))}
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.reviewComment}>{review.comment}</Text>
          {review.review_photos && review.review_photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>
              {review.review_photos.map((photo, photoIndex) => (
                <Image
                  key={photoIndex}
                  source={{ uri: photo }}
                  style={styles.reviewPhoto}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </Animated.View>
    ),
    [fadeAnim]
  );

  const renderTabContent = () => {
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      }],
    };

    switch (activeTab) {
      case 'about':
        return (
          <Animated.View style={animatedStyle}>
            {/* Description */}
            {dog?.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About {dog.name}</Text>
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>{dog.description}</Text>
                </View>
              </View>
            )}

            {/* Key Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Information</Text>
              <View style={styles.keyStatsContainer}>
                <View style={[styles.keyStatItem, styles.blueBackground]}>
                  <View style={styles.keyStatRow}>
                    <Ionicons name="fitness" size={20} color="#3b82f6" />
                    <Text style={styles.keyStatLabel}>Weight</Text>
                  </View>
                  <Text style={styles.keyStatValueBlue}>{dog?.weight || 'Unknown'} kg</Text>
                </View>
                
                <View style={[styles.keyStatItem, styles.purpleBackground]}>
                  <View style={styles.keyStatRow}>
                    <Ionicons name="color-palette" size={20} color="#8b5cf6" />
                    <Text style={styles.keyStatLabel}>Color</Text>
                  </View>
                  <Text style={styles.keyStatValuePurple}>{dog?.color || 'Mixed'}</Text>
                </View>

                <View style={[styles.keyStatItem, styles.greenBackground]}>
                  <View style={styles.keyStatRow}>
                    <Ionicons name="medical" size={20} color="#10b981" />
                    <Text style={styles.keyStatLabel}>Vaccinated</Text>
                  </View>
                  <Text style={dog?.is_vaccinated ? styles.keyStatValueGreen : styles.keyStatValueRed}>
                    {dog?.is_vaccinated ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Walking Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Walking Preferences</Text>
              <LinearGradient
                colors={['#eff6ff', '#dbeafe']}
                style={styles.walkingPrefsContainer}
              >
                <View style={styles.walkingPrefItem}>
                  <View style={styles.walkingPrefRow}>
                    <Ionicons name="time" size={18} color="#4f46e5" />
                    <Text style={styles.walkingPrefLabel}>Duration</Text>
                  </View>
                  <Text style={styles.walkingPrefValue}>
                    {dog?.preferred_walk_duration || 30} minutes
                  </Text>
                </View>
                <View style={styles.walkingPrefItem}>
                  <View style={styles.walkingPrefRow}>
                    <Ionicons name="speedometer" size={18} color="#4f46e5" />
                    <Text style={styles.walkingPrefLabel}>Pace</Text>
                  </View>
                  <Text style={[styles.walkingPrefValue, { textTransform: 'capitalize' }]}>
                    {dog?.walking_pace || 'moderate'}
                  </Text>
                </View>
                <View style={styles.walkingPrefItem}>
                  <View style={styles.walkingPrefRow}>
                    <Ionicons name="link" size={18} color="#4f46e5" />
                    <Text style={styles.walkingPrefLabel}>Leash Trained</Text>
                  </View>
                  <Text style={dog?.leash_trained ? styles.walkingPrefValueGreen : styles.walkingPrefValueRed}>
                    {dog?.leash_trained ? 'Yes' : 'No'}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        );

      case 'personality':
        return (
          <Animated.View style={animatedStyle}>
            {/* Personality Meters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personality Traits</Text>
              <View style={styles.personalityContainer}>
                {dog?.energy_level &&
                  renderPersonalityMeter('Energy Level', dog.energy_level, 'flash', '#f59e0b')}
                {dog?.friendliness &&
                  renderPersonalityMeter('Friendliness', dog.friendliness, 'happy', '#10b981')}
                {dog?.playfulness &&
                  renderPersonalityMeter('Playfulness', dog.playfulness, 'game-controller', '#8b5cf6')}
                {dog?.trainability &&
                  renderPersonalityMeter('Trainability', dog.trainability, 'school', '#3b82f6')}
              </View>
            </View>

            {/* Compatibility */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compatibility</Text>
              <View style={styles.compatibilityContainer}>
                {[
                  { label: 'Kids', value: dog?.good_with_kids, icon: 'people', color: '#10b981' },
                  { label: 'Dogs', value: dog?.good_with_dogs, icon: 'paw', color: '#3b82f6' },
                  { label: 'Cats', value: dog?.good_with_cats, icon: 'leaf', color: '#8b5cf6' },
                ].map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.compatibilityItem,
                      item.value ? styles.compatibilityItemActive : styles.compatibilityItemInactive,
                      item.value && { borderColor: `${item.color}30`, borderWidth: 2 }
                    ]}
                  >
                    <View 
                      style={[
                        styles.compatibilityIcon,
                        { backgroundColor: item.value ? `${item.color}20` : '#f3f4f6' }
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={item.value ? item.color : '#9ca3af'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.compatibilityLabel,
                        item.value ? styles.compatibilityLabelActive : styles.compatibilityLabelInactive
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.compatibilityStatus,
                        item.value ? styles.compatibilityStatusActive : styles.compatibilityStatusInactive
                      ]}
                    >
                      {item.value ? 'Compatible' : 'Unknown'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 'reviews':
        return (
          <View>
            {reviews.length > 0 ? (
              <View>
                {(showAllReviews ? reviews : reviews.slice(0, 2)).map(renderReview)}

                {reviews.length > 2 && (
                  <Pressable
                    onPress={() => setShowAllReviews(!showAllReviews)}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllReviews ? 'Show Less Reviews' : `View All ${reviews.length} Reviews`}
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.noReviewsContainer}>
                <Ionicons name="star-outline" size={48} color="#9ca3af" />
                <Text style={styles.noReviewsTitle}>No reviews yet</Text>
                <Text style={styles.noReviewsSubtitle}>
                  Be the first to review {dog?.name}!
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  if (!dog) return null;

  const images = dog.additional_images || (dog.profile_image_url ? [dog.profile_image_url] : []);

  return (
    <NativeModal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
          <Pressable style={styles.modalBackground} onPress={onClose} />

          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Enhanced Header with Gradient Overlay */}
            <View style={styles.headerContainer}>
              {images.length > 0 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const newIndex = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                    setCurrentImageIndex(newIndex);
                  }}
                >
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image
                        source={{ uri: image }}
                        style={styles.headerImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
                        style={styles.imageGradient}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.placeholderImage}
                >
                  <Ionicons name="camera" size={64} color="white" />
                  <Text style={styles.placeholderText}>No Photo Available</Text>
                </LinearGradient>
              )}

              {/* Enhanced Image Indicators */}
              {images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {images.map((_, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.imageIndicator,
                        index === currentImageIndex ? styles.imageIndicatorActive : styles.imageIndicatorInactive,
                        {
                          transform: [{
                            scale: index === currentImageIndex ? 1.2 : 1
                          }]
                        }
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Enhanced Header Controls */}
              <View style={styles.headerControls}>
                <Pressable
                  onPress={onClose}
                  style={styles.headerButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>

                <Pressable onPress={handleLike}>
                  <Animated.View
                    style={[
                      styles.headerButton,
                      {
                        transform: [{ scale: likeAnimation }],
                      }
                    ]}
                  >
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={24}
                      color={isLiked ? '#ef4444' : 'white'}
                    />
                  </Animated.View>
                </Pressable>
              </View>

              {/* Dog Info Overlay */}
              <View style={styles.dogInfoOverlay}>
                <View style={styles.dogInfoHeader}>
                  <View style={styles.dogInfoMain}>
                    <Text style={styles.dogName}>{dog.name}</Text>
                    <Text style={styles.dogDetails}>
                      {dog.breed} • {dog.size}
                      {dog.age_years && ` • ${dog.age_years} years old`}
                    </Text>

                    {/* Enhanced Stats */}
                    <View style={styles.dogStats}>
                      <View style={styles.dogStatItem}>
                        <Ionicons name="star" size={16} color="#fbbf24" />
                        <Text style={styles.dogStatText}>
                          {dog.rating_average.toFixed(1)}
                        </Text>
                        <Text style={styles.dogStatSubtext}>
                          ({dog.rating_count})
                        </Text>
                      </View>

                      <View style={styles.dogStatItem}>
                        <Ionicons name="walk" size={16} color="#60a5fa" />
                        <Text style={styles.dogStatText}>
                          {dog.total_walks}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.dogTypeTag,
                      dog.dog_type === 'stray' ? styles.strayTag : styles.ownedTag
                    ]}
                  >
                    <Text
                      style={[
                        styles.dogTypeText,
                        dog.dog_type === 'stray' ? styles.strayText : styles.ownedText
                      ]}
                    >
                      {dog.dog_type === 'stray' ? '🏠 Stray' : '👨‍👩‍👧‍👦 Owned'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Enhanced Tab Navigation */}
            <View style={styles.tabContainer}>
              <View style={styles.tabBackground}>
                <Animated.View
                  style={[
                    styles.tabIndicator,
                    {
                      transform: [{
                        translateX: tabAnimation.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [0, (screenWidth - 48) / 3, ((screenWidth - 48) / 3) * 2],
                        })
                      }]
                    }
                  ]}
                />
                {[
                  { key: 'about', label: 'About', icon: 'information-circle' },
                  { key: 'personality', label: 'Personality', icon: 'happy' },
                  { key: 'reviews', label: 'Reviews', icon: 'star' },
                ].map((tab) => (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key as any)}
                    style={styles.tabButton}
                  >
                    <Ionicons 
                      name={tab.icon as any} 
                      size={18} 
                      color={activeTab === tab.key ? '#3b82f6' : '#6b7280'} 
                    />
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab.key ? styles.tabTextActive : styles.tabTextInactive
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentPadding}>
              {renderTabContent()}

              {/* Owner Info - Always visible */}
              {dog.owner_name && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Owner</Text>
                  <View style={styles.ownerCard}>
                    <LinearGradient
                      colors={['#f8fafc', '#f1f5f9']}
                      style={styles.ownerContent}
                    >
                      <View style={styles.ownerInfo}>
                        <Image
                          source={{
                            uri: dog.owner_avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
                          }}
                          style={styles.ownerAvatar}
                        />
                        <View style={styles.ownerDetails}>
                          <Text style={styles.ownerName}>{dog.owner_name}</Text>
                          {dog.owner_rating && (
                            <View style={styles.ownerRating}>
                              <Ionicons name="star" size={16} color="#fbbf24" />
                              <Text style={styles.ownerRatingText}>
                                {dog.owner_rating.toFixed(1)} rating
                              </Text>
                            </View>
                          )}
                          <Text style={styles.ownerRole}>Dog owner</Text>
                        </View>
                        {dog.contact_info && (
                          <Pressable
                            onPress={() => onContactOwner?.(dog.contact_info!)}
                            style={styles.contactButton}
                          >
                            <Text style={styles.contactButtonText}>Message</Text>
                          </Pressable>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              )}

              {/* Distance Info */}
              {dog.distance_km !== undefined && (
                <View style={styles.section}>
                  <LinearGradient
                    colors={['#fdf4ff', '#fae8ff']}
                    style={styles.distanceContainer}
                  >
                    <View style={styles.distanceInfo}>
                      <View style={styles.distanceIcon}>
                        <Ionicons name="location" size={20} color="#8b5cf6" />
                      </View>
                      <View style={styles.distanceDetails}>
                        <Text style={styles.distanceText}>
                          {dog.distance_km.toFixed(1)} km away
                        </Text>
                        <Text style={styles.distanceSubtext}>
                          Approximately {Math.round(dog.distance_km * 12)} minutes walk
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {/* Health & Safety Info */}
              {(dog.health_conditions || dog.special_needs) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Health & Safety</Text>
                  <View style={styles.healthContainer}>
                    {dog.health_conditions && (
                      <View style={styles.healthItem}>
                        <View style={styles.healthRow}>
                          <Ionicons name="warning" size={20} color="#f59e0b" />
                          <View style={styles.healthContent}>
                            <Text style={styles.healthTitle}>Health Conditions</Text>
                            <Text style={styles.healthText}>{dog.health_conditions}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                    {dog.special_needs && (
                      <View style={styles.specialNeedsItem}>
                        <View style={styles.healthRow}>
                          <Ionicons name="heart" size={20} color="#3b82f6" />
                          <View style={styles.healthContent}>
                            <Text style={styles.specialNeedsTitle}>Special Needs</Text>
                            <Text style={styles.specialNeedsText}>{dog.special_needs}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Add some bottom padding for the action buttons */}
              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Enhanced Bottom Action Buttons */}
            <View style={styles.actionContainer}>
              <View style={styles.actionButtons}>
                {dog.is_available_for_walks && (
                  <Pressable
                    onPress={() => onWalkRequest?.(dog.id)}
                    style={styles.walkButton}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#1d4ed8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.walkButtonGradient}
                    >
                      <View style={styles.walkButtonContent}>
                        <Ionicons name="walk" size={22} color="white" />
                        <Text style={styles.walkButtonText}>Request Walk</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleDirections}
                  style={styles.directionsButton}
                >
                  <Ionicons name="navigate" size={22} color="#374151" />
                  <Text style={styles.directionsButtonText}>Directions</Text>
                </Pressable>
              </View>

              {/* Write Review Button */}
              <Pressable
                onPress={() => onReviewPress?.(dog.id)}
                style={styles.reviewButton}
              >
                <Ionicons name="star-outline" size={20} color="#6b7280" />
                <Text style={styles.reviewButtonText}>Write a Review</Text>
              </Pressable>
            </View>
          </Animated.View>
        </BlurView>
      </View>
    </NativeModal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  blurContainer: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
  },
  modalContent: {
    height: screenHeight * 0.9,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  headerContainer: {
    height: 280,
    position: 'relative',
  },
  imageContainer: {
    width: screenWidth,
    height: 280,
  },
  headerImage: {
    width: screenWidth,
    height: 280,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  placeholderImage: {
    width: screenWidth,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 24,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  imageIndicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  imageIndicatorActive: {
    width: 24,
    backgroundColor: 'white',
  },
  imageIndicatorInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerControls: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dogInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  dogInfoHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dogInfoMain: {
    flex: 1,
  },
  dogName: {
    marginBottom: 8,
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  dogDetails: {
    marginBottom: 12,
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  dogStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dogStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  dogStatText: {
    marginLeft: 4,
    fontWeight: 'bold',
    color: 'white',
  },
  dogStatSubtext: {
    marginLeft: 4,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  dogTypeTag: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  strayTag: {
    backgroundColor: 'rgba(251,146,60,0.9)',
  },
  ownedTag: {
    backgroundColor: 'rgba(34,197,94,0.9)',
  },
  dogTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  strayText: {
    color: '#9a3412',
  },
  ownedText: {
    color: '#14532d',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  tabBackground: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    padding: 4,
  },
  tabIndicator: {
    position: 'absolute',
    height: '100%',
    width: (screenWidth - 56) / 3,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    zIndex: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  tabTextInactive: {
    color: '#6b7280',
  },
  contentContainer: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  descriptionContainer: {
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  keyStatsContainer: {
    gap: 12,
  },
  keyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
  },
  blueBackground: {
    backgroundColor: '#eff6ff',
  },
  purpleBackground: {
    backgroundColor: '#faf5ff',
  },
  greenBackground: {
    backgroundColor: '#f0fdf4',
  },
  keyStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyStatLabel: {
    marginLeft: 12,
    fontWeight: '500',
    color: '#374151',
  },
  keyStatValueBlue: {
    fontWeight: '600',
    color: '#1d4ed8',
  },
  keyStatValuePurple: {
    fontWeight: '600',
    color: '#7c3aed',
    textTransform: 'capitalize',
  },
  keyStatValueGreen: {
    fontWeight: '600',
    color: '#059669',
  },
  keyStatValueRed: {
    fontWeight: '600',
    color: '#dc2626',
  },
  walkingPrefsContainer: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  walkingPrefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walkingPrefRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walkingPrefLabel: {
    marginLeft: 8,
    color: '#374151',
  },
  walkingPrefValue: {
    fontWeight: '600',
    color: '#4f46e5',
  },
  walkingPrefValueGreen: {
    fontWeight: '600',
    color: '#059669',
  },
  walkingPrefValueRed: {
    fontWeight: '600',
    color: '#dc2626',
  },
  personalityContainer: {
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  personalityMeter: {
    marginBottom: 20,
  },
  personalityHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personalityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalityIcon: {
    marginRight: 12,
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  personalityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  personalityValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalityValueText: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  personalityValueMax: {
    fontSize: 12,
    color: '#9ca3af',
  },
  personalityBarContainer: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  personalityBar: {
    height: '100%',
    borderRadius: 4,
  },
  compatibilityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  compatibilityItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
  },
  compatibilityItemActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  compatibilityItemInactive: {
    backgroundColor: '#f9fafb',
  },
  compatibilityIcon: {
    marginBottom: 12,
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  compatibilityLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  compatibilityLabelActive: {
    color: '#1f2937',
  },
  compatibilityLabelInactive: {
    color: '#6b7280',
  },
  compatibilityStatus: {
    marginTop: 4,
    fontSize: 12,
  },
  compatibilityStatusActive: {
    color: '#059669',
  },
  compatibilityStatusInactive: {
    color: '#9ca3af',
  },
  reviewCard: {
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewContent: {
    padding: 20,
  },
  reviewHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    height: 48,
    width: 48,
    borderRadius: 24,
  },
  reviewerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reviewRatingContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    marginLeft: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  reviewPhotos: {
    marginTop: 16,
  },
  reviewPhoto: {
    marginRight: 12,
    height: 96,
    width: 96,
    borderRadius: 12,
  },
  showMoreButton: {
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  showMoreText: {
    fontWeight: '600',
    color: '#1f2937',
  },
  noReviewsContainer: {
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    padding: 32,
  },
  noReviewsTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
  },
  noReviewsSubtitle: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  ownerCard: {
    overflow: 'hidden',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ownerContent: {
    padding: 20,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    height: 64,
    width: 64,
    borderRadius: 32,
  },
  ownerDetails: {
    marginLeft: 16,
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  ownerRating: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerRatingText: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#374151',
  },
  ownerRole: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  contactButton: {
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  contactButtonText: {
    fontWeight: '600',
    color: 'white',
  },
  distanceContainer: {
    borderRadius: 16,
    padding: 20,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceIcon: {
    marginRight: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#ddd6fe',
  },
  distanceDetails: {
    flex: 1,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#581c87',
  },
  distanceSubtext: {
    fontSize: 14,
    color: '#7c3aed',
  },
  healthContainer: {
    gap: 12,
  },
  healthItem: {
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    padding: 16,
  },
  specialNeedsItem: {
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    padding: 16,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  healthContent: {
    marginLeft: 12,
    flex: 1,
  },
  healthTitle: {
    fontWeight: '600',
    color: '#92400e',
  },
  healthText: {
    marginTop: 4,
    fontSize: 14,
    color: '#b45309',
  },
  specialNeedsTitle: {
    fontWeight: '600',
    color: '#1e40af',
  },
  specialNeedsText: {
    marginTop: 4,
    fontSize: 14,
    color: '#2563eb',
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  walkButton: {
    flex: 1,
  },
  walkButtonGradient: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  walkButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 120,
  },
  directionsButtonText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  reviewButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    paddingVertical: 16,
  },
  reviewButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#374151',
  },
});

export default memo(EnhancedDogDetailPanel);