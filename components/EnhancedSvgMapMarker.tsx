import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Badge, useTheme } from 'react-native-paper';
import { SvgXml } from 'react-native-svg';

// Import SVG strings
import { strayDogSvg } from '../assets/svg-strings/strayDogSvg';
import { rescueDogSvg } from '../assets/svg-strings/rescueDogSvg';
import { ownedDogSvg } from '../assets/svg-strings/ownedDogSvg';

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

interface EnhancedSvgMapMarkerProps {
  dog?: Dog;
  emergency?: Emergency;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

export default function EnhancedSvgMapMarker({
  dog,
  emergency,
  size = 'medium',
  animated = true
}: EnhancedSvgMapMarkerProps) {
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
      let svgContent;
      
      // Use SVG markers based on dog type
      switch (dog.dog_type) {
        case 'stray':
          svgContent = strayDogSvg;
          break;
        case 'rescue':
          svgContent = rescueDogSvg;
          break;
        case 'owned':
          svgContent = ownedDogSvg;
          break;
        default:
          svgContent = strayDogSvg;
          break;
      }
      
      return (
        <View style={[styles.markerContainer, { width: markerSize, height: markerSize }]}>
          <View style={[
            styles.svgWrapper, 
            { 
              width: markerSize, 
              height: markerSize,
              borderRadius: markerSize / 2,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }
          ]}>
            <SvgXml xml={svgContent} width={markerSize} height={markerSize} />
          </View>
        </View>
      );
    }

    if (emergency) {
      // For emergencies, use a colored circle with alert icon
      let backgroundColor = theme.colors.error;
      
      switch (emergency.severity) {
        case 'low':
          backgroundColor = theme.colors.tertiary;
          break;
        case 'medium':
          backgroundColor = theme.colors.secondary;
          break;
        case 'high':
          backgroundColor = theme.colors.error;
          break;
      }
      
      return (
        <View style={[
          styles.emergencyMarker,
          {
            width: markerSize,
            height: markerSize,
            backgroundColor,
            borderRadius: markerSize / 2,
            borderWidth: 3,
            borderColor: theme.colors.surface,
          }
        ]}>
          <View style={styles.alertIcon}>
            <View style={[styles.alertTriangle, { borderBottomColor: theme.colors.surface }]} />
            <View style={[styles.alertDot, { backgroundColor: theme.colors.surface }]} />
          </View>
        </View>
      );
    }

    // Default marker
    return (
      <View style={[
        styles.defaultMarker,
        {
          width: markerSize,
          height: markerSize,
          backgroundColor: theme.colors.primary,
          borderRadius: markerSize / 2,
          borderWidth: 3,
          borderColor: theme.colors.surface,
        }
      ]}>
        <SvgXml xml={strayDogSvg} width={markerSize * 0.7} height={markerSize * 0.7} />
      </View>
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

      {/* Badge for rescue dogs */}
      {dog && dog.dog_type === 'rescue' && (
        <Badge
          size={16}
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: theme.colors.tertiary,
          }}
        >
          ❤️
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
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyMarker: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultMarker: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  alertDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  shadow: {
    position: 'absolute',
    bottom: -8,
    borderRadius: 20,
    opacity: 0.2,
    zIndex: -1,
  },
}); 