import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { openGoogleMapsNavigation } from '../lib/mapService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.5;

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

interface MapBottomSheetProps {
  visible: boolean;
  item: Dog | Emergency | null;
  favorites: string[];
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onNavigate?: (lat: number, lng: number, label: string) => void; // Made optional since we'll use the service
}

const MapBottomSheet: React.FC<MapBottomSheetProps> = ({
  visible,
  item,
  favorites,
  onClose,
  onToggleFavorite,
  onNavigate,
}) => {
  const slideAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && item) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: BOTTOM_SHEET_HEIGHT,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, item]);

  if (!visible || !item) return null;

  const isDog = 'name' in item;
  const isEmergency = 'emergency_type' in item;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleFavorite(item.id);
  };

  const handleNavigate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    if (isDog) {
      const dog = item as Dog;
      // Determine reason based on dog type
      let reason = 'Visit this dog';
      if (dog.dog_type === 'stray') {
        reason = 'Needs help and care';
      } else if (dog.dog_type === 'rescue') {
        reason = 'Available for adoption';
      } else if (dog.dog_type === 'owned') {
        reason = 'Available for walks';
      }
      
      await openGoogleMapsNavigation(dog.latitude, dog.longitude, dog.name, reason);
    } else {
      const emergency = item as Emergency;
      const emergencyName = emergency.emergency_type?.replace('_', ' ').toUpperCase() || 'Emergency';
      await openGoogleMapsNavigation(emergency.latitude, emergency.longitude, emergencyName, 'Emergency assistance needed');
    }
    
    // Fallback to old method if onNavigate is provided
    if (onNavigate) {
      const label = isDog ? (item as Dog).name : `Emergency: ${(item as Emergency).emergency_type}`;
      onNavigate(item.latitude, item.longitude, label);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#84cc16';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity: opacityAnim }
      ]}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />
      
      <Animated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <BlurView intensity={100} style={StyleSheet.absoluteFillObject}>
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Handle */}
            <View style={styles.handle} />
            
            {isDog ? (
              // Dog Details
              <View style={styles.section}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    {(item as Dog).profile_image_url ? (
                      <Image 
                        source={{ uri: (item as Dog).profile_image_url }} 
                        style={styles.profileImage}
                      />
                    ) : (
                      <LinearGradient
                        colors={['#60a5fa', '#3b82f6']}
                        style={styles.profileImagePlaceholder}
                      >
                        <Ionicons name="paw" size={32} color="white" />
                      </LinearGradient>
                    )}
                    
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>{(item as Dog).name}</Text>
                      <Text style={styles.subtitle}>
                        {(item as Dog).breed} • {(item as Dog).size}
                      </Text>
                      {(item as Dog).dog_type === 'stray' && (
                        <View style={styles.strayBadge}>
                          <Text style={styles.strayBadgeText}>STRAY</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <Pressable onPress={handleFavorite} style={styles.favoriteButton}>
                    <Ionicons 
                      name={favorites.includes(item.id) ? "heart" : "heart-outline"} 
                      size={28} 
                      color={favorites.includes(item.id) ? "#ef4444" : "#9ca3af"} 
                    />
                  </Pressable>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Ionicons name="location" size={24} color="#10b981" />
                    <Text style={styles.statValue}>
                      {(item as Dog).distance_km?.toFixed(1)}km
                    </Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="star" size={24} color="#f59e0b" />
                    <Text style={styles.statValue}>
                      {(item as Dog).rating_average?.toFixed(1) || 'N/A'}
                    </Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="calendar" size={24} color="#8b5cf6" />
                    <Text style={styles.statValue}>
                      {(item as Dog).age || 'Unknown'}
                    </Text>
                    <Text style={styles.statLabel}>Age</Text>
                  </View>
                </View>

                {/* Owner Info */}
                {(item as Dog).owner_name && (
                  <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                      <Ionicons name="person" size={20} color="#6b7280" />
                      <Text style={styles.infoTitle}>Owner</Text>
                    </View>
                    <Text style={styles.infoValue}>{(item as Dog).owner_name}</Text>
                  </View>
                )}

                {/* Vaccination Status */}
                {(item as Dog).vaccination_status && (
                  <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                      <MaterialIcons name="medical-services" size={20} color="#6b7280" />
                      <Text style={styles.infoTitle}>Vaccination</Text>
                    </View>
                    <Text style={[
                      styles.infoValue,
                      { color: (item as Dog).vaccination_status === 'up_to_date' ? '#10b981' : '#f59e0b' }
                    ]}>
                      {(item as Dog).vaccination_status?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  <Pressable onPress={handleNavigate} style={styles.primaryButton}>
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={styles.buttonGradient}
                    >
                      <MaterialIcons name="navigation" size={24} color="white" />
                      <Text style={styles.primaryButtonText}>Navigate</Text>
                    </LinearGradient>
                  </Pressable>
                  
                  <Pressable style={styles.secondaryButton}>
                    <Ionicons name="chatbubble-outline" size={24} color="#3b82f6" />
                    <Text style={styles.secondaryButtonText}>Contact</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              // Emergency Details
              <View style={styles.section}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <LinearGradient
                      colors={[getSeverityColor((item as Emergency).severity), getSeverityColor((item as Emergency).severity) + '80']}
                      style={styles.profileImagePlaceholder}
                    >
                      <MaterialIcons name="emergency" size={32} color="white" />
                    </LinearGradient>
                    
                    <View style={styles.titleContainer}>
                      <Text style={styles.title}>
                        {(item as Emergency).emergency_type.replace('_', ' ').toUpperCase()}
                      </Text>
                      <View style={[
                        styles.severityBadge,
                        { backgroundColor: getSeverityColor((item as Emergency).severity) + '20' }
                      ]}>
                        <Text style={[
                          styles.severityBadgeText,
                          { color: getSeverityColor((item as Emergency).severity) }
                        ]}>
                          {(item as Emergency).severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionCard}>
                  <Text style={styles.description}>{(item as Emergency).description}</Text>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Ionicons name="location" size={24} color="#10b981" />
                    <Text style={styles.statValue}>
                      {(item as Emergency).distance_km?.toFixed(1)}km
                    </Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="people" size={24} color="#3b82f6" />
                    <Text style={styles.statValue}>
                      {(item as Emergency).volunteers_responded}/{(item as Emergency).volunteers_needed}
                    </Text>
                    <Text style={styles.statLabel}>Volunteers</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="time" size={24} color="#8b5cf6" />
                    <Text style={styles.statValue}>
                      {formatTimeAgo((item as Emergency).created_at)}
                    </Text>
                    <Text style={styles.statLabel}>Reported</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  <Pressable onPress={handleNavigate} style={styles.primaryButton}>
                    <LinearGradient
                      colors={['#ef4444', '#dc2626']}
                      style={styles.buttonGradient}
                    >
                      <MaterialIcons name="emergency" size={24} color="white" />
                      <Text style={styles.primaryButtonText}>Respond</Text>
                    </LinearGradient>
                  </Pressable>
                  
                  <Pressable style={styles.secondaryButton}>
                    <Ionicons name="share-outline" size={24} color="#3b82f6" />
                    <Text style={styles.secondaryButtonText}>Share</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Close Button */}
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </ScrollView>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  content: {
    flex: 1,
    padding: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  section: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  strayBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  strayBadgeText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  severityBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
}); 

export default MapBottomSheet; 