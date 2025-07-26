import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface CustomMapMarkerProps {
  type: 'dog' | 'emergency' | 'cluster';
  color: string;
  size?: 'small' | 'medium' | 'large';
  count?: number;
  severity?: string;
  dogType?: string;
  animated?: boolean;
}

const CustomMapMarker: React.FC<CustomMapMarkerProps> = ({
  type,
  color,
  size = 'medium',
  count,
  severity,
  dogType,
  animated = true
}) => {
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

    // Pulse animation for emergencies
    if (type === 'emergency' && severity === 'critical' && animated) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    }
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small': return 28;
      case 'large': return 48;
      default: return 36;
    }
  };

  const getIcon = () => {
    const iconSize = getSize() * 0.8;
    
    switch (type) {
      case 'dog':
        if (dogType === 'stray') {
          return <Image source={require('../assets/strayDog.png')} style={{ width: iconSize, height: iconSize }} />;
        } else {
          return <Image source={require('../assets/ownedDog.png')} style={{ width: iconSize, height: iconSize }} />;
        }
      case 'emergency':
        return <Image source={require('../assets/rescueDog.png')} style={{ width: iconSize, height: iconSize }} />;
      case 'cluster':
        return <Text style={[styles.clusterText, { fontSize: getSize() * 0.35 }]}>{count}</Text>;
      default:
        return <Image source={require('../assets/dog.png')} style={{ width: iconSize, height: iconSize }} />;
    }
  };

  const markerSize = getSize();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: markerSize,
          height: markerSize,
          backgroundColor: color,
          transform: [
            { scale: scaleAnim },
            ...(type === 'emergency' && severity === 'critical' ? [{ scale: pulseAnim }] : [])
          ],
        }
      ]}
    >
      {getIcon()}
      
      {/* Shadow/Glow effect for critical emergencies */}
      {type === 'emergency' && severity === 'critical' && (
        <View style={[styles.glow, { backgroundColor: color }]} />
      )}

      {/* Dog type indicator */}
      {type === 'dog' && dogType === 'stray' && (
        <View style={styles.indicator}>
          <Text style={styles.indicatorText}>!</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  clusterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  glow: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: 50,
    opacity: 0.3,
    zIndex: -1,
  },
  indicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  indicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 

export default CustomMapMarker; 