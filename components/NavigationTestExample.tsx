import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { openGoogleMapsNavigation } from '../lib/mapService';

/**
 * Complete example of Google Maps navigation with local notifications
 * 
 * This component demonstrates:
 * 1. Requesting notification permissions (using Expo Notifications)
 * 2. Showing local notification with dog name and reason
 * 3. Opening Google Maps without labels
 * 4. Cross-platform compatibility (iOS & Android)
 */
const NavigationTestExample: React.FC = () => {
  
  const handleNavigateExample = async () => {
    try {
      // Example dog data
      const dogName = "Bruno";
      const latitude = 37.7749; // San Francisco coordinates for testing
      const longitude = -122.4194;
      const reason = "Needs medical help";
      
      // This will:
      // 1. Request notification permissions
      // 2. Show notification: "Navigating to Bruno" with body "Reason: Needs medical help"
      // 3. Open Google Maps/Apple Maps with navigation to coordinates (without labels)
      await openGoogleMapsNavigation(latitude, longitude, dogName, reason);
      
    } catch (error) {
      console.error('Navigation test failed:', error);
      Alert.alert('Error', 'Navigation test failed');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Navigation Test" subtitle="Test Google Maps navigation with notifications" />
        <Card.Content>
          <Text style={styles.description}>
            This will show a notification and open Google Maps navigation to a test location.
          </Text>
          <Text style={styles.details}>
            • Notification: "Navigating to Bruno"{'\n'}
            • Body: "Reason: Needs medical help"{'\n'}
            • Opens Maps without destination labels{'\n'}
            • Works on both iOS and Android
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={handleNavigateExample}>
            Test Navigation
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 12,
    fontSize: 16,
  },
  details: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default NavigationTestExample; 