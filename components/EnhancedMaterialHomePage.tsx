import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, Animated, RefreshControl } from 'react-native';
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
  Badge,
  Searchbar,
  Portal,
  Modal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnhancedMaterialHomePageProps {
  onSignOut: () => void;
  userEmail?: string;
}

export default function EnhancedMaterialHomePage({ onSignOut, userEmail }: EnhancedMaterialHomePageProps) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 2000);
  };

  const quickActions = [
    {
      title: 'Find Dogs',
      subtitle: 'Discover nearby pals',
      icon: 'pets',
      color: theme.colors.primary,
      gradient: [theme.colors.primary, theme.colors.secondary],
      onPress: () => {},
    },
    {
      title: 'Report Stray',
      subtitle: 'Help a dog in need',
      icon: 'report-problem',
      color: theme.colors.error,
      gradient: [theme.colors.error, '#ff6b6b'],
      onPress: () => {},
    },
    {
      title: 'Emergency',
      subtitle: 'Urgent assistance',
      icon: 'local-hospital',
      color: theme.colors.tertiary,
      gradient: [theme.colors.tertiary, '#ff9f43'],
      onPress: () => {},
    },
    {
      title: 'Community',
      subtitle: 'Connect & share',
      icon: 'groups',
      color: theme.colors.secondary,
      gradient: [theme.colors.secondary, '#4834d4'],
      onPress: () => {},
    },
  ];

  const nearbyDogs = [
    {
      id: 1,
      name: 'Max',
      breed: 'Golden Retriever',
      distance: '0.2 km',
      image: require('../assets/dog.png'),
      owner: 'Sarah',
      rating: 4.8,
    },
    {
      id: 2,
      name: 'Luna',
      breed: 'Husky',
      distance: '0.5 km',
      image: require('../assets/ownedDog.png'),
      owner: 'Mike',
      rating: 4.9,
    },
    {
      id: 3,
      name: 'Charlie',
      breed: 'Labrador',
      distance: '0.8 km',
      image: require('../assets/rescueDog.png'),
      owner: 'Emma',
      rating: 4.7,
    },
  ];

  const recentActivity = [
    { 
      icon: 'favorite', 
      title: 'You helped Max find a home!', 
      time: '2 hours ago',
      type: 'success',
      points: '+15'
    },
    { 
      icon: 'location-on', 
      title: 'New dogs spotted in Central Park', 
      time: '5 hours ago',
      type: 'info',
      points: '+5'
    },
    { 
      icon: 'camera-alt', 
      title: 'Luna\'s photo got 12 likes', 
      time: '1 day ago',
      type: 'social',
      points: '+3'
    },
  ];

  const emergencyAlerts = [
    {
      id: 1,
      type: 'urgent',
      title: 'Injured dog near Oak Street',
      description: 'Small dog with leg injury needs immediate help',
      time: '10 min ago',
      distance: '1.2 km',
    },
  ];

  const renderStatsCard = (icon: string, value: string, label: string, color: string, delay: number) => (
    <Animated.View
      style={[
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }] 
        }
      ]}
    >
      <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={3}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
          <MaterialIcons name={icon as any} size={28} color={color} />
        </View>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
          {value}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          {label}
        </Text>
      </Surface>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Enhanced Header Section */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Avatar.Icon
                  size={56}
                  icon="account"
                  style={{ backgroundColor: theme.colors.surface, elevation: 4 }}
                />
                <View style={styles.headerText}>
                  <Text variant="headlineSmall" style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>
                    Hello, {userEmail?.split('@')[0] || 'Dog Lover'}! 👋
                  </Text>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onPrimary, opacity: 0.9 }}>
                    Ready to make some tails wag?
                  </Text>
                  <View style={styles.locationContainer}>
                    <MaterialIcons name="location-on" size={16} color={theme.colors.onPrimary} />
                    <Text variant="bodySmall" style={{ color: theme.colors.onPrimary, opacity: 0.8, marginLeft: 4 }}>
                      Pune, Maharashtra
                    </Text>
                  </View>
                </View>
              </View>
              <IconButton
                icon="logout"
                iconColor={theme.colors.onPrimary}
                onPress={onSignOut}
                style={{ backgroundColor: `${theme.colors.onPrimary}25`, elevation: 2 }}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Enhanced Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatsCard('pets', '24', 'Dogs\nNearby', theme.colors.primary, 0)}
          {renderStatsCard('favorite', '12', 'Dogs\nHelped', theme.colors.error, 100)}
          {renderStatsCard('star', '285', 'Points\nEarned', theme.colors.tertiary, 200)}
        </View>

        {/* Emergency Alerts */}
        {emergencyAlerts.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.error }]}>
              🚨 Emergency Alerts
            </Text>
            {emergencyAlerts.map((alert) => (
              <Card key={alert.id} style={[styles.emergencyCard, { borderLeftColor: theme.colors.error }]}>
                <Card.Content>
                  <View style={styles.emergencyHeader}>
                    <Badge style={{ backgroundColor: theme.colors.error }}>URGENT</Badge>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {alert.time} • {alert.distance}
                    </Text>
                  </View>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginVertical: 8 }}>
                    {alert.title}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                    {alert.description}
                  </Text>
                  <Button
                    mode="contained"
                    style={{ backgroundColor: theme.colors.error }}
                    icon="directions-run"
                    compact
                  >
                    Respond Now
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Enhanced Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            🎯 Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
                onPress={action.onPress}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionContent}>
                    <MaterialIcons name={action.icon as any} size={32} color="white" />
                    <Text variant="titleMedium" style={styles.actionTitle}>
                      {action.title}
                    </Text>
                    <Text variant="bodySmall" style={styles.actionSubtitle}>
                      {action.subtitle}
                    </Text>
                  </View>
                </LinearGradient>
              </Card>
            ))}
          </View>
        </View>

        {/* Nearby Dogs Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground, marginBottom: 0 }]}>
              🐕 Dogs Nearby
            </Text>
            <Button mode="text" onPress={() => {}}>View All</Button>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {nearbyDogs.map((dog) => (
              <Card key={dog.id} style={styles.dogCard}>
                <Card.Cover source={dog.image} style={styles.dogImage} />
                <Card.Content style={styles.dogContent}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{dog.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {dog.breed} • {dog.distance}
                  </Text>
                  <View style={styles.dogFooter}>
                    <View style={styles.ratingContainer}>
                      <MaterialIcons name="star" size={16} color="#ffd700" />
                      <Text variant="bodySmall">{dog.rating}</Text>
                    </View>
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                      by {dog.owner}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Enhanced Activity Feed */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            📈 Recent Activity
          </Text>
          <Card style={{ backgroundColor: theme.colors.surface }}>
            {recentActivity.map((item, index) => (
              <React.Fragment key={index}>
                <List.Item
                  title={item.title}
                  description={item.time}
                  left={(props) => (
                    <View style={[styles.activityIcon, { 
                      backgroundColor: item.type === 'success' ? `${theme.colors.primary}15` :
                                     item.type === 'info' ? `${theme.colors.secondary}15` :
                                     `${theme.colors.tertiary}15`
                    }]}>
                      <MaterialIcons 
                        name={item.icon as any} 
                        size={20} 
                        color={item.type === 'success' ? theme.colors.primary :
                               item.type === 'info' ? theme.colors.secondary :
                               theme.colors.tertiary}
                      />
                    </View>
                  )}
                  right={(props) => (
                    <Chip 
                      style={{ backgroundColor: theme.colors.primaryContainer }}
                      textStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 12 }}
                    >
                      {item.points}
                    </Chip>
                  )}
                  titleStyle={{ color: theme.colors.onSurface, fontWeight: '500' }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                />
                {index < recentActivity.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Card>
        </View>

        {/* Enhanced Community Progress */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            🌟 Community Impact
          </Text>
          <Card style={{ backgroundColor: theme.colors.surface }}>
            <Card.Content>
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                    Monthly Goal Progress
                  </Text>
                  <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    47/50
                  </Text>
                </View>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginVertical: 8 }}>
                  Dogs helped this month
                </Text>
                <ProgressBar
                  progress={0.94}
                  color={theme.colors.primary}
                  style={{ height: 8, borderRadius: 4 }}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 4, textAlign: 'right' }}>
                  94% Complete
                </Text>
              </View>
              
              <Divider style={{ marginVertical: 20 }} />
              
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
                Your Achievements
              </Text>
              <View style={styles.achievementChips}>
                <Chip
                  icon="star"
                  style={{ backgroundColor: theme.colors.primaryContainer, marginRight: 8, marginBottom: 8 }}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                >
                  Top Helper
                </Chip>
                <Chip
                  icon="favorite"
                  style={{ backgroundColor: theme.colors.secondaryContainer, marginRight: 8, marginBottom: 8 }}
                  textStyle={{ color: theme.colors.onSecondaryContainer }}
                >
                  Dog Lover
                </Chip>
                <Chip
                  icon="local-fire-department"
                  style={{ backgroundColor: theme.colors.tertiaryContainer, marginBottom: 8 }}
                  textStyle={{ color: theme.colors.onTertiaryContainer }}
                >
                  5 Day Streak
                </Chip>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Enhanced Floating Action Button */}
      <FAB
        icon="add"
        label="Quick Add"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowQuickAddModal(true)}
        variant="primary"
      />

      {/* Quick Add Modal */}
      <Portal>
        <Modal
          visible={showQuickAddModal}
          onDismiss={() => setShowQuickAddModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Title title="Quick Add" subtitle="What would you like to add?" />
            <Card.Content>
              <View style={styles.quickAddOptions}>
                <Button
                  mode="contained"
                  icon="pets"
                  style={{ marginBottom: 12 }}
                  onPress={() => setShowQuickAddModal(false)}
                >
                  Add a Dog
                </Button>
                <Button
                  mode="contained"
                  icon="report-problem"
                  style={{ marginBottom: 12, backgroundColor: theme.colors.error }}
                  onPress={() => setShowQuickAddModal(false)}
                >
                  Report Stray
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setShowQuickAddModal(false)}
                >
                  Cancel
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    padding: 12,
    borderRadius: 50,
    marginBottom: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  emergencyCard: {
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 56) / 2,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionContent: {
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  horizontalScroll: {
    marginTop: 8,
  },
  dogCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dogImage: {
    height: 120,
  },
  dogContent: {
    padding: 12,
  },
  dogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    bottom: 20,
    right: 20,
    elevation: 8,
  },
  modalContent: {
    margin: 20,
    borderRadius: 20,
  },
  quickAddOptions: {
    gap: 8,
  },
}); 