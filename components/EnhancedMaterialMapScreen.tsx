import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import MapView, {
  Marker,
  Region,
  Heatmap,
  Circle,
  Polyline,
  Callout,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
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
  Switch,
  Slider,
  SegmentedButtons,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import MaterialCustomMapMarker from './MaterialCustomMapMarker';
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

interface MarkerCluster {
  id: string;
  coordinate: { latitude: number; longitude: number };
  pointCount: number;
  items: (Dog | Emergency)[];
}

type FilterType = 'all' | 'dogs' | 'emergencies' | 'stray' | 'owned';
type MapStyle = 'standard' | 'satellite' | 'hybrid' | 'terrain';
type ViewMode = 'map' | 'list' | 'grid';

export default function EnhancedMaterialMapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Core state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);

  // Enhanced UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [mapStyle, setMapStyle] = useState<MapStyle>('standard');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClustering, setShowClustering] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Dog | Emergency | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
  const [route, setRoute] = useState<any[]>([]);
  const [showRoute, setShowRoute] = useState(false);

  // Advanced filter state
  const [ageFilter, setAgeFilter] = useState([0, 15]);
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState(false);

  // Animation refs
  const mapRef = useRef<MapView>(null);
  const fabGroupAnim = useRef(new Animated.Value(0)).current;

  // Distance calculation
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

  // Enhanced clustering algorithm
  const clusters = useMemo(() => {
    if (!showClustering || !filteredData) return [];

    const CLUSTER_RADIUS = 0.01; // degrees
    const dogsArray = filteredData.dogs || [];
    const emergenciesArray = filteredData.emergencies || [];
    const allItems = [...dogsArray, ...emergenciesArray];

    if (allItems.length === 0) return [];

    const clustered: MarkerCluster[] = [];
    const processed = new Set<string>();

    allItems.forEach((item) => {
      if (processed.has(item.id)) return;

      const nearby = allItems.filter((other) => {
        if (processed.has(other.id) || item.id === other.id) return false;
        const distance = Math.sqrt(
          Math.pow(item.latitude - other.latitude, 2) +
            Math.pow(item.longitude - other.longitude, 2)
        );
        return distance < CLUSTER_RADIUS;
      });

      if (nearby.length > 0) {
        nearby.forEach((nearbyItem) => processed.add(nearbyItem.id));
        processed.add(item.id);

        const centerLat =
          [item, ...nearby].reduce((sum, i) => sum + i.latitude, 0) / (nearby.length + 1);
        const centerLng =
          [item, ...nearby].reduce((sum, i) => sum + i.longitude, 0) / (nearby.length + 1);

        clustered.push({
          id: `cluster-${item.id}`,
          coordinate: { latitude: centerLat, longitude: centerLng },
          pointCount: nearby.length + 1,
          items: [item, ...nearby],
        });
      }
    });

    return clustered;
  }, [filteredData, showClustering]);

  // Advanced filtered data with multiple criteria
  const filteredData = useMemo(() => {
    const dogsArray = dogs || [];
    const emergenciesArray = emergencies || [];

    let filteredDogs = dogsArray;
    let filteredEmergencies = emergenciesArray;

    // Text search
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

    // Advanced filters
    filteredDogs = filteredDogs.filter((dog) => {
      // Age filter
      if (dog.age && (dog.age < ageFilter[0] || dog.age > ageFilter[1])) return false;

      // Size filter
      if (sizeFilter !== 'all' && dog.size !== sizeFilter) return false;

      // Distance filter
      if (dog.distance_km && dog.distance_km > radiusFilter) return false;

      return true;
    });

    filteredEmergencies = filteredEmergencies.filter((emergency) => {
      // Severity filter
      if (severityFilter !== 'all' && emergency.severity !== severityFilter) return false;

      // Distance filter
      if (emergency.distance_km && emergency.distance_km > radiusFilter) return false;

      return true;
    });

    // Type filter
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
  }, [
    dogs,
    emergencies,
    searchQuery,
    activeFilter,
    ageFilter,
    sizeFilter,
    severityFilter,
    radiusFilter,
  ]);

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
      // Use the working approach from WorkingMapScreen
      const { data: nearbyDogs, error: dogsError } = await supabase.rpc('find_nearby_dogs', {
        user_lat: location.latitude,
        user_lng: location.longitude,
        radius_km: radiusFilter,
      });

      if (dogsError) {
        console.error('❌ Dogs RPC error:', dogsError);
        // Fallback to direct query
        const { data: directDogs, error: directError } = await supabase
          .from('dogs')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .neq('latitude', 0)
          .neq('longitude', 0)
          .limit(50);

        if (!directError && directDogs) {
          const validDogs = directDogs
            .filter(
              (dog: any) =>
                dog.latitude != null &&
                dog.longitude != null &&
                typeof dog.latitude === 'number' &&
                typeof dog.longitude === 'number'
            )
            .map((dog: any) => ({
              ...dog,
              distance_km: getDistance(
                location.latitude,
                location.longitude,
                dog.latitude,
                dog.longitude
              ),
            }));
          setDogs(validDogs);
        } else {
          setDogs([]);
        }
      } else if (nearbyDogs) {
        const validDogs = nearbyDogs.filter((dog: any) => {
          return (
            dog.latitude != null &&
            dog.longitude != null &&
            typeof dog.latitude === 'number' &&
            typeof dog.longitude === 'number' &&
            dog.latitude !== 0 &&
            dog.longitude !== 0
          );
        });
        setDogs(validDogs);
      }

      // Load emergencies
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergency_requests')
        .select('*')
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('latitude', 0)
        .neq('longitude', 0);

      if (!emergencyError && emergencyData) {
        const validEmergencies = emergencyData
          .filter(
            (emergency) =>
              emergency.latitude != null &&
              emergency.longitude != null &&
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
          }));
        setEmergencies(validEmergencies);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showSnackbar('Error loading map data');
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

  const onMapLongPress = async (event: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { latitude, longitude } = event.nativeEvent.coordinate;
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

  const toggleFABGroup = () => {
    Animated.spring(fabGroupAnim, {
      toValue: fabGroupAnim._value === 0 ? 1 : 0,
      useNativeDriver: true,
    }).start();
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
      {/* Enhanced App Bar */}
      <Appbar.Header elevated={true} style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content
          title="Enhanced PawPals Map"
          subtitle={`${filteredData?.dogs?.length || 0} dogs • ${filteredData?.emergencies?.length || 0} emergencies`}
          titleStyle={{ color: theme.colors.onPrimary }}
          subtitleStyle={{ color: theme.colors.onPrimary }}
        />
        <Appbar.Action
          icon="magnify"
          iconColor={theme.colors.onPrimary}
          onPress={() => setShowFilters(!showFilters)}
        />
        <Appbar.Action
          icon="tune"
          iconColor={theme.colors.onPrimary}
          onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
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
          <Menu.Item
            leadingIcon={showClustering ? 'ungroup' : 'group'}
            onPress={() => {
              setShowClustering(!showClustering);
              setShowMenu(false);
              showSnackbar(showClustering ? 'Clustering disabled' : 'Clustering enabled');
            }}
            title={showClustering ? 'Disable Clustering' : 'Enable Clustering'}
          />
          <Menu.Item
            leadingIcon={showTraffic ? 'traffic-light-off' : 'traffic-light'}
            onPress={() => {
              setShowTraffic(!showTraffic);
              setShowMenu(false);
              showSnackbar(showTraffic ? 'Traffic hidden' : 'Traffic shown');
            }}
            title={showTraffic ? 'Hide Traffic' : 'Show Traffic'}
          />
          <Divider />
          <Menu.Item leadingIcon="cog" onPress={() => setShowMenu(false)} title="Settings" />
        </Menu>
      </Appbar.Header>

      {/* Search and Filter Section */}
      {showFilters && (
        <Surface style={styles.searchContainer} elevation={1}>
          <Searchbar
            placeholder="Search dogs, breeds, or emergencies..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={{ marginBottom: 12 }}
            elevation={0}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipContainer}>{getFilterChips()}</View>
          </ScrollView>
        </Surface>
      )}

      {/* Advanced Filters Modal */}
      <Portal>
        <Modal
          visible={showAdvancedFilters}
          onDismiss={() => setShowAdvancedFilters(false)}
          contentContainerStyle={[
            styles.advancedFiltersModal,
            { backgroundColor: theme.colors.surface },
          ]}>
          <Text variant="headlineSmall" style={{ marginBottom: 16, color: theme.colors.onSurface }}>
            Advanced Filters
          </Text>

          <Text variant="titleMedium" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
            Age Range: {ageFilter[0]} - {ageFilter[1]} years
          </Text>
          <Slider
            style={{ marginBottom: 16 }}
            minimumValue={0}
            maximumValue={15}
            value={ageFilter[0]}
            onValueChange={(value) => setAgeFilter([Math.round(value), ageFilter[1]])}
            thumbColor={theme.colors.primary}
            minimumTrackTintColor={theme.colors.primary}
          />

          <Text variant="titleMedium" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
            Distance: {radiusFilter}km
          </Text>
          <Slider
            style={{ marginBottom: 16 }}
            minimumValue={1}
            maximumValue={100}
            value={radiusFilter}
            onValueChange={(value) => setRadiusFilter(Math.round(value))}
            thumbColor={theme.colors.primary}
            minimumTrackTintColor={theme.colors.primary}
          />

          <Text variant="titleMedium" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
            Size Filter
          </Text>
          <SegmentedButtons
            value={sizeFilter}
            onValueChange={setSizeFilter}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
            style={{ marginBottom: 16 }}
          />

          <Button
            mode="contained"
            onPress={() => {
              setShowAdvancedFilters(false);
              refreshData();
            }}
            style={{ backgroundColor: theme.colors.primary }}>
            Apply Filters
          </Button>
        </Modal>
      </Portal>

      {/* View Mode Toggle */}
      <Surface style={styles.viewModeToggle} elevation={2}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            { value: 'map', label: 'Map', icon: 'map' },
            { value: 'list', label: 'List', icon: 'view-list' },
            { value: 'grid', label: 'Grid', icon: 'view-grid' },
          ]}
        />
      </Surface>

      {/* Map View */}
      {viewMode === 'map' && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={userLocation || undefined}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            showsTraffic={showTraffic}
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
              (filteredData.dogs?.length > 0 || filteredData.emergencies?.length > 0) && (
                <Heatmap
                  points={[...(filteredData.dogs || []), ...(filteredData.emergencies || [])].map(
                    (item) => ({
                      latitude: item.latitude,
                      longitude: item.longitude,
                      weight: 1,
                    })
                  )}
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
                strokeColor={`${theme.colors.primary}50`}
                fillColor={`${theme.colors.primary}20`}
                strokeWidth={2}
              />
            )}

            {/* Route Polyline */}
            {showRoute && route.length > 0 && (
              <Polyline coordinates={route} strokeColor={theme.colors.primary} strokeWidth={3} />
            )}

            {/* Cluster Markers */}
            {showClustering &&
              clusters.map((cluster) => (
                <Marker
                  key={cluster.id}
                  coordinate={cluster.coordinate}
                  onPress={() => {
                    mapRef.current?.animateToRegion(
                      {
                        ...cluster.coordinate,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      },
                      1000
                    );
                  }}>
                  <Surface
                    style={[styles.clusterMarker, { backgroundColor: theme.colors.primary }]}
                    elevation={4}>
                    <Text
                      variant="labelLarge"
                      style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>
                      {cluster.pointCount}
                    </Text>
                  </Surface>
                </Marker>
              ))}

            {/* Individual Markers (only when not clustered) */}
            {!showClustering && filteredData && (
              <>
                {(filteredData.dogs || []).map((dog) => (
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
                    <MaterialCustomMapMarker dog={dog} />
                  </Marker>
                ))}

                {(filteredData.emergencies || []).map((emergency) => (
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
                    <MaterialCustomMapMarker emergency={emergency} />
                  </Marker>
                ))}
              </>
            )}
          </MapView>

          {/* Enhanced FAB Group */}
          <View style={[styles.fabContainer, { bottom: insets.bottom + 80 }]}>
            <Animated.View
              style={{
                opacity: fabGroupAnim,
                transform: [
                  {
                    translateY: fabGroupAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
              }}>
              <FAB
                icon="crosshairs-gps"
                size="small"
                onPress={centerOnUser}
                style={[styles.fab, { backgroundColor: theme.colors.primary, marginBottom: 8 }]}
              />
              <FAB
                icon={trackingMode ? 'crosshairs-off' : 'crosshairs'}
                size="small"
                onPress={toggleTracking}
                style={[
                  styles.fab,
                  {
                    backgroundColor: trackingMode ? theme.colors.error : theme.colors.secondary,
                    marginBottom: 8,
                  },
                ]}
              />
              <FAB
                icon="refresh"
                size="small"
                onPress={refreshData}
                style={[
                  styles.fab,
                  {
                    backgroundColor: theme.colors.tertiary,
                    marginBottom: 8,
                  },
                ]}
              />
              <FAB
                icon="routes"
                size="small"
                onPress={() => setShowRoute(!showRoute)}
                style={[
                  styles.fab,
                  {
                    backgroundColor: showRoute ? theme.colors.error : theme.colors.secondary,
                    marginBottom: 8,
                  },
                ]}
              />
            </Animated.View>

            <FAB
              icon="menu"
              onPress={toggleFABGroup}
              style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            />
          </View>

          {/* Main QuickAdd FAB */}
          <FAB
            icon="plus"
            onPress={() => setShowQuickAddModal(true)}
            style={[
              styles.mainFab,
              {
                bottom: insets.bottom + 80,
                backgroundColor: theme.colors.primary,
              },
            ]}
            label="Quick Add"
          />
        </View>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <ScrollView style={styles.listContainer}>
          {(filteredData?.dogs || []).map((dog) => (
            <Card key={`dog-${dog.id}`} style={styles.listCard}>
              <Card.Title
                title={dog.name}
                subtitle={`${dog.breed || 'Unknown'} • ${dog.size || 'Unknown'} • ${dog.distance_km?.toFixed(1) || '0'}km away`}
                left={(props) => <Avatar.Icon {...props} icon="dog" />}
                right={(props) => (
                  <IconButton {...props} icon="navigation" onPress={() => openGoogleMaps(dog)} />
                )}
              />
            </Card>
          ))}
          {(filteredData?.emergencies || []).map((emergency) => (
            <Card key={`emergency-${emergency.id}`} style={styles.listCard}>
              <Card.Title
                title={emergency.emergency_type?.replace('_', ' ')?.toUpperCase() || 'Emergency'}
                subtitle={`${emergency.severity || 'Unknown'} • ${emergency.distance_km?.toFixed(1) || '0'}km away`}
                left={(props) => <Avatar.Icon {...props} icon="alert" />}
                right={(props) => (
                  <IconButton
                    {...props}
                    icon="navigation"
                    onPress={() => openGoogleMaps(emergency)}
                  />
                )}
              />
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <ScrollView style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {[...(filteredData?.dogs || []), ...(filteredData?.emergencies || [])].map(
              (item, index) => (
                <Card key={`item-${item.id}`} style={styles.gridCard}>
                  <Card.Content style={styles.gridCardContent}>
                    <Avatar.Icon
                      size={40}
                      icon={'name' in item ? 'dog' : 'alert'}
                      style={{
                        backgroundColor:
                          'name' in item
                            ? theme.colors.primaryContainer
                            : theme.colors.errorContainer,
                      }}
                    />
                    <Text variant="labelMedium" style={{ textAlign: 'center', marginTop: 8 }}>
                      {'name' in item ? item.name : (item as Emergency).emergency_type || 'Unknown'}
                    </Text>
                    <Text variant="bodySmall" style={{ textAlign: 'center' }}>
                      {item.distance_km?.toFixed(1) || '0'}km
                    </Text>
                  </Card.Content>
                </Card>
              )
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Sheet for Marker Details */}
      <Portal>
        <Modal
          visible={showBottomSheet}
          onDismiss={() => setShowBottomSheet(false)}
          contentContainerStyle={[styles.bottomSheet, { backgroundColor: theme.colors.surface }]}>
          {selectedMarker && (
            <Card style={{ backgroundColor: theme.colors.surface }}>
              <Card.Title
                title={
                  'name' in selectedMarker ? selectedMarker.name : selectedMarker.emergency_type
                }
                subtitle={
                  'breed' in selectedMarker
                    ? `${selectedMarker.breed} • ${selectedMarker.size}`
                    : `Severity: ${(selectedMarker as Emergency).severity}`
                }
                left={(props) => (
                  <Avatar.Icon
                    {...props}
                    icon={'name' in selectedMarker ? 'dog' : 'alert'}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
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
                  <Paragraph>Owner: {selectedMarker.owner_name}</Paragraph>
                )}
                {'description' in selectedMarker && selectedMarker.description && (
                  <Paragraph>{selectedMarker.description}</Paragraph>
                )}
                {selectedMarker.distance_km && (
                  <Paragraph>Distance: {selectedMarker.distance_km.toFixed(1)} km away</Paragraph>
                )}
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => setShowBottomSheet(false)}>Close</Button>
                <Button
                  mode="contained"
                  onPress={() => openGoogleMaps(selectedMarker)}
                  style={{ backgroundColor: theme.colors.primary }}>
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
          showSnackbar('Item added successfully!');
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.inverseSurface }}>
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
  },
  searchContainer: {
    padding: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  advancedFiltersModal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  viewModeToggle: {
    margin: 16,
    padding: 8,
    borderRadius: 12,
  },
  mapContainer: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  gridContainer: {
    flex: 1,
    padding: 16,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    marginBottom: 16,
    borderRadius: 12,
  },
  gridCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
  },
  fab: {
    elevation: 4,
  },
  mainFab: {
    position: 'absolute',
    right: 16,
    elevation: 8,
  },
  bottomSheet: {
    margin: 16,
    borderRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
});
