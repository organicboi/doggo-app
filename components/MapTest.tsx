// import * as Location from 'expo-location';
// import React, { useEffect, useState } from 'react';
// import { Alert, StyleSheet, Text, View } from 'react-native';
// import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
// import { GOOGLE_MAPS_API_KEY, validateEnvironment } from '../lib/config';

// export default function MapTest() {
//   const [userLocation, setUserLocation] = useState<any>(null);
//   const [apiKeyStatus, setApiKeyStatus] = useState<string>('Checking...');

//   useEffect(() => {
//     // Validate environment variables
//     const isValid = validateEnvironment();
//     setApiKeyStatus(isValid ? '✅ API Key Configured' : '❌ API Key Missing');

//     // Get user location
//     const getLocation = async () => {
//       try {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== 'granted') {
//           Alert.alert('Permission denied', 'Location permission is required');
//           return;
//         }

//         const location = await Location.getCurrentPositionAsync({});
//         setUserLocation({
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         });
//       } catch (error) {
//         console.error('Error getting location:', error);
//       }
//     };

//     getLocation();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <View style={styles.statusBar}>
//         <Text style={styles.statusText}>{apiKeyStatus}</Text>
//         <Text style={styles.apiKeyText}>
//           API Key: {GOOGLE_MAPS_API_KEY ? '✅ Set' : '❌ Missing'}
//         </Text>
//       </View>
      
//       {userLocation ? (
//         <MapView
//           style={styles.map}
          
//           initialRegion={userLocation}
//           showsUserLocation={true}
//           showsMyLocationButton={true}
//         />
//       ) : (
//         <View style={styles.loadingContainer}>
//           <Text style={styles.loadingText}>Loading map...</Text>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   statusBar: {
//     backgroundColor: '#f0f0f0',
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   statusText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   apiKeyText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   map: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 18,
//     color: '#666',
//   },
// }); 