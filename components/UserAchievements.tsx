import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../lib/supabase'

interface Achievement {
  id: string
  name: string
  description: string
  icon_url: string | null
  category: string
  requirement_type: string
  requirement_value: number
  points_reward: number
  badge_color: string
  is_active: boolean
  is_hidden: boolean
}

interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  progress: number
  is_completed: boolean
  completed_at: string | null
  created_at: string
  achievement: Achievement
}

interface Props {
  userId: string
  isVisible: boolean
  onClose: () => void
}

export default function UserAchievements({ userId, isVisible, onClose }: Props) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isVisible && userId) {
      fetchUserAchievements()
    }
  }, [isVisible, userId])

  async function fetchUserAchievements() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      if (error) throw error

      setAchievements(data || [])
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderAchievementIcon = (achievement: Achievement) => {
    // Map categories to icons
    const iconMap: { [key: string]: string } = {
      'walking': 'walk-outline',
      'social': 'people-outline',
      'care': 'heart-outline',
      'milestone': 'trophy-outline',
      'special': 'star-outline'
    }

    return iconMap[achievement.category] || 'medal-outline'
  }

  const getBadgeColor = (badgeColor: string) => {
    const colorMap: { [key: string]: string } = {
      'bronze': '#CD7F32',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'platinum': '#E5E4E2'
    }
    return colorMap[badgeColor] || '#CD7F32'
  }

  const renderAchievement = (userAchievement: UserAchievement) => {
    const { achievement, progress, is_completed, completed_at } = userAchievement
    const progressPercentage = (progress / achievement.requirement_value) * 100

    return (
      <View key={userAchievement.id} style={[
        styles.achievementCard,
        is_completed && styles.completedCard
      ]}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getBadgeColor(achievement.badge_color) }
        ]}>
          <Ionicons 
            name={renderAchievementIcon(achievement) as any} 
            size={24} 
            color="#fff" 
          />
        </View>
        
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementName}>{achievement.name}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min(progressPercentage, 100)}%`,
                    backgroundColor: is_completed ? '#4CAF50' : '#667eea'
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress}/{achievement.requirement_value}
            </Text>
          </View>
          
          <View style={styles.achievementFooter}>
            <View style={styles.pointsContainer}>
              <Ionicons name="star-outline" size={16} color="#FFD700" />
              <Text style={styles.pointsText}>{achievement.points_reward} points</Text>
            </View>
            
            {is_completed && completed_at && (
              <Text style={styles.completedText}>
                Completed {new Date(completed_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        
        {is_completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          </View>
        )}
      </View>
    )
  }

  if (!isVisible) return null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading achievements...</Text>
          </View>
        ) : achievements.length > 0 ? (
          <View style={styles.achievementsList}>
            {achievements.map(renderAchievement)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="medal-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No Achievements Yet</Text>
            <Text style={styles.emptyDescription}>
              Start walking dogs and helping the community to earn achievements!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  achievementsList: {
    padding: 20,
    gap: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  completedCard: {
    backgroundColor: '#f0f8f0',
    borderColor: '#4CAF50',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
})
