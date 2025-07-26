import React from 'react';
import { ScrollView, View, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  Surface,
  Avatar,
  Chip,
  Divider,
  List,
  IconButton,
  useTheme,
  FAB,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MaterialHomePageProps {
  onSignOut: () => void;
  userEmail?: string;
}

export default function MaterialHomePage({ onSignOut, userEmail }: MaterialHomePageProps) {
  const theme = useTheme();

  const quickActions = [
    {
      title: 'Find Dogs',
      subtitle: 'Discover dogs in your area',
      icon: 'pets',
      color: theme.colors.primary,
      onPress: () => {},
    },
    {
      title: 'Report Stray',
      subtitle: 'Help a dog in need',
      icon: 'report',
      color: theme.colors.error,
      onPress: () => {},
    },
    {
      title: 'Emergency',
      subtitle: 'Quick assistance',
      icon: 'emergency',
      color: theme.colors.tertiary,
      onPress: () => {},
    },
    {
      title: 'Community',
      subtitle: 'Connect with others',
      icon: 'groups',
      color: theme.colors.secondary,
      onPress: () => {},
    },
  ];

  const recentActivity = [
    { icon: 'favorite', title: 'Liked Max the Golden Retriever', time: '2 hours ago' },
    { icon: 'location-on', title: 'Visited Central Park', time: '5 hours ago' },
    { icon: 'camera-alt', title: 'Shared a photo', time: '1 day ago' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Avatar.Icon
                size={48}
                icon="account"
                style={{ backgroundColor: theme.colors.surface }}
              />
              <View style={styles.headerText}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onPrimary }}>
                  Welcome back!
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary, opacity: 0.8 }}>
                  {userEmail?.split('@')[0] || 'Dog Lover'}
                </Text>
              </View>
            </View>
            <IconButton
              icon="logout"
              iconColor={theme.colors.onPrimary}
              onPress={onSignOut}
              style={{ backgroundColor: `${theme.colors.onPrimary}20` }}
            />
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <MaterialIcons name="pets" size={24} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>12</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Dogs Found</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <MaterialIcons name="favorite" size={24} color={theme.colors.error} />
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>8</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Helped</Text>
          </Surface>
          
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <MaterialIcons name="star" size={24} color={theme.colors.tertiary} />
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>150</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Points</Text>
          </Surface>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
                onPress={action.onPress}
              >
                <Card.Content style={styles.actionCardContent}>
                  <Avatar.Icon
                    size={40}
                    icon={action.icon}
                    style={{ backgroundColor: `${action.color}20` }}
                    color={action.color}
                  />
                  <Text variant="titleMedium" style={[styles.actionTitle, { color: theme.colors.onSurface }]}>
                    {action.title}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                    {action.subtitle}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Recent Activity
          </Text>
          <Card style={{ backgroundColor: theme.colors.surface }}>
            {recentActivity.map((item, index) => (
              <React.Fragment key={index}>
                <List.Item
                  title={item.title}
                  description={item.time}
                  left={(props) => (
                    <List.Icon 
                      {...props} 
                      icon={item.icon} 
                      color={theme.colors.primary}
                    />
                  )}
                  titleStyle={{ color: theme.colors.onSurface }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                />
                {index < recentActivity.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Community Progress */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Community Impact
          </Text>
          <Card style={{ backgroundColor: theme.colors.surface }}>
            <Card.Content>
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    Dogs Helped This Month
                  </Text>
                  <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
                    47/50
                  </Text>
                </View>
                <ProgressBar
                  progress={0.94}
                  color={theme.colors.primary}
                  style={{ marginTop: 8 }}
                />
              </View>
              
              <Divider style={{ marginVertical: 16 }} />
              
              <View style={styles.achievementChips}>
                <Chip
                  icon="star"
                  style={{ backgroundColor: theme.colors.primaryContainer, marginRight: 8 }}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                >
                  Top Helper
                </Chip>
                <Chip
                  icon="favorite"
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                  textStyle={{ color: theme.colors.onSecondaryContainer }}
                >
                  Dog Lover
                </Chip>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="add"
        label="Quick Add"
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary }
        ]}
        onPress={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 16,
  },
  actionCardContent: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  actionTitle: {
    textAlign: 'center',
    fontWeight: '600',
  },
  progressItem: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
}); 