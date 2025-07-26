import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Animated,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MapControlPanelProps {
  visible: boolean;
  onClose: () => void;
  settings: {
    autoRefresh: boolean;
    notifications: boolean;
    heatmapEnabled: boolean;
    clusteringEnabled: boolean;
    trackingMode: boolean;
    radiusFilter: number;
    mapStyle: string;
  };
  onSettingChange: (key: string, value: any) => void;
  analytics: {
    totalDogs: number;
    totalEmergencies: number;
    averageDistance: number;
    lastUpdate: string;
  };
}

const MapControlPanel: React.FC<MapControlPanelProps> = ({
  visible,
  onClose,
  settings,
  onSettingChange,
  analytics,
}) => {
  const [slideAnim] = useState(new Animated.Value(SCREEN_WIDTH));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_WIDTH,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSettingChange = (key: string, value: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSettingChange(key, value);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { transform: [{ translateX: slideAnim }] }
      ]}
    >
      <BlurView intensity={95} style={StyleSheet.absoluteFillObject}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Map Controls</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </LinearGradient>

          {/* Analytics Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analytics</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <Ionicons name="paw" size={32} color="#3b82f6" />
                <Text style={styles.analyticsValue}>{analytics.totalDogs}</Text>
                <Text style={styles.analyticsLabel}>Total Dogs</Text>
              </View>
              
              <View style={styles.analyticsCard}>
                <MaterialIcons name="emergency" size={32} color="#ef4444" />
                <Text style={styles.analyticsValue}>{analytics.totalEmergencies}</Text>
                <Text style={styles.analyticsLabel}>Emergencies</Text>
              </View>
              
              <View style={styles.analyticsCard}>
                <Ionicons name="location" size={32} color="#10b981" />
                <Text style={styles.analyticsValue}>
                  {analytics.averageDistance.toFixed(1)}km
                </Text>
                <Text style={styles.analyticsLabel}>Avg Distance</Text>
              </View>
              
              <View style={styles.analyticsCard}>
                <MaterialIcons name="update" size={32} color="#f59e0b" />
                <Text style={styles.analyticsValue}>
                  {new Date(analytics.lastUpdate).toLocaleTimeString()}
                </Text>
                <Text style={styles.analyticsLabel}>Last Update</Text>
              </View>
            </View>
          </View>

          {/* Display Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="layers" size={24} color="#6b7280" />
                <Text style={styles.settingLabel}>Heatmap Overlay</Text>
              </View>
              <Switch
                value={settings.heatmapEnabled}
                onValueChange={(value) => handleSettingChange('heatmapEnabled', value)}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={settings.heatmapEnabled ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="group-work" size={24} color="#6b7280" />
                <Text style={styles.settingLabel}>Marker Clustering</Text>
              </View>
              <Switch
                value={settings.clusteringEnabled}
                onValueChange={(value) => handleSettingChange('clusteringEnabled', value)}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={settings.clusteringEnabled ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="location" size={24} color="#6b7280" />
                <Text style={styles.settingLabel}>Location Tracking</Text>
              </View>
              <Switch
                value={settings.trackingMode}
                onValueChange={(value) => handleSettingChange('trackingMode', value)}
                trackColor={{ false: '#d1d5db', true: '#ef4444' }}
                thumbColor={settings.trackingMode ? '#ffffff' : '#f3f4f6'}
              />
            </View>
          </View>

          {/* Map Style */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Map Style</Text>
            <View style={styles.mapStyleGrid}>
              {['standard', 'satellite', 'hybrid', 'terrain'].map((style) => (
                <Pressable
                  key={style}
                  onPress={() => handleSettingChange('mapStyle', style)}
                  style={[
                    styles.mapStyleOption,
                    settings.mapStyle === style && styles.mapStyleOptionActive
                  ]}
                >
                  <Text style={[
                    styles.mapStyleText,
                    settings.mapStyle === style && styles.mapStyleTextActive
                  ]}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Search Radius */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Radius</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                {settings.radiusFilter}km radius
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                value={settings.radiusFilter}
                                 onValueChange={(value: number) => handleSettingChange('radiusFilter', Math.round(value))}
                minimumTrackTintColor="#10b981"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#10b981"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>1km</Text>
                <Text style={styles.sliderLabelText}>100km</Text>
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={24} color="#6b7280" />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => handleSettingChange('notifications', value)}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={settings.notifications ? '#ffffff' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="autorenew" size={24} color="#6b7280" />
                <Text style={styles.settingLabel}>Auto Refresh</Text>
              </View>
              <Switch
                value={settings.autoRefresh}
                onValueChange={(value) => handleSettingChange('autoRefresh', value)}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={settings.autoRefresh ? '#ffffff' : '#f3f4f6'}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <Pressable style={styles.actionButton}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="download" size={24} color="white" />
                <Text style={styles.actionButtonText}>Download Offline Maps</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="share" size={24} color="white" />
                <Text style={styles.actionButtonText}>Share Current View</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.actionButtonGradient}
              >
                <MaterialIcons name="feedback" size={24} color="white" />
                <Text style={styles.actionButtonText}>Send Feedback</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </BlurView>
    </Animated.View>
  );
}

export default MapControlPanel;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT,
    zIndex: 1000,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  analyticsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  mapStyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mapStyleOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mapStyleOptionActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  mapStyleText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  mapStyleTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  sliderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
}); 