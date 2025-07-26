import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { Avatar, Badge, useTheme } from 'react-native-paper';

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

interface MaterialCustomMapMarkerProps {
  dog?: Dog;
  emergency?: Emergency;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

export default function MaterialCustomMapMarker({
  dog,
  emergency,
  size = 'medium',
  animated = true
}: MaterialCustomMapMarkerProps) {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Pulse animation for high severity emergencies
    if (emergency && emergency.severity === 'high' && animated) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, [emergency, animated]);

  const getSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 56;
      default: return 44;
    }
  };

  const getMarkerContent = () => {
    const markerSize = getSize();
    
    if (dog) {
      const isDogStray = dog.dog_type === 'stray';
      const backgroundColor = isDogStray ? theme.colors.error : theme.colors.primary;
      const icon = isDogStray ? 'dog-side' : 'dog';
      
      return (
        <Avatar.Icon
          size={markerSize}
          icon={icon}
          style={{ 
            backgroundColor,
            borderWidth: 3,
            borderColor: theme.colors.surface,
          }}
        />
      );
    }

    if (emergency) {
      let backgroundColor = theme.colors.error;
      let icon = 'alert';
      
      switch (emergency.severity) {
        case 'low':
          backgroundColor = theme.colors.tertiary;
          break;
        case 'medium':
          backgroundColor = theme.colors.secondary;
          break;
        case 'high':
          backgroundColor = theme.colors.error;
          icon = 'alert-octagon';
          break;
      }
      
      return (
        <Avatar.Icon
          size={markerSize}
          icon={icon}
          style={{ 
            backgroundColor,
            borderWidth: 3,
            borderColor: theme.colors.surface,
          }}
        />
      );
    }

    // Default marker
    return (
      <Avatar.Icon
        size={markerSize}
        icon="map-marker"
        style={{ 
          backgroundColor: theme.colors.primary,
          borderWidth: 3,
          borderColor: theme.colors.surface,
        }}
      />
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            ...(emergency && emergency.severity === 'high' ? [{ scale: pulseAnim }] : [])
          ],
        }
      ]}
    >
      {getMarkerContent()}
      
      {/* Badge for stray dogs */}
      {dog && dog.dog_type === 'stray' && (
        <Badge
          size={16}
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: theme.colors.error,
          }}
        >
          !
        </Badge>
      )}

      {/* Badge for high severity emergencies */}
      {emergency && emergency.severity === 'high' && (
        <Badge
          size={16}
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: theme.colors.error,
          }}
        >
          ⚡
        </Badge>
      )}

      {/* Volunteers count for emergencies */}
      {emergency && emergency.volunteers_needed > 1 && (
        <Badge
          size={20}
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            backgroundColor: theme.colors.primaryContainer,
          }}
        >
          {emergency.volunteers_needed}
        </Badge>
      )}

      {/* Drop shadow */}
      <View style={[
        styles.shadow,
        { 
          backgroundColor: theme.colors.shadow,
          width: getSize() * 0.8,
          height: getSize() * 0.2,
        }
      ]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    position: 'absolute',
    bottom: -8,
    borderRadius: 20,
    opacity: 0.2,
    zIndex: -1,
  },
}); 