/**
 * DogoApp Modern Home Screen
 * Using the unified design system for consistent UI/UX
 */

import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    BrandColors,
    DogoCard,
    DogoSectionHeader,
    DogoStatsCard,
    Theme
} from '../../components/ui/UnifiedComponents';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================
interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  gradient: [string, string];
  onPress: () => void;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  status: 'success' | 'pending' | 'warning';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const ModernHomeScreen: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadUser();
    setGreeting(getTimeBasedGreeting());
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  const getUserName = (): string => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Dog Lover';
  };

  // =============================================================================
  // DATA
  // =============================================================================
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Find Dogs',
      subtitle: 'Search nearby',
      icon: 'pets',
      gradient: Theme.gradients.primary as [string, string],
      onPress: () => console.log('Find Dogs'),
    },
    {
      id: '2',
      title: 'Report Found',
      subtitle: 'Help a dog',
      icon: 'add-location',
      gradient: Theme.gradients.success as [string, string],
      onPress: () => console.log('Report Found'),
    },
    {
      id: '3',
      title: 'Emergency',
      subtitle: 'Urgent help',
      icon: 'emergency',
      gradient: Theme.gradients.error as [string, string],
      onPress: () => console.log('Emergency'),
    },
    {
      id: '4',
      title: 'Community',
      subtitle: 'Join events',
      icon: 'groups',
      gradient: Theme.gradients.community as [string, string],
      onPress: () => console.log('Community'),
    },
  ];

  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      title: 'Golden Retriever Reunited',
      subtitle: 'Found in Central Park',
      time: '2h ago',
      icon: 'favorite',
      status: 'success',
    },
    {
      id: '2',
      title: 'Dog Walk Event',
      subtitle: 'Tomorrow at 9 AM',
      time: '5h ago',
      icon: 'event',
      status: 'pending',
    },
    {
      id: '3',
      title: 'Missing Husky Alert',
      subtitle: 'Help find Luna',
      time: '1d ago',
      icon: 'search',
      status: 'warning',
    },
  ];

  // =============================================================================
  // RENDER METHODS
  // =============================================================================
  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[Theme.colors.primary, `${Theme.colors.primary}dd`]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingSection}>
            <Text style={[Theme.typography.headlineMedium, styles.greeting]}>
              {greeting}
            </Text>
            <Text style={[Theme.typography.titleMedium, styles.userName]}>
              {getUserName()}
            </Text>
            <Text style={[Theme.typography.bodyMedium, styles.subtitle]}>
              Ready to help more dogs today?
            </Text>
          </View>
          
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications" size={24} color="white" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsSection}>
      <DogoSectionHeader
        title="Community Impact"
        subtitle="Your contribution this month"
        icon="trending-up"
      />
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
      >
        <DogoStatsCard
          icon="pets"
          value="24"
          label="Dogs Nearby"
          trend={{ direction: 'up', value: '+12%' }}
          color={BrandColors.primary[500]}
          style={{ marginRight: Theme.spacing.md }}
        />
        
        <DogoStatsCard
          icon="favorite"
          value="8"
          label="Dogs Helped"
          trend={{ direction: 'up', value: '+3' }}
          color={BrandColors.success[500]}
          style={{ marginRight: Theme.spacing.md }}
        />
        
        <DogoStatsCard
          icon="star"
          value="150"
          label="Points Earned"
          trend={{ direction: 'up', value: '+25' }}
          color={BrandColors.warning[500]}
          style={{ marginRight: Theme.spacing.md }}
        />
      </ScrollView>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsSection}>
      <DogoSectionHeader
        title="Quick Actions"
        subtitle="What would you like to do?"
        actionText="View All"
        onActionPress={() => console.log('View All Actions')}
      />
      
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity 
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={action.gradient}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons 
                name={action.icon} 
                size={32} 
                color="white" 
                style={styles.actionIcon}
              />
              <Text style={[Theme.typography.titleSmall, styles.actionTitle]}>
                {action.title}
              </Text>
              <Text style={[Theme.typography.bodySmall, styles.actionSubtitle]}>
                {action.subtitle}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activitySection}>
      <DogoSectionHeader
        title="Recent Activity"
        subtitle="Latest updates in your area"
        actionText="View More"
        onActionPress={() => console.log('View More Activity')}
      />
      
      <DogoCard variant="elevated" style={styles.activityCard}>
        {recentActivity.map((activity, index) => (
          <View key={activity.id}>
            <View style={styles.activityItem}>
              <View style={[
                styles.activityIconContainer,
                { backgroundColor: getStatusColor(activity.status) }
              ]}>
                <MaterialIcons 
                  name={activity.icon} 
                  size={20} 
                  color="white" 
                />
              </View>
              
              <View style={styles.activityContent}>
                <Text style={[Theme.typography.titleSmall, styles.activityTitle]}>
                  {activity.title}
                </Text>
                <Text style={[Theme.typography.bodyMedium, styles.activitySubtitle]}>
                  {activity.subtitle}
                </Text>
                <Text style={[Theme.typography.bodySmall, styles.activityTime]}>
                  {activity.time}
                </Text>
              </View>
              
              <MaterialIcons 
                name="chevron-right" 
                size={20} 
                color={Theme.colors.onSurfaceVariant} 
              />
            </View>
            
            {index < recentActivity.length - 1 && (
              <View style={styles.activityDivider} />
            )}
          </View>
        ))}
      </DogoCard>
    </View>
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return BrandColors.success[500];
      case 'warning': return BrandColors.warning[500];
      case 'pending': return BrandColors.primary[500];
      default: return BrandColors.neutral[500];
    }
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.colors.background, Theme.colors.surfaceVariant]}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {renderHeader()}
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 100) }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {renderStats()}
            {renderQuickActions()}
            {renderRecentActivity()}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header styles
  header: {
    marginBottom: -Theme.spacing.xl,
    zIndex: 1,
  },
  headerGradient: {
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxxl,
    paddingHorizontal: Theme.spacing.screen.paddingHorizontal,
    borderBottomLeftRadius: Theme.borderRadius.xxxl,
    borderBottomRightRadius: Theme.borderRadius.xxxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    color: 'white',
    marginBottom: Theme.spacing.xs,
  },
  userName: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.error[500],
  },
  
  // Scroll view styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Theme.spacing.xl,
  },
  
  // Stats section
  statsSection: {
    marginBottom: Theme.spacing.xl,
  },
  statsContainer: {
    paddingHorizontal: Theme.spacing.screen.paddingHorizontal,
  },
  
  // Actions section
  actionsSection: {
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.screen.paddingHorizontal,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  actionCard: {
    width: (SCREEN_WIDTH - Theme.spacing.screen.paddingHorizontal * 2 - Theme.spacing.md) / 2,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    ...Theme.shadows.md,
  },
  actionGradient: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionIcon: {
    marginBottom: Theme.spacing.sm,
  },
  actionTitle: {
    color: 'white',
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  actionSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // Activity section
  activitySection: {
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.screen.paddingHorizontal,
  },
  activityCard: {
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.xs,
  },
  activitySubtitle: {
    color: Theme.colors.onSurfaceVariant,
    marginBottom: Theme.spacing.xs / 2,
  },
  activityTime: {
    color: Theme.colors.onSurfaceVariant,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Theme.colors.outline,
    marginLeft: Theme.spacing.lg + 40 + Theme.spacing.md,
    marginRight: Theme.spacing.lg,
  },
});

export default ModernHomeScreen;
