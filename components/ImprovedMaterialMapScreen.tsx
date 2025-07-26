import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Alert, Linking, Platform, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker, Region, Heatmap, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import {
  Appbar,
  FAB,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Portal,
  Modal,
  Surface,
  Text,
  Searchbar,
  ActivityIndicator,
  ToggleButton,
  useTheme,
  Badge,
  Avatar,
  IconButton,
  Menu,
  Divider,
  List,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import EnhancedCustomMapMarker from './EnhancedCustomMapMarker';
import MaterialQuickAddModal from './MaterialQuickAddModal';

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

interface UserLocation {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface FilteredData {
  dogs: Dog[];
  emergencies: Emergency[];
}

type FilterType = 'all' | 'dogs' | 'emergencies' | 'stray' | 'owned';
type MapStyle = 'standard' | 'satellite' | 'hybrid' | 'terrain';

export default function ImprovedMaterialMapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Core state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Dog | Emergency | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [radiusFilter, setRadiusFilter] = useState(50);
  const [trackingMode, setTrackingMode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Refs
  const mapRef = useRef<MapView>(null);

  // Distance calculation function
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filtered data with proper null checking
  const filteredData: FilteredData = useMemo(() => {
    const dogsArray = dogs || [];
    const emergenciesArray = emergencies || [];

    let filteredDogs = dogsArray;
    let filteredEmergencies = emergenciesArray;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredDogs = dogsArray.filter(
        (dog) =>
          dog.name?.toLowerCase().includes(query) ||
          dog.breed?.toLowerCase().includes(query) ||
          dog.owner_name?.toLowerCase().includes(query) ||
          dog.dog_type?.toLowerCase().includes(query)
      );
      filteredEmergencies = emergenciesArray.filter(
        (emergency) =>
          emergency.emergency_type?.toLowerCase().includes(query) ||
          emergency.description?.toLowerCase().includes(query) ||
          emergency.severity?.toLowerCase().includes(query)
      );
    }

    switch (activeFilter) {
      case 'dogs':
        return { dogs: filteredDogs, emergencies: [] };
      case 'emergencies':
        return { dogs: [], emergencies: filteredEmergencies };
      case 'stray':
        return {
          dogs: filteredDogs.filter((dog) => dog.dog_type === 'stray'),
          emergencies: [],
        };
      case 'owned':
        return {
          dogs: filteredDogs.filter((dog) => dog.dog_type !== 'stray'),
          emergencies: [],
        };
      default:
        return { dogs: filteredDogs, emergencies: filteredEmergencies };
    }
  }, [dogs, emergencies, searchQuery, activeFilter]);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to use the map features.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setUserLocation(userLoc);
      await loadData(userLoc);
    } catch (error) {
      console.error('Error initializing map:', error);
      showSnackbar('Could not initialize map. Please try again.');
    }

    setLoading(false);
  };

  const loadData = async (location: UserLocation) => {
    console.log('🔄 Loading data for location:', location);

    try {
      console.log('📡 Loading dogs with direct query...');
      const { data: directDogs, error: directError } = await supabase
        .from('dogs')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('latitude', 0)
        .neq('longitude', 0)
        .limit(100);

      if (!directError && directDogs) {
        console.log(`✅ Direct query successful! Found ${directDogs.length} dogs`);
        const validDogs = directDogs
          .filter(
            (dog: any) =>
              dog.latitude != null &&
              dog.longitude != null &&
              typeof dog.latitude === 'number' &&
              typeof dog.longitude === 'number' &&
              dog.latitude !== 0 &&
              dog.longitude !== 0
          )
          .map((dog: any) => ({
            ...dog,
            distance_km: getDistance(
              location.latitude,
              location.longitude,
              dog.latitude,
              dog.longitude
            ),
          }))
          .filter((dog) => dog.distance_km <= radiusFilter)
          .sort((a, b) => a.distance_km - b.distance_km);

        setDogs(validDogs);
        console.log(`✅ Set ${validDogs.length} valid dogs within ${radiusFilter}km`);
      } else {
        console.error('❌ Direct query error:', directError);
        setDogs([]);
        showSnackbar('Error loading dogs data');
      }

      console.log('📡 Loading emergencies...');
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('latitude', 0)
        .neq('longitude', 0);

      if (emergencyError) {
        console.error('❌ Emergency error:', emergencyError);
        showSnackbar('Error loading emergencies');
        setEmergencies([]);
      } else if (emergencyData) {
        console.log(`✅ Loaded ${emergencyData.length} emergencies`);
        const validEmergencies = emergencyData
          .filter(
            (emergency) =>
              emergency.latitude != null &&
              emergency.longitude != null &&
              emergency.latitude !== 0 &&
              emergency.longitude !== 0 &&
              typeof emergency.latitude === 'number' &&
              typeof emergency.longitude === 'number'
          )
          .map((emergency) => ({
            ...emergency,
            distance_km: getDistance(
              location.latitude,
              location.longitude,
              emergency.latitude,
              emergency.longitude
            ),
          }))
          .filter((emergency) => emergency.distance_km <= radiusFilter)
          .sort((a, b) => a.distance_km - b.distance_km);

        setEmergencies(validEmergencies);
        console.log(`✅ Set ${validEmergencies.length} valid emergencies within ${radiusFilter}km`);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showSnackbar('Error loading map data');
      setDogs([]);
      setEmergencies([]);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const centerOnUser = async () => {
    if (userLocation && mapRef.current) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  const toggleTracking = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTrackingMode(!trackingMode);
    showSnackbar(trackingMode ? 'Location tracking disabled' : 'Location tracking enabled');
  };

  const refreshData = async () => {
    if (userLocation) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadData(userLocation);
      showSnackbar('Map data refreshed');
    }
  };

  // Update data when radius filter changes
  useEffect(() => {
    if (userLocation) {
      loadData(userLocation);
    }
  }, [radiusFilter]);

  const onMapLongPress = async (event: any) => {
    // Extract coordinates immediately to avoid synthetic event pooling issues
    const { latitude, longitude } = event.nativeEvent.coordinate;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedMapLocation({ latitude, longitude });
    setShowQuickAddModal(true);
  };

  const openGoogleMaps = (item: Dog | Emergency) => {
    const latLng = `${item.latitude},${item.longitude}`;
    const label = encodeURIComponent('name' in item ? item.name : item.emergency_type);

    let url = '';
    if (Platform.OS === 'ios') {
      url = `maps://app?saddr=&daddr=${latLng}&q=${label}`;
    } else {
      url = `google.navigation:q=${latLng}(${label})`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&destination_place_id=${label}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
        showSnackbar('Could not open maps application');
      });
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const getFilterChips = () => {
    const filters: { key: FilterType; label: string; icon: string }[] = [
      { key: 'all', label: 'All', icon: 'view-grid' },
      { key: 'dogs', label: 'Dogs', icon: 'dog' },
      { key: 'emergencies', label: 'Emergency', icon: 'alert' },
      { key: 'stray', label: 'Strays', icon: 'help' },
      { key: 'owned', label: 'Owned', icon: 'home' },
    ];

    return filters.map((filter) => (
      <Chip
        key={filter.key}
        icon={filter.icon}
        selected={activeFilter === filter.key}
        onPress={() => setActiveFilter(filter.key)}
        style={{
          marginRight: 8,
          backgroundColor:
            activeFilter === filter.key ? theme.colors.primaryContainer : theme.colors.surface,
        }}
        textStyle={{
          color:
            activeFilter === filter.key ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
        }}>
        {filter.label}
      </Chip>
    ));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
          <Text variant="headlineSmall" style={{ marginTop: 16, color: theme.colors.onBackground }}>
            Finding dogs nearby...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Enhanced Material Design App Bar */}
      <Appbar.Header elevated={true} style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content
          title="🐾 PawPals Map"
          subtitle={`${filteredData.dogs.length} dogs • ${filteredData.emergencies.length} emergencies nearby`}
          titleStyle={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}
          subtitleStyle={{ color: theme.colors.onPrimary, opacity: 0.8 }}
        />
        <Appbar.Action
          icon="tune"
          iconColor={theme.colors.onPrimary}
          onPress={() => setShowFilters(!showFilters)}
        />
        <Menu
          visible={showMenu}
          onDismiss={() => setShowMenu(false)}
          style={{ zIndex: 1100, elevation: 1100 }}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              iconColor={theme.colors.onPrimary}
              onPress={() => setShowMenu(true)}
            />
          }>
          <Menu.Item
            leadingIcon="layers"
            onPress={() => {
              const styles = ['standard', 'satellite', 'hybrid', 'terrain'] as MapStyle[];
              const currentIndex = styles.indexOf(mapStyle);
              setMapStyle(styles[(currentIndex + 1) % styles.length]);
              setShowMenu(false);
              showSnackbar(`Map style: ${styles[(currentIndex + 1) % styles.length]}`);
            }}
            title="Change Map Style"
          />
          <Menu.Item
            leadingIcon={showHeatmap ? 'eye-off' : 'eye'}
            onPress={() => {
              setShowHeatmap(!showHeatmap);
              setShowMenu(false);
              showSnackbar(showHeatmap ? 'Heatmap hidden' : 'Heatmap shown');
            }}
            title={showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
          />
          <Divider />
          <Menu.Item leadingIcon="cog" onPress={() => setShowMenu(false)} title="Settings" />
        </Menu>
      </Appbar.Header>

      {/* Stats Overlay */}
      <View style={[styles.statsOverlay, { top: insets.top + 80 }]}>
        <Surface style={styles.statsCard} elevation={3}>
          <View style={styles.statsRow}>
            <Badge style={styles.statBadge}>{filteredData.dogs.length}</Badge>
            <Text variant="labelMedium" style={styles.statLabel}>
              🐕 Dogs
            </Text>
            <Badge style={[styles.statBadge, { backgroundColor: theme.colors.error }]}>
              {filteredData.emergencies.length}
            </Badge>
            <Text variant="labelMedium" style={styles.statLabel}>
              🚨 Alerts
            </Text>
          </View>
        </Surface>
      </View>

      {/* Floating Search Bar */}
      <View style={[styles.floatingSearchContainer, { top: insets.top + 130 }]}>
        <Searchbar
          placeholder="🔍 Search dogs, breeds..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.floatingSearchBar}
          elevation={4}
          icon="magnify"
          clearIcon="close"
          onFocus={() => setShowFilters(true)}
        />
      </View>

      {/* Enhanced Filter Panel */}
      {showFilters && (
        <Portal>
          <Modal
            visible={showFilters}
            onDismiss={() => setShowFilters(false)}
            contentContainerStyle={styles.filterModal}>
            <Surface style={styles.filterContent} elevation={4}>
              <View style={styles.filterHeader}>
                <Text variant="headlineSmall" style={styles.filterTitle}>
                  🎯 Search Filters
                </Text>
                <IconButton
                  icon="close"
                  onPress={() => setShowFilters(false)}
                  style={styles.closeButton}
                />
              </View>

              <View style={styles.radiusContainer}>
                <Text variant="labelLarge" style={styles.radiusLabel}>
                  📍 Search Radius: {radiusFilter}km
                </Text>
                <ToggleButton.Row
                  onValueChange={(value) => setRadiusFilter(Number(value))}
                  value={radiusFilter.toString()}
                  style={styles.radiusButtons}>
                  <ToggleButton icon="numeric-5" value="5" style={styles.radiusButton} />
                  <ToggleButton icon="numeric-1-circle" value="10" style={styles.radiusButton} />
                  <ToggleButton icon="numeric-2-circle" value="25" style={styles.radiusButton} />
                  <ToggleButton icon="numeric-5-circle" value="50" style={styles.radiusButton} />
                </ToggleButton.Row>
              </View>

              <Text variant="labelLarge" style={styles.filterSectionTitle}>
                🏷️ Categories
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}>
                <View style={styles.chipContainer}>{getFilterChips()}</View>
              </ScrollView>

              <Button
                mode="contained"
                onPress={() => setShowFilters(false)}
                style={styles.applyButton}
                icon="check">
                Apply Filters
              </Button>
            </Surface>
          </Modal>
        </Portal>
      )}

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={userLocation || undefined}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType={mapStyle}
          followsUserLocation={trackingMode}
          userLocationUpdateInterval={trackingMode ? 1000 : 10000}
          loadingEnabled={true}
          loadingBackgroundColor={theme.colors.background}
          loadingIndicatorColor={theme.colors.primary}
          moveOnMarkerPress={false}
          onLongPress={onMapLongPress}>
          {/* Heatmap */}
          {showHeatmap &&
            filteredData &&
            (filteredData.dogs.length > 0 || filteredData.emergencies.length > 0) && (
              <Heatmap
                points={[...filteredData.dogs, ...filteredData.emergencies].map((item) => ({
                  latitude: item.latitude,
                  longitude: item.longitude,
                  weight: 1,
                }))}
                radius={50}
                opacity={0.7}
                gradient={{
                  colors: [theme.colors.primary, theme.colors.secondary, theme.colors.error],
                  startPoints: [0.2, 0.5, 1.0],
                  colorMapSize: 256,
                }}
              />
            )}

          {/* Search Radius Circle */}
          {userLocation && (
            <Circle
              center={userLocation}
              radius={radiusFilter * 1000}
              strokeColor={`${theme.colors.primary}40`}
              fillColor={`${theme.colors.primary}15`}
              strokeWidth={2}
            />
          )}

          {/* Dog Markers with Custom PNG Icons */}
          {filteredData.dogs.map((dog) => (
            <Marker
              key={`dog-${dog.id}`}
              coordinate={{
                latitude: dog.latitude,
                longitude: dog.longitude,
              }}
              onPress={() => {
                setSelectedMarker(dog);
                setShowBottomSheet(true);
              }}>
              <EnhancedCustomMapMarker dog={dog} />
            </Marker>
          ))}

          {/* Emergency Markers */}
          {filteredData.emergencies.map((emergency) => (
            <Marker
              key={`emergency-${emergency.id}`}
              coordinate={{
                latitude: emergency.latitude,
                longitude: emergency.longitude,
              }}
              onPress={() => {
                setSelectedMarker(emergency);
                setShowBottomSheet(true);
              }}>
              <EnhancedCustomMapMarker emergency={emergency} />
            </Marker>
          ))}
        </MapView>

        {/* Optimized Bottom Control Bar */}
        <View style={[styles.bottomControlBar, { bottom: insets.bottom + 90 }]}>
          {/* Left side - Compact map controls */}
          <View style={styles.leftControls}>
            <Surface style={styles.controlGroup} elevation={4}>
              <IconButton
                icon="crosshairs-gps"
                mode="contained"
                size={16}
                onPress={centerOnUser}
                style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
                iconColor={theme.colors.onPrimary}
              />
              <IconButton
                icon={trackingMode ? 'crosshairs-off' : 'crosshairs'}
                mode="contained"
                size={16}
                onPress={toggleTracking}
                style={[
                  styles.controlButton,
                  {
                    backgroundColor: trackingMode ? theme.colors.error : theme.colors.secondary,
                    marginLeft: 4,
                  },
                ]}
                iconColor={theme.colors.onSecondary}
              />
              <IconButton
                icon="refresh"
                mode="contained"
                size={16}
                onPress={refreshData}
                style={[
                  styles.controlButton,
                  {
                    backgroundColor: theme.colors.tertiary,
                    marginLeft: 4,
                  },
                ]}
                iconColor={theme.colors.onTertiary}
              />
            </Surface>
          </View>

          {/* Right side - Quick Add FAB */}
          <View style={styles.rightControls}>
            <FAB
              icon="plus"
              onPress={() => setShowQuickAddModal(true)}
              style={[
                styles.quickAddFab,
                {
                  backgroundColor: theme.colors.primary,
                  elevation: 6,
                },
              ]}
              label="Add"
              size="small"
            />
          </View>
        </View>
      </View>

      {/* Enhanced Bottom Sheet for Marker Details */}
      <Portal>
        <Modal
          visible={showBottomSheet}
          onDismiss={() => setShowBottomSheet(false)}
          contentContainerStyle={[styles.bottomSheet, { backgroundColor: theme.colors.surface }]}>
          {selectedMarker && (
            <Card style={{ backgroundColor: theme.colors.surface }} elevation={4}>
              <Card.Title
                title={
                  'name' in selectedMarker ? selectedMarker.name : selectedMarker.emergency_type
                }
                subtitle={
                  'breed' in selectedMarker
                    ? `${selectedMarker.breed || 'Unknown breed'} • ${selectedMarker.size || 'Size unknown'}`
                    : `Severity: ${(selectedMarker as Emergency).severity || 'Unknown'} • ${(selectedMarker as Emergency).volunteers_needed || 0} volunteers needed`
                }
                left={(props) => (
                  <Avatar.Icon
                    {...props}
                    icon={'name' in selectedMarker ? 'dog' : 'alert'}
                    style={{
                      backgroundColor:
                        'name' in selectedMarker
                          ? theme.colors.primaryContainer
                          : theme.colors.errorContainer,
                    }}
                  />
                )}
                right={(props) => (
                  <IconButton
                    {...props}
                    icon={favorites.includes(selectedMarker.id) ? 'heart' : 'heart-outline'}
                    iconColor={theme.colors.primary}
                    onPress={() => toggleFavorite(selectedMarker.id)}
                  />
                )}
              />
              <Card.Content>
                {'owner_name' in selectedMarker && selectedMarker.owner_name && (
                  <Paragraph style={styles.detailText}>
                    👤 Owner: {selectedMarker.owner_name}
                  </Paragraph>
                )}
                {'dog_type' in selectedMarker && selectedMarker.dog_type && (
                  <Paragraph style={styles.detailText}>
                    🏷️ Type: {selectedMarker.dog_type}
                  </Paragraph>
                )}
                {'description' in selectedMarker && selectedMarker.description && (
                  <Paragraph style={styles.detailText}>📝 {selectedMarker.description}</Paragraph>
                )}
                {selectedMarker.distance_km && (
                  <Paragraph style={styles.detailText}>
                    📍 {selectedMarker.distance_km.toFixed(1)} km away
                  </Paragraph>
                )}
              </Card.Content>
              <Card.Actions style={styles.cardActions}>
                <Button onPress={() => setShowBottomSheet(false)} mode="outlined">
                  Close
                </Button>
                <Button
                  mode="contained"
                  onPress={() => openGoogleMaps(selectedMarker)}
                  style={{ backgroundColor: theme.colors.primary }}
                  icon="directions">
                  Directions
                </Button>
              </Card.Actions>
            </Card>
          )}
        </Modal>
      </Portal>

      {/* Quick Add Modal */}
      <MaterialQuickAddModal
        visible={showQuickAddModal}
        onClose={() => {
          setShowQuickAddModal(false);
          setSelectedMapLocation(null);
        }}
        userLocation={userLocation}
        selectedLocation={selectedMapLocation}
        onSuccess={() => {
          refreshData();
          showSnackbar('Item added successfully! 🎉');
        }}
      />

      {/* Enhanced Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{
          backgroundColor: theme.colors.inverseSurface,
          margin: 16,
        }}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}>
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  floatingSearchContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  floatingSearchBar: {
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  filterModal: {
    margin: 16,
    marginTop: 100,
  },
  filterContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  filterSectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  applyButton: {
    marginTop: 20,
    borderRadius: 12,
  },
  statsOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  statsCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadge: {
    marginHorizontal: 4,
    minWidth: 24,
  },
  statLabel: {
    marginRight: 16,
    fontWeight: '500',
  },
  radiusContainer: {
    marginBottom: 16,
  },
  radiusLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  radiusButtons: {
    justifyContent: 'space-around',
  },
  radiusButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  chipScroll: {
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  mapContainer: {
    flex: 1,
  },
  bottomControlBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flex: 0,
  },
  rightControls: {
    flex: 0,
  },
  controlGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    elevation: 1,
  },
  quickAddFab: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderRadius: 25,
  },
  bottomSheet: {
    margin: 16,
    borderRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    overflow: 'hidden',
  },
  detailText: {
    marginVertical: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
