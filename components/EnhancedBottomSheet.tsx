import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Text, useTheme, Button, Chip } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { strayDogSvg } from '../assets/svg-strings/strayDogSvg';
import { rescueDogSvg } from '../assets/svg-strings/rescueDogSvg';
import { ownedDogSvg } from '../assets/svg-strings/ownedDogSvg';
import * as Haptics from 'expo-haptics';
import { openGoogleMapsNavigation } from '../lib/mapService';

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

interface EnhancedBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  dog?: Dog;
  emergency?: Emergency;
}

export default function EnhancedBottomSheet({
  visible,
  onClose,
  dog,
  emergency,
}: EnhancedBottomSheetProps) {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleActionPress = async (action: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (action === 'navigate' && dog) {
      // Determine reason based on dog type or description
      let reason = 'Visit this dog';
      if (dog.dog_type === 'stray') {
        reason = 'Needs help and care';
      } else if (dog.dog_type === 'rescue') {
        reason = 'Available for adoption';
      } else if (dog.description?.toLowerCase().includes('medical') || dog.description?.toLowerCase().includes('help')) {
        reason = 'Needs medical help';
      } else if (dog.dog_type === 'owned') {
        reason = 'Available for walks';
      }
      
      await openGoogleMapsNavigation(dog.latitude, dog.longitude, dog.name, reason);
    } else {
      // Handle other actions here
      console.log(`Action pressed: ${action}`);
    }
  };

  const getSvgForDogType = (dogType?: string) => {
    switch (dogType) {
      case 'stray':
        return strayDogSvg;
      case 'rescue':
        return rescueDogSvg;
      case 'owned':
        return ownedDogSvg;
      default:
        return strayDogSvg;
    }
  };

  const getTypeColor = (dogType?: string) => {
    switch (dogType) {
      case 'stray':
        return '#f59e0b';
      case 'rescue':
        return '#ef4444';
      case 'owned':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatAge = (years?: number, months?: number) => {
    if (years && months) {
      return `${years}y ${months}m`;
    } else if (years) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (months) {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    return 'Unknown';
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <BlurView intensity={95} tint="light" style={styles.sheetBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.98)', 'rgba(248,250,252,0.95)']}
            style={styles.sheetContent}
          >
            {/* Handle */}
            <View style={styles.handle} />

            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={20} color="#6b7280" />
            </Pressable>

            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {dog ? (
                // Dog Content
                <View style={styles.content}>
                  {/* Header Section */}
                  <View style={styles.header}>
                    <View style={styles.iconContainer}>
                      <View style={[
                        styles.dogIcon,
                        { borderColor: getTypeColor(dog.dog_type) }
                      ]}>
                        <SvgXml 
                          xml={getSvgForDogType(dog.dog_type)} 
                          width={48} 
                          height={48} 
                        />
                      </View>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: getTypeColor(dog.dog_type) }
                      ]}>
                        <Text style={styles.typeBadgeText}>
                          {dog.dog_type?.toUpperCase() || 'DOG'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.headerInfo}>
                      <Text style={styles.dogName}>{dog.name}</Text>
                      <Text style={styles.dogBreed}>
                        {dog.breed} • {dog.size}
                      </Text>
                      <Text style={styles.distance}>
                        📍 {dog.distance_km?.toFixed(1)}km away
                      </Text>
                    </View>

                    {dog.rating_average && (
                      <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={16} color="#f59e0b" />
                        <Text style={styles.rating}>
                          {dog.rating_average.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Info Chips */}
                  <View style={styles.chipContainer}>
                    <Chip 
                      icon="cake" 
                      style={styles.chip}
                      textStyle={styles.chipText}
                    >
                      {formatAge(dog.age_years, dog.age_months)}
                    </Chip>
                    
                    {dog.is_vaccinated && (
                      <Chip 
                        icon="medical-bag" 
                        style={[styles.chip, { backgroundColor: '#d1fae5' }]}
                        textStyle={[styles.chipText, { color: '#065f46' }]}
                      >
                        Vaccinated
                      </Chip>
                    )}
                    
                    {dog.owner_name && (
                      <Chip 
                        icon="account" 
                        style={styles.chip}
                        textStyle={styles.chipText}
                      >
                        {dog.owner_name}
                      </Chip>
                    )}
                  </View>

                  {/* Description */}
                  {dog.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionTitle}>About</Text>
                      <Text style={styles.description}>{dog.description}</Text>
                    </View>
                  )}

                  {/* Profile Image */}
                  {dog.profile_image_url && (
                    <View style={styles.imageContainer}>
                      <Image 
                        source={{ uri: dog.profile_image_url }}
                        style={styles.profileImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <Pressable 
                      style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                      onPress={() => handleActionPress('navigate')}
                    >
                      <MaterialIcons name="directions" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Navigate</Text>
                    </Pressable>

                    <Pressable 
                      style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                      onPress={() => handleActionPress('contact')}
                    >
                      <MaterialIcons name="phone" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Contact</Text>
                    </Pressable>

                    <Pressable 
                      style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
                      onPress={() => handleActionPress('share')}
                    >
                      <MaterialIcons name="share" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Share</Text>
                    </Pressable>
                  </View>

                  {/* Emergency Actions for Stray Dogs */}
                  {dog.dog_type === 'stray' && (
                    <View style={styles.emergencyActions}>
                      <Text style={styles.emergencyTitle}>Need Help?</Text>
                      <View style={styles.emergencyButtons}>
                        <Pressable 
                          style={[styles.emergencyButton, { backgroundColor: '#ef4444' }]}
                          onPress={() => handleActionPress('report_emergency')}
                        >
                          <MaterialIcons name="warning" size={18} color="white" />
                          <Text style={styles.emergencyButtonText}>Report Emergency</Text>
                        </Pressable>
                        
                        <Pressable 
                          style={[styles.emergencyButton, { backgroundColor: '#f59e0b' }]}
                          onPress={() => handleActionPress('offer_help')}
                        >
                          <MaterialIcons name="volunteer-activism" size={18} color="white" />
                          <Text style={styles.emergencyButtonText}>Offer Help</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              ) : emergency ? (
                // Emergency Content
                <View style={styles.content}>
                  <View style={styles.emergencyHeader}>
                    <View style={[
                      styles.emergencyIcon,
                      { 
                        backgroundColor: emergency.severity === 'high' ? '#ef4444' : 
                                        emergency.severity === 'medium' ? '#f59e0b' : '#10b981'
                      }
                    ]}>
                      <MaterialIcons name="warning" size={32} color="white" />
                    </View>
                    
                    <View style={styles.emergencyInfo}>
                      <Text style={styles.emergencyType}>
                        🚨 {emergency.emergency_type.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.emergencyDistance}>
                        📍 {emergency.distance_km?.toFixed(1)}km away
                      </Text>
                      <View style={[
                        styles.severityBadge,
                        { 
                          backgroundColor: emergency.severity === 'high' ? '#ef4444' : 
                                          emergency.severity === 'medium' ? '#f59e0b' : '#10b981'
                        }
                      ]}>
                        <Text style={styles.severityText}>
                          {emergency.severity.toUpperCase()} PRIORITY
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.emergencyDescription}>
                    {emergency.description}
                  </Text>

                  <View style={styles.volunteerInfo}>
                    <Text style={styles.volunteerText}>
                      {emergency.volunteers_responded} of {emergency.volunteers_needed} volunteers responded
                    </Text>
                  </View>

                  <View style={styles.emergencyActionButtons}>
                    <Pressable 
                      style={[styles.actionButton, { backgroundColor: '#ef4444', flex: 1.5 }]}
                      onPress={() => handleActionPress('volunteer')}
                    >
                      <MaterialIcons name="volunteer-activism" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Help Now</Text>
                    </Pressable>

                    <Pressable 
                      style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                      onPress={() => handleActionPress('call')}
                    >
                      <MaterialIcons name="call" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000, // Render above bottom tabs
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetBlur: {
    flex: 1,
  },
  sheetContent: {
    flex: 1,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },

  // Dog Content Styles
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  iconContainer: {
    position: 'relative',
  },
  dogIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: 'white',
  },
  headerInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  dogBreed: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },

  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#f3f4f6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Description
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },

  // Image
  imageContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
    fontWeight: '700',
    color: 'white',
  },

  // Emergency Actions
  emergencyActions: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 12,
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  emergencyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },

  // Emergency Content Styles
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  emergencyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyType: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  emergencyDistance: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 8,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'white',
  },
  emergencyDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  volunteerInfo: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  volunteerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  emergencyActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
}); 