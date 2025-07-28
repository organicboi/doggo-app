import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface SimpleOpenSourceMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  style?: any;
}

export default function SimpleOpenSourceMap({ 
  latitude = 40.7128, 
  longitude = -74.0060, 
  zoom = 13,
  style 
}: SimpleOpenSourceMapProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([${latitude}, ${longitude}], ${zoom});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add a marker at the center
        L.marker([${latitude}, ${longitude}]).addTo(map)
          .bindPopup('Your Location')
          .openPopup();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <LinearGradient colors={['#10b981', '#059669']} style={StyleSheet.absoluteFillObject} />
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading OpenStreetMap...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.webview}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
}); 