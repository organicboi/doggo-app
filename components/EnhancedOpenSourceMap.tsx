"use client"

import { MaterialIcons } from "@expo/vector-icons"
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import { LinearGradient } from "expo-linear-gradient"
import * as Location from "expo-location"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native"
import MapView, { Circle, Marker, PROVIDER_DEFAULT, UrlTile, type LongPressEvent, type Region } from "react-native-maps"
import { ActivityIndicator, useTheme } from "react-native-paper"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { supabase } from "../lib/supabase"
import DogReviewModal from "./DogReviewModal"
import EnhancedDogDetailPanel from "./EnhancedDogDetailPanel"
import EnhancedMapHeader from "./EnhancedMapHeader"
import MaterialQuickAddModal from "./MaterialQuickAddModal"
import PremiumSearchOverlay from "./PremiumSearchOverlay"
import WalkRequestModal from "./WalkRequestModal"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

interface Dog {
  id: string
  name: string
  breed?: string
  size?: string
  latitude: number
  longitude: number
  owner_name?: string
  owner_avatar?: string
  owner_rating?: number
  rating_average?: number
  rating_count?: number
  distance_km?: number
  dog_type?: string
  age_years?: number
  age_months?: number
  weight?: number
  color?: string
  gender?: string
  is_vaccinated?: boolean
  vaccination_date?: string
  health_conditions?: string
  special_needs?: string
  profile_image_url?: string
  additional_images?: string[]
  contact_info?: string
  description?: string
  energy_level?: number
  friendliness?: number
  playfulness?: number
  trainability?: number
  good_with_kids?: boolean
  good_with_dogs?: boolean
  good_with_cats?: boolean
  total_walks?: number
  last_walk_date?: string
  preferred_walk_duration?: number
  walking_pace?: string
  leash_trained?: boolean
  is_available_for_walks?: boolean
}

interface Emergency {
  id: string
  emergency_type: string
  severity: string
  description: string
  latitude: number
  longitude: number
  distance_km?: number
  volunteers_needed: number
  volunteers_responded: number
  created_at: string
  contact_info?: string
}

interface UserLocation {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

type FilterType = "all" | "dogs" | "emergencies" | "stray" | "owned" | "rescue"

// Multiple OSM tile providers for fallback
const OSM_TILE_PROVIDERS = [
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
]

// Custom marker components
const DogMarkerView = ({ dog, size = 40 }: { dog: Dog; size?: number }) => {
  const getMarkerColor = () => {
    switch (dog.dog_type) {
      case "stray":
        return "#f59e0b"
      case "rescue":
        return "#8b5cf6"
      case "owned":
        return "#10b981"
      default:
        return "#10b981"
    }
  }

  return (
    <View style={[styles.markerContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.customMarker,
          {
            backgroundColor: getMarkerColor(),
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.markerText, { fontSize: size * 0.4 }]}>🐕</Text>
      </View>
      <View style={[styles.markerShadow, { width: size * 0.6 }]} />
    </View>
  )
}

const EmergencyMarkerView = ({ emergency, size = 40 }: { emergency: Emergency; size?: number }) => {
  const getMarkerColor = () => {
    switch (emergency.severity) {
      case "high":
        return "#ef4444"
      case "medium":
        return "#f59e0b"
      case "low":
        return "#10b981"
      default:
        return "#ef4444"
    }
  }

  return (
    <View style={[styles.markerContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.customMarker,
          {
            backgroundColor: getMarkerColor(),
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.markerText, { fontSize: size * 0.4 }]}>🚨</Text>
      </View>
      <View style={[styles.markerShadow, { width: size * 0.6 }]} />
    </View>
  )
}

const UserLocationMarker = ({ size = 40 }: { size?: number }) => (
  <View style={[styles.markerContainer, { width: size, height: size }]}>
    <View
      style={[
        styles.customMarker,
        {
          backgroundColor: "#3b82f6",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: "white",
        },
      ]}
    >
      <Text style={[styles.markerText, { fontSize: size * 0.4 }]}>📍</Text>
    </View>
    <View style={[styles.markerShadow, { width: size * 0.6 }]} />
  </View>
)

export default function WorkingOpenSourceMap() {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const mapRef = useRef<MapView>(null)

  // State management
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [selectedMarker, setSelectedMarker] = useState<Dog | Emergency | null>(null)
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [showDogDetail, setShowDogDetail] = useState(false)
  const [showWalkRequest, setShowWalkRequest] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [showSearchOverlay, setShowSearchOverlay] = useState(false)
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [trackingMode, setTrackingMode] = useState(false)
  const [currentTileProvider, setCurrentTileProvider] = useState(0)

  // Animations
  const fabScale = useRef(new Animated.Value(1)).current
  const bottomSheetTranslateY = useRef(new Animated.Value(300)).current

  // Default region (New York City as fallback)
  const defaultRegion: Region = {
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }

  useEffect(() => {
    initializeMap()
  }, [])

  useEffect(() => {
    if (showBottomSheet) {
      Animated.spring(bottomSheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start()
    } else {
      Animated.spring(bottomSheetTranslateY, {
        toValue: 300,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start()
    }
  }, [showBottomSheet])

  const initializeMap = async () => {
    try {
      console.log("🗺️ Initializing map...")
      await requestLocationPermission()
    } catch (error) {
      console.error("❌ Map initialization error:", error)
      setLoading(false)
    }
  }

  const requestLocationPermission = async () => {
    try {
      console.log("📍 Requesting location permission...")

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        console.log("⚠️ Location permission denied")
        Alert.alert(
          "Permission Required",
          "Location permission is required to show your position on the map. Using default location.",
          [
            {
              text: "OK",
              onPress: () => {
                setUserLocation(defaultRegion)
                fetchDogsAndEmergencies(defaultRegion)
              },
            },
          ],
        )
        return
      }

      console.log("✅ Location permission granted")

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      })

      console.log("📍 Got user location:", location.coords)

      const userLoc: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }

      setUserLocation(userLoc)
      await fetchDogsAndEmergencies(userLoc)
    } catch (error) {
      console.error("❌ Location error:", error)
      Alert.alert("Location Error", "Could not get your location. Using default location.", [
        {
          text: "OK",
          onPress: () => {
            setUserLocation(defaultRegion)
            fetchDogsAndEmergencies(defaultRegion)
          },
        },
      ])
    }
  }

  const fetchDogsAndEmergencies = async (location: UserLocation) => {
    try {
      console.log("🐕 Fetching dogs and emergencies...")

      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .neq("latitude", 0)
        .neq("longitude", 0)
        .limit(100)

      if (dogsError) {
        console.error("❌ Dogs query error:", dogsError)
      } else {
        console.log(`✅ Fetched ${dogsData?.length || 0} dogs`)
      }

      const { data: emergenciesData, error: emergenciesError } = await supabase
        .from("emergency_requests")
        .select("*")
        .eq("status", "open")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .neq("latitude", 0)
        .neq("longitude", 0)

      if (emergenciesError) {
        console.error("❌ Emergency error:", emergenciesError)
      } else {
        console.log(`✅ Fetched ${emergenciesData?.length || 0} emergencies`)
      }

      const validDogs = (dogsData || [])
        .filter(
          (dog: any) =>
            dog.latitude != null &&
            dog.longitude != null &&
            typeof dog.latitude === "number" &&
            typeof dog.longitude === "number" &&
            dog.latitude !== 0 &&
            dog.longitude !== 0,
        )
        .map((dog: any) => ({
          ...dog,
          distance_km: getDistance(location.latitude, location.longitude, dog.latitude, dog.longitude),
          rating_average: dog.rating_average || 4.5,
          rating_count: dog.rating_count || 10,
        }))
        .filter((dog) => dog.distance_km <= 50)
        .sort((a, b) => a.distance_km - b.distance_km)

      const validEmergencies = (emergenciesData || [])
        .filter(
          (emergency: any) =>
            emergency.latitude != null &&
            emergency.longitude != null &&
            typeof emergency.latitude === "number" &&
            typeof emergency.longitude === "number" &&
            emergency.latitude !== 0 &&
            emergency.longitude !== 0,
        )
        .map((emergency: any) => ({
          ...emergency,
          distance_km: getDistance(location.latitude, location.longitude, emergency.latitude, emergency.longitude),
        }))
        .filter((emergency) => emergency.distance_km <= 50)
        .sort((a, b) => a.distance_km - b.distance_km)

      setDogs(validDogs)
      setEmergencies(validEmergencies)

      console.log(`✅ Set ${validDogs.length} dogs and ${validEmergencies.length} emergencies`)
    } catch (error) {
      console.error("❌ Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleMarkerPress = async (item: Dog | Emergency) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setSelectedMarker(item)

      if ("name" in item) {
        setSelectedDog(item)
        setShowDogDetail(true)
      } else {
        setShowBottomSheet(true)
      }
    } catch (error) {
      console.error("Haptic feedback error:", error)
    }
  }

  const closeBottomSheet = () => {
    setShowBottomSheet(false)
    setSelectedMarker(null)
  }

  const handleFilterPress = async (filter: FilterType) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setActiveFilter(filter)
    } catch (error) {
      console.error("Haptic feedback error:", error)
    }
  }

  const centerOnUser = async () => {
    if (userLocation && mapRef.current && mapReady) {
      console.log("🎯 Centering on user location")
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      )
    }
  }

  const refreshData = async () => {
    if (userLocation) {
      console.log("🔄 Refreshing data...")
      await fetchDogsAndEmergencies(userLocation)
    }
  }

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query)
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches((prev) => [query.trim(), ...prev.slice(0, 4)])
    }
  }

  const handleWalkRequest = (dogId: string) => {
    setShowWalkRequest(true)
    setShowDogDetail(false)
  }

  const handleReviewPress = (dogId: string) => {
    setShowReviewModal(true)
    setShowDogDetail(false)
  }

  const handleContactOwner = (contactInfo: string) => {
    if (contactInfo) {
      Linking.openURL(`tel:${contactInfo}`).catch(() => {
        Alert.alert("Error", "Could not open phone app")
      })
    }
  }

  const handleWalkRequestSubmit = (walkRequest: any) => {
    Alert.alert("Walk Request Sent!", "Your walk request has been sent to the dog owner.", [{ text: "OK" }])
    setShowWalkRequest(false)
  }

  const handleReviewSubmit = (review: any) => {
    Alert.alert("Review Submitted!", "Thank you for your review.", [{ text: "OK" }])
    setShowReviewModal(false)
  }

  const handleLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate
    console.log("📍 Long press at:", latitude, longitude)
    setSelectedMapLocation({ latitude, longitude })
    setShowQuickAddModal(true)
  }

  const handleMapReady = () => {
    console.log("✅ Map is ready")
    setMapReady(true)
  }

  const handleTileError = () => {
    console.log("❌ Tile loading error, trying next provider...")
    if (currentTileProvider < OSM_TILE_PROVIDERS.length - 1) {
      setCurrentTileProvider((prev) => prev + 1)
    }
  }

  const filteredData = useMemo(() => {
    let filteredDogs = dogs
    let filteredEmergencies = emergencies

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredDogs = dogs.filter(
        (dog) =>
          dog.name?.toLowerCase().includes(query) ||
          dog.breed?.toLowerCase().includes(query) ||
          dog.owner_name?.toLowerCase().includes(query),
      )
      filteredEmergencies = emergencies.filter(
        (emergency) =>
          emergency.emergency_type?.toLowerCase().includes(query) ||
          emergency.description?.toLowerCase().includes(query),
      )
    }

    switch (activeFilter) {
      case "dogs":
        filteredEmergencies = []
        break
      case "emergencies":
        filteredDogs = []
        break
      case "stray":
        filteredDogs = filteredDogs.filter((dog) => dog.dog_type === "stray")
        filteredEmergencies = []
        break
      case "owned":
        filteredDogs = filteredDogs.filter((dog) => dog.dog_type === "owned")
        filteredEmergencies = []
        break
      case "rescue":
        filteredDogs = filteredDogs.filter((dog) => dog.dog_type === "rescue")
        filteredEmergencies = []
        break
    }

    return { dogs: filteredDogs, emergencies: filteredEmergencies }
  }, [dogs, emergencies, searchQuery, activeFilter])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={["#10b981", "#059669"]} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading PawPals Map...</Text>
        <Text style={styles.loadingSubtext}>Using OpenStreetMap (Open Source)</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={Platform.OS === "android"} />

      {/* React Native Maps with OpenStreetMap */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={userLocation || defaultRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        onMapReady={handleMapReady}
        onLongPress={handleLongPress}
        mapType="none"
        maxZoomLevel={19}
        minZoomLevel={3}
      >
        {/* OpenStreetMap Tiles */}
        <UrlTile
          urlTemplate={OSM_TILE_PROVIDERS[currentTileProvider]}
          maximumZ={19}
          minimumZ={3}
          flipY={false}
          shouldReplaceMapContent={true}
          tileSize={256}
          onError={handleTileError}
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            identifier="user-location"
          >
            <UserLocationMarker />
          </Marker>
        )}

        {/* User Location Circle */}
        {userLocation && (
          <Circle
            center={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            radius={100}
            fillColor="rgba(59, 130, 246, 0.1)"
            strokeColor="rgba(59, 130, 246, 0.3)"
            strokeWidth={2}
          />
        )}

        {/* Dog Markers */}
        {filteredData.dogs.map((dog) => (
          <Marker
            key={`dog-${dog.id}`}
            coordinate={{
              latitude: dog.latitude,
              longitude: dog.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            onPress={() => handleMarkerPress(dog)}
            identifier={`dog-${dog.id}`}
          >
            <DogMarkerView dog={dog} />
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
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            onPress={() => handleMarkerPress(emergency)}
            identifier={`emergency-${emergency.id}`}
          >
            <EmergencyMarkerView emergency={emergency} />
          </Marker>
        ))}
      </MapView>

      {/* Map Status Indicator */}
      <View style={[styles.statusIndicator, { top: insets.top + 60 }]}>
        <View style={[styles.statusDot, { backgroundColor: mapReady ? "#10b981" : "#f59e0b" }]} />
        <Text style={styles.statusText}>{mapReady ? "Map Ready" : "Loading Map..."}</Text>
      </View>

      {/* Enhanced Map Header */}
      <EnhancedMapHeader
        paddingTop={insets.top}
        dogCount={filteredData.dogs.length}
        strayCount={filteredData.dogs.filter((dog) => dog.dog_type === "stray").length}
        rescueCount={filteredData.dogs.filter((dog) => dog.dog_type === "rescue").length}
        ownedCount={filteredData.dogs.filter((dog) => dog.dog_type === "owned").length}
        emergencyCount={filteredData.emergencies.length}
        activeFilter={activeFilter}
        onFilterPress={handleFilterPress}
        searchQuery={searchQuery}
        onSearchPress={() => setShowSearchOverlay(true)}
      />

      {/* Floating Controls */}
      <View style={[styles.floatingControls, { bottom: insets.bottom + 100 }]}>
        <View style={styles.controlStrip}>
          <BlurView intensity={90} tint="light" style={styles.controlBlur}>
            <LinearGradient colors={["rgba(255,255,255,0.9)", "rgba(248,250,252,0.8)"]} style={styles.controlsRow}>
              <Pressable
                style={[styles.controlButton, { backgroundColor: "#10b981" }]}
                onPress={centerOnUser}
                disabled={!mapReady}
              >
                <MaterialIcons name="my-location" size={16} color="white" />
              </Pressable>
              <Pressable
                style={[styles.controlButton, { backgroundColor: trackingMode ? "#ef4444" : "#3b82f6" }]}
                onPress={() => setTrackingMode(!trackingMode)}
              >
                <MaterialIcons name={trackingMode ? "location-off" : "location-on"} size={16} color="white" />
              </Pressable>
              <Pressable style={[styles.controlButton, { backgroundColor: "#f59e0b" }]} onPress={refreshData}>
                <MaterialIcons name="refresh" size={16} color="white" />
              </Pressable>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Add Button */}
        <Animated.View style={[{ transform: [{ scale: fabScale }] }]}>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowQuickAddModal(true)}
            onPressIn={() => {
              Animated.spring(fabScale, {
                toValue: 0.95,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
              }).start()
            }}
            onPressOut={() => {
              Animated.spring(fabScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
              }).start()
            }}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.addButtonContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>Add Dog</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* Dog Detail Panel */}
      <EnhancedDogDetailPanel
        visible={showDogDetail}
        dog={selectedDog}
        onClose={() => setShowDogDetail(false)}
        onWalkRequest={handleWalkRequest}
        onReviewPress={handleReviewPress}
        onContactOwner={handleContactOwner}
      />

      {/* Walk Request Modal */}
      <WalkRequestModal
        visible={showWalkRequest}
        dog={selectedDog}
        onClose={() => setShowWalkRequest(false)}
        onSubmit={handleWalkRequestSubmit}
      />

      {/* Review Modal */}
      <DogReviewModal
        visible={showReviewModal}
        dog={selectedDog}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
      />

      {/* Emergency Bottom Sheet */}
      {showBottomSheet && selectedMarker && !("name" in selectedMarker) && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              bottom: insets.bottom + 16,
              transform: [{ translateY: bottomSheetTranslateY }],
            },
          ]}
        >
          <BlurView intensity={95} tint="light" style={styles.bottomSheetBlur}>
            <LinearGradient
              colors={["rgba(255,255,255,0.95)", "rgba(248,250,252,0.9)"]}
              style={styles.bottomSheetContent}
            >
              <View style={styles.sheetHandle} />
              <Pressable style={styles.closeButton} onPress={closeBottomSheet}>
                <MaterialIcons name="close" size={16} color="#6b7280" />
              </Pressable>

              <View style={styles.emergencyContent}>
                <View style={styles.emergencyHeader}>
                  <Text style={styles.emergencyTitle}>
                    {(selectedMarker as Emergency).emergency_type?.replace("_", " ").toUpperCase()} EMERGENCY
                  </Text>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor((selectedMarker as Emergency).severity) },
                    ]}
                  >
                    <Text style={styles.severityText}>{(selectedMarker as Emergency).severity}</Text>
                  </View>
                </View>

                <Text style={styles.emergencyDescription}>{(selectedMarker as Emergency).description}</Text>

                <Text style={styles.emergencyDistance}>
                  {(selectedMarker as Emergency).distance_km?.toFixed(1)}km away
                </Text>

                <View style={styles.actionButtons}>
                  <Pressable style={[styles.actionButton, { backgroundColor: "#ef4444" }]}>
                    <MaterialIcons name="phone" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Call</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, { backgroundColor: "#10b981" }]}>
                    <MaterialIcons name="volunteer-activism" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Help</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, { backgroundColor: "#3b82f6" }]}>
                    <MaterialIcons name="directions" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Navigate</Text>
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      )}

      {/* Search Overlay */}
      <PremiumSearchOverlay
        visible={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchQueryChange}
        recentSearches={recentSearches}
        onClearRecent={() => setRecentSearches([])}
      />

      {/* Quick Add Modal */}
      <MaterialQuickAddModal
        visible={showQuickAddModal}
        onClose={() => {
          setShowQuickAddModal(false)
          setSelectedMapLocation(null)
        }}
        userLocation={userLocation}
        selectedLocation={selectedMapLocation}
        onSuccess={refreshData}
      />
    </View>
  )
}

// Helper function for severity colors
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "high":
      return "#ef4444"
    case "medium":
      return "#f59e0b"
    case "low":
      return "#10b981"
    default:
      return "#ef4444"
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  statusIndicator: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1000,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  // Marker Styles
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  customMarker: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontWeight: "bold",
  },
  markerShadow: {
    position: "absolute",
    bottom: -2,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    zIndex: -1,
  },
  // Control Styles
  floatingControls: {
    position: "absolute",
    right: 16,
    zIndex: 1000,
  },
  controlStrip: {
    marginBottom: 16,
  },
  controlBlur: {
    borderRadius: 12,
    overflow: "hidden",
  },
  controlsRow: {
    flexDirection: "row",
    padding: 4,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  // Bottom Sheet Styles
  bottomSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 2000,
  },
  bottomSheetBlur: {
    borderRadius: 20,
    overflow: "hidden",
  },
  bottomSheetContent: {
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  emergencyContent: {
    marginTop: 8,
  },
  emergencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    flex: 1,
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  emergencyDescription: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 8,
  },
  emergencyDistance: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
})