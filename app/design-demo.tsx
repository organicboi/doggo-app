/**
 * Design System Demo Screen
 * 
 * Showcases the DogoApp unified design system components and usage
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BrandColors,
  Button as DogoButton,
  Card as DogoCard,
  Chip as DogoChip,
  FAB as DogoFAB,
  SectionHeader as DogoSectionHeader,
  StatsCard as DogoStatsCard,
  Theme,
} from '../components/ui/UnifiedComponents';

export default function DesignDemo() {
  const [selectedChip, setSelectedChip] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <Text style={styles.title}>DogoApp Design System</Text>
          <Text style={styles.subtitle}>
            Modern UI components with consistent theming
          </Text>

          {/* Typography Section */}
          <DogoCard variant="elevated">
            <DogoSectionHeader 
              title="Typography" 
              subtitle="Text styles and hierarchy"
            />
            <View style={styles.typographyContainer}>
              <Text style={[styles.text, { fontSize: 28, fontWeight: '700' }]}>Display Large</Text>
              <Text style={[styles.text, { fontSize: 24, fontWeight: '600' }]}>Headline Large</Text>
              <Text style={[styles.text, { fontSize: 20, fontWeight: '500' }]}>Title Large</Text>
              <Text style={[styles.text, { fontSize: 16, fontWeight: '400' }]}>Body Large - Perfect for main content</Text>
              <Text style={[styles.text, { fontSize: 14, fontWeight: '400' }]}>Body Medium - Standard text size</Text>
              <Text style={[styles.text, { fontSize: 12, fontWeight: '400', color: BrandColors.neutral[600] }]}>Caption for metadata</Text>
            </View>
          </DogoCard>

          {/* Buttons Section */}
          <DogoCard variant="elevated">
            <DogoSectionHeader 
              title="Buttons" 
              subtitle="Interactive elements and actions"
            />
            <View style={styles.buttonContainer}>
              <DogoButton
                title="Primary Button"
                variant="primary"
                onPress={handleLoading}
                loading={loading}
              />
              <DogoButton
                title="Secondary Button"
                variant="secondary"
                onPress={() => console.log('Secondary pressed')}
              />
              <DogoButton
                title="Success Action"
                variant="secondary"
                onPress={() => console.log('Success pressed')}
              />
              <DogoButton
                title="Danger Action"
                variant="outline"
                onPress={() => console.log('Danger pressed')}
              />
              <DogoButton
                title="Outline Style"
                variant="outline"
                onPress={() => console.log('Outline pressed')}
              />
              <DogoButton
                title="Ghost Button"
                variant="ghost"
                onPress={() => console.log('Ghost pressed')}
              />
            </View>
          </DogoCard>

          {/* Cards Section */}
          <DogoCard variant="elevated">
            <DogoSectionHeader 
              title="Cards" 
              subtitle="Content containers and layouts"
            />
            <View style={styles.cardContainer}>
              <DogoCard variant="filled">
                <Text style={styles.cardTitle}>Filled Card</Text>
                <Text style={styles.cardDescription}>
                  This is a filled card variant with background color
                </Text>
              </DogoCard>
              
              <DogoCard variant="outlined">
                <Text style={styles.cardTitle}>Outline Card</Text>
                <Text style={styles.cardDescription}>
                  This is an outlined card variant with border
                </Text>
              </DogoCard>
              
              <DogoCard variant="filled">
                <Text style={styles.cardTitle}>Alternative Card</Text>
                <Text style={styles.cardDescription}>
                  This is another filled card variant
                </Text>
              </DogoCard>
            </View>
          </DogoCard>

          {/* Stats Cards Section */}
          <DogoCard variant="elevated">
            <DogoSectionHeader 
              title="Stats Cards" 
              subtitle="Data visualization components"
            />
            <View style={styles.statsContainer}>
              <DogoStatsCard
                icon="pets"
                value="1,234"
                label="Total Dogs"
                trend={{
                  direction: "up",
                  value: "+12%"
                }}
              />
              <DogoStatsCard
                icon="group"
                value="856"
                label="Active Users"
                trend={{
                  direction: "up",
                  value: "+8%"
                }}
              />
              <DogoStatsCard
                icon="forum"
                value="92"
                label="New Posts"
                trend={{
                  direction: "down",
                  value: "-3%"
                }}
              />
            </View>
          </DogoCard>

          {/* Chips Section */}
          <DogoCard variant="elevated">
            <DogoSectionHeader 
              title="Chips" 
              subtitle="Selection and filtering components"
            />
            <View style={styles.chipContainer}>
              {['All Dogs', 'Small', 'Medium', 'Large', 'Puppies'].map((label, index) => (
                <DogoChip
                  key={index}
                  label={label}
                  selected={selectedChip === index}
                  onPress={() => setSelectedChip(index)}
                />
              ))}
            </View>
          </DogoCard>

          {/* Color Palette Section */}
          <DogoCard variant="elevated">
            <DogoSectionHeader 
              title="Color Palette" 
              subtitle="Brand and semantic colors"
            />
            <View style={styles.colorContainer}>
              {Object.entries(BrandColors).map(([name, colorValue]) => {
                if (typeof colorValue === 'object') {
                  return Object.entries(colorValue).map(([shade, color]) => (
                    <View key={`${name}-${shade}`} style={styles.colorItem}>
                      <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                      <Text style={styles.colorName}>{name}.{shade}</Text>
                    </View>
                  ));
                } else {
                  return (
                    <View key={name} style={styles.colorItem}>
                      <View style={[styles.colorSwatch, { backgroundColor: colorValue }]} />
                      <Text style={styles.colorName}>{name}</Text>
                    </View>
                  );
                }
              })}
            </View>
          </DogoCard>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <DogoFAB
        icon="add"
        onPress={() => console.log('FAB pressed')}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.neutral[50],
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: Theme.spacing.lg,
    gap: Theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.primary[600],
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: BrandColors.neutral[600],
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  typographyContainer: {
    gap: Theme.spacing.md,
  },
  text: {
    color: BrandColors.neutral[900],
  },
  buttonContainer: {
    gap: Theme.spacing.md,
  },
  cardContainer: {
    gap: Theme.spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.neutral[900],
    marginBottom: Theme.spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    color: BrandColors.neutral[600],
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  colorItem: {
    alignItems: 'center',
    width: 80,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: BrandColors.neutral[200],
  },
  colorName: {
    fontSize: 12,
    color: BrandColors.neutral[600],
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Theme.spacing.xl,
    right: Theme.spacing.xl,
  },
});
