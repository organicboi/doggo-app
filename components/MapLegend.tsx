import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { strayDogSvg } from '../assets/svg-strings/strayDogSvg';
import { rescueDogSvg } from '../assets/svg-strings/rescueDogSvg';
import { ownedDogSvg } from '../assets/svg-strings/ownedDogSvg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MapLegendProps {
  dogCount: number;
  strayCount: number;
  rescueCount: number;
  ownedCount: number;
  emergencyCount: number;
}

export default function MapLegend({
  dogCount,
  strayCount,
  rescueCount,
  ownedCount,
  emergencyCount,
}: MapLegendProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(animatedHeight, {
        toValue: toValue * 280, // Height of expanded content
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(rotateAnim, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    setIsExpanded(!isExpanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const LegendItem = ({ 
    svgContent, 
    label, 
    count, 
    color, 
    description 
  }: { 
    svgContent?: string; 
    label: string; 
    count: number; 
    color: string; 
    description: string;
  }) => (
    <View style={styles.legendItem}>
      <View style={styles.legendIcon}>
        {svgContent ? (
          <View style={[
            styles.svgContainer,
            {
              backgroundColor: 'white',
              borderWidth: 2,
              borderColor: color,
            }
          ]}>
            <SvgXml xml={svgContent} width={24} height={24} />
          </View>
        ) : (
          <View style={[
            styles.emergencyIcon,
            { backgroundColor: color }
          ]}>
            <MaterialIcons name="warning" size={16} color="white" />
          </View>
        )}
      </View>
      <View style={styles.legendContent}>
        <View style={styles.legendHeader}>
          <Text style={styles.legendLabel}>{label}</Text>
          <View style={[styles.countBadge, { backgroundColor: color }]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        </View>
        <Text style={styles.legendDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Legend Button */}
      <Pressable onPress={toggleExpanded} style={styles.legendButton}>
        <BlurView intensity={80} tint="light" style={styles.buttonBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(248,250,252,0.90)']}
            style={styles.buttonContent}
          >
            <View style={styles.buttonLeft}>
              <MaterialIcons name="map" size={20} color="#10b981" />
              <Text style={styles.buttonText}>Legend</Text>
            </View>
            <View style={styles.buttonRight}>
              <View style={styles.quickStats}>
                <Text style={styles.quickStatsText}>{dogCount} Dogs</Text>
                {emergencyCount > 0 && (
                  <Text style={[styles.quickStatsText, { color: '#ef4444' }]}>
                    {emergencyCount} Alerts
                  </Text>
                )}
              </View>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <MaterialIcons name="expand-more" size={20} color="#6b7280" />
              </Animated.View>
            </View>
          </LinearGradient>
        </BlurView>
      </Pressable>

      {/* Expanded Legend Content */}
      <Animated.View 
        style={[
          styles.expandedContent,
          {
            height: animatedHeight,
            opacity: animatedHeight.interpolate({
              inputRange: [0, 280],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          }
        ]}
      >
        <BlurView intensity={90} tint="light" style={styles.contentBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.98)', 'rgba(248,250,252,0.95)']}
            style={styles.legendList}
          >
            <View style={styles.legendHeader}>
              <Text style={styles.legendTitle}>Map Legend</Text>
              <Text style={styles.legendSubtitle}>Tap markers to learn more</Text>
            </View>

            <View style={styles.legendItems}>
              <LegendItem
                svgContent={strayDogSvg}
                label="Stray Dogs"
                count={strayCount}
                color="#f59e0b"
                description="Dogs without owners that need help"
              />
              
              <LegendItem
                svgContent={rescueDogSvg}
                label="Rescue Dogs"
                count={rescueCount}
                color="#ef4444"
                description="Dogs available for adoption"
              />
              
              <LegendItem
                svgContent={ownedDogSvg}
                label="Owned Dogs"
                count={ownedCount}
                color="#10b981"
                description="Dogs with loving families"
              />

              {emergencyCount > 0 && (
                <LegendItem
                  label="Emergency Alerts"
                  count={emergencyCount}
                  color="#dc2626"
                  description="Urgent situations requiring help"
                />
              )}
            </View>

            <View style={styles.legendFooter}>
              <Text style={styles.footerText}>
                🐾 Tap any marker to view details and take action
              </Text>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    right: 12,
    zIndex: 1000,
    maxWidth: SCREEN_WIDTH - 24,
  },
  
  // Legend Button Styles
  legendButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonBlur: {
    borderRadius: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 140,
  },
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  buttonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickStats: {
    alignItems: 'flex-end',
  },
  quickStatsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    lineHeight: 12,
  },

  // Expanded Content Styles
  expandedContent: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  contentBlur: {
    flex: 1,
    borderRadius: 20,
  },
  legendList: {
    flex: 1,
    padding: 20,
  },
  legendHeader: {
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  legendSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Legend Items
  legendItems: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  legendIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContent: {
    flex: 1,
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  legendDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },

  // Footer
  legendFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(209,213,219,0.5)',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 