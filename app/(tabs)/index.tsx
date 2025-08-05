import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'

const { width } = Dimensions.get('window')

const HomeScreen = () => {
  const [user, setUser] = useState<any>(null)
  const [greeting, setGreeting] = useState('')
  const insets = useSafeAreaInsets()

  useEffect(() => {
    getUser()
    setGreeting(getTimeBasedGreeting())
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const quickActions = [
    { id: 1, title: 'Find Dogs', subtitle: 'Search nearby', icon: 'search', gradient: ['#FF6B8A', '#FF8A80'] },
    { id: 2, title: 'Add Dog', subtitle: 'Report found', icon: 'add-circle', gradient: ['#4ECDC4', '#44A08D'] },
    { id: 3, title: 'Emergency', subtitle: 'Urgent help', icon: 'medical', gradient: ['#FA709A', '#FEE140'] },
    { id: 4, title: 'Community', subtitle: 'Join events', icon: 'people', gradient: ['#A8EDEA', '#FED6E3'] },
  ]

  const featuredStats = [
    { title: 'Dogs Helped', value: '2,847', icon: 'heart', trend: '+12%' },
    { title: 'Active Users', value: '1,234', icon: 'people', trend: '+8%' },
    { title: 'Success Rate', value: '94%', icon: 'checkmark-circle', trend: '+3%' },
  ]

  const recentActivity = [
    { 
      id: 1, 
      title: 'Golden Retriever found in Central Park', 
      subtitle: 'Reunited with family',
      time: '2h ago', 
      icon: 'paw',
      status: 'success'
    },
    { 
      id: 2, 
      title: 'Community dog walk event', 
      subtitle: 'Tomorrow at 9 AM',
      time: '5h ago', 
      icon: 'calendar',
      status: 'upcoming'
    },
    { 
      id: 3, 
      title: 'Missing Husky reported', 
      subtitle: 'Help us find Luna',
      time: '1d ago', 
      icon: 'search',
      status: 'active'
    },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#F8FAFF', '#EEF4FF']}
          style={styles.gradient}
        >
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContainer,
              { 
                paddingTop: Math.max(insets.top, 10),
                paddingBottom: Math.max(insets.bottom, 120)
              }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Modern Header */}
            <View style={styles.modernHeader}>
              <View style={styles.headerContent}>
                <View style={styles.greetingContainer}>
                  <Text style={styles.modernGreeting}>{greeting}</Text>
                  <Text style={styles.modernUserName}>
                    {user?.email?.split('@')[0] || 'Dog Lover'} 🐕
                  </Text>
                </View>
                <TouchableOpacity style={styles.modernNotificationButton}>
                  <LinearGradient
                    colors={['#667EEA', '#764BA2']}
                    style={styles.notificationGradient}
                  >
                    <Ionicons name="notifications-outline" size={20} color="#fff" />
                    <View style={styles.modernNotificationBadge} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Featured Stats Banner */}
            <View style={styles.statsContainer}>
              <Text style={styles.modernSectionTitle}>Community Impact</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsScrollContainer}
              >
                {featuredStats.map((stat, index) => (
                  <View key={index} style={styles.modernStatCard}>
                    <LinearGradient
                      colors={['#FFFFFF', '#F8FAFF']}
                      style={styles.statCardGradient}
                    >
                      <View style={styles.statIconContainer}>
                        <Ionicons name={stat.icon as any} size={24} color="#667EEA" />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statTitle}>{stat.title}</Text>
                      <View style={styles.trendContainer}>
                        <Ionicons name="trending-up" size={12} color="#4ECDC4" />
                        <Text style={styles.trendText}>{stat.trend}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.section}>
              <Text style={styles.modernSectionTitle}>Quick Actions</Text>
              <View style={styles.modernQuickActionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity key={action.id} style={styles.modernQuickActionCard}>
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.quickActionGradient}
                    >
                      <View style={styles.modernQuickActionIcon}>
                        <Ionicons name={action.icon as any} size={28} color="#fff" />
                      </View>
                      <View style={styles.quickActionTextContainer}>
                        <Text style={styles.modernQuickActionTitle}>{action.title}</Text>
                        <Text style={styles.modernQuickActionSubtitle}>{action.subtitle}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.modernSectionTitle}>Recent Activity</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modernActivityList}>
                {recentActivity.map((activity) => (
                  <TouchableOpacity key={activity.id} style={styles.modernActivityItem}>
                    <View style={[
                      styles.modernActivityIcon,
                      { backgroundColor: activity.status === 'success' ? '#E8F5E8' : 
                                       activity.status === 'upcoming' ? '#FFF4E6' : '#F0F4FF' }
                    ]}>
                      <Ionicons 
                        name={activity.icon as any} 
                        size={20} 
                        color={activity.status === 'success' ? '#4ECDC4' : 
                               activity.status === 'upcoming' ? '#FFA726' : '#667EEA'} 
                      />
                    </View>
                    <View style={styles.modernActivityContent}>
                      <Text style={styles.modernActivityTitle}>{activity.title}</Text>
                      <Text style={styles.modernActivitySubtitle}>{activity.subtitle}</Text>
                      <Text style={styles.modernActivityTime}>{activity.time}</Text>
                    </View>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: activity.status === 'success' ? '#4ECDC4' : 
                                         activity.status === 'upcoming' ? '#FFA726' : '#667EEA' }
                    ]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </SafeAreaView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  backgroundContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  
  // Modern Header Styles
  modernHeader: {
    marginBottom: 28,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  modernGreeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1D29',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  modernUserName: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  modernNotificationButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationGradient: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modernNotificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B8A',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Stats Container
  statsContainer: {
    marginBottom: 32,
  },
  statsScrollContainer: {
    paddingRight: 20,
  },
  modernStatCard: {
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  statCardGradient: {
    padding: 20,
    width: 140,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1D29',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 10,
    color: '#4ECDC4',
    fontWeight: '700',
    marginLeft: 4,
  },

  // Section Styles
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D29',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
  },

  // Quick Actions
  modernQuickActionsGrid: {
    gap: 16,
  },
  modernQuickActionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 80,
  },
  modernQuickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionTextContainer: {
    flex: 1,
  },
  modernQuickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  modernQuickActionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Activity List
  modernActivityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },
  modernActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  modernActivityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modernActivityContent: {
    flex: 1,
  },
  modernActivityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  modernActivitySubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  modernActivityTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },

  // Legacy styles (keeping for compatibility)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userName: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  notificationButton: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff6b6b',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backdropFilter: 'blur(10px)',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backdropFilter: 'blur(10px)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activityList: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backdropFilter: 'blur(10px)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
})