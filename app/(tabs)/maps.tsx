import React from 'react';
import { StyleSheet, View } from 'react-native';
import EnhancedOpenSourceMap from '../../components/EnhancedOpenSourceMap';

export default function MapsTab() {
  return (
    <View style={styles.container}>
      <EnhancedOpenSourceMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});