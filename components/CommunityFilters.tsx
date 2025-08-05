import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Filter {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CommunityFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters: Filter[] = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'photos', label: 'Photos', icon: 'camera-outline' },
  { id: 'stories', label: 'Stories', icon: 'library-outline' },
  { id: 'help', label: 'Help', icon: 'help-circle-outline' },
  { id: 'nearby', label: 'Nearby', icon: 'location-outline' },
];

export function CommunityFilters({ activeFilter, onFilterChange }: CommunityFiltersProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilter === filter.id && styles.activeFilterButton,
            ]}
            onPress={() => onFilterChange(filter.id)}
          >
            <Ionicons
              name={filter.icon}
              size={18}
              color={activeFilter === filter.id ? '#FF6B6B' : '#666'}
            />
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.activeFilterText,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: '#FFE8E8',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: '#FF6B6B',
  },
});
