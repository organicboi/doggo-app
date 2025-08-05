import { Ionicons } from '@expo/vector-icons'
import { Session } from '@supabase/supabase-js'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Alert, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ImageService } from '../lib/imageService'
import { supabase } from '../lib/supabase'
import ProfileAvatar from './ProfileAvatar'
import UserAchievements from './UserAchievements'

interface Props {
  session: Session
}

interface UserProfile {
  id: string
  phone: string
  email: string | null
  full_name: string
  display_name: string | null
  avatar_url: string | null
  cover_image_url: string | null
  date_of_birth: string | null
  gender: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  preferred_radius: number
  notifications_enabled: boolean
  email_notifications: boolean
  sms_notifications: boolean
  phone_verified: boolean
  email_verified: boolean
  identity_verified: boolean
  background_check_status: string
  total_walks: number
  total_dogs_helped: number
  rating_average: number
  rating_count: number
  points: number
  is_walker: boolean
  is_owner: boolean
  subscription_tier: string
  subscription_expires_at: string | null
  created_at: string
  last_active_at: string | null
}

const SUBSCRIPTION_TIERS = ['free', 'premium', 'pro']
const GENDER_OPTIONS = ['male', 'female', 'non-binary', 'prefer-not-to-say']
const BACKGROUND_CHECK_STATUS = ['pending', 'approved', 'rejected', 'expired']

export default function EnhancedProfile({ session }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (session) getProfile()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        throw error
      }

      if (data) {
        console.log('Profile loaded:', data)
        setProfile(data)
        setTempProfile(data)
      } else {
        console.log('No profile found, creating new one')
        // Create a new profile if it doesn't exist
        const newProfile: Partial<UserProfile> = {
          id: session.user.id,
          phone: session.user.phone || '',
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || '',
          display_name: session.user.user_metadata?.display_name || null,
          avatar_url: null,
          cover_image_url: null,
          preferred_radius: 5,
          notifications_enabled: true,
          email_notifications: true,
          sms_notifications: true,
          phone_verified: false,
          email_verified: !!session.user.email_confirmed_at,
          identity_verified: false,
          background_check_status: 'pending',
          total_walks: 0,
          total_dogs_helped: 0,
          rating_average: 0,
          rating_count: 0,
          points: 0,
          is_walker: false,
          is_owner: false,
          subscription_tier: 'free',
          country: 'US'
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          throw createError
        }
        
        console.log('Profile created:', createdProfile)
        setProfile(createdProfile)
        setTempProfile(createdProfile)
      }
    } catch (error) {
      console.error('Error in getProfile:', error)
      Alert.alert('Error', 'Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      setSaving(true)
      if (!session?.user || !tempProfile) throw new Error('No user or profile data!')

      console.log('Updating profile with:', tempProfile)

      const { error } = await supabase
        .from('users')
        .update({
          ...tempProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)

      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }

      console.log('Profile updated successfully')
      setProfile(tempProfile)
      setEditMode(false)
      Alert.alert('Success', 'Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadCoverImage() {
    try {
      const hasPermissions = await ImageService.requestPermissions()
      if (!hasPermissions) {
        Alert.alert('Permission Required', 'Please allow access to photos to upload images.')
        return
      }

      const result = await ImageService.pickImageFromGallery({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0] && session.user) {
        const imageUri = result.assets[0].uri
        
        const uploadResult = await ImageService.uploadAndUpdateProfileImage(
          session.user.id,
          imageUri,
          'cover'
        )

        if (uploadResult.success && uploadResult.url) {
          if (tempProfile) {
            const updatedProfile = {
              ...tempProfile,
              cover_image_url: uploadResult.url
            }
            setTempProfile(updatedProfile)
            // Also update the main profile state immediately for UI consistency
            if (profile) {
              setProfile({ ...profile, cover_image_url: uploadResult.url })
            }
          }
          Alert.alert('Success', 'Cover image uploaded successfully!')
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to upload cover image')
        }
      }
    } catch (error) {
      console.error('Error uploading cover image:', error)
      Alert.alert('Error', 'Failed to upload cover image')
    }
  }

  const updateTempProfile = (field: keyof UserProfile, value: any) => {
    if (tempProfile) {
      setTempProfile({ ...tempProfile, [field]: value })
    }
  }

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <TouchableOpacity 
        style={styles.statItem}
        onPress={() => setShowAchievements(true)}
      >
        <Text style={styles.statNumber}>{profile?.total_walks || 0}</Text>
        <Text style={styles.statLabel}>Walks</Text>
      </TouchableOpacity>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{profile?.total_dogs_helped || 0}</Text>
        <Text style={styles.statLabel}>Dogs Helped</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{profile?.rating_average?.toFixed(1) || '0.0'}</Text>
        <Text style={styles.statLabel}>Rating</Text>
      </View>
      <TouchableOpacity 
        style={styles.statItem}
        onPress={() => setShowAchievements(true)}
      >
        <Text style={styles.statNumber}>{profile?.points || 0}</Text>
        <Text style={styles.statLabel}>Points</Text>
      </TouchableOpacity>
    </View>
  )

  const renderCoverImage = () => (
    <View style={styles.coverImageContainer}>
      {tempProfile?.cover_image_url ? (
        <Image source={{ uri: tempProfile.cover_image_url }} style={styles.coverImage} />
      ) : (
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.coverImage}
        />
      )}
      {editMode && (
        <TouchableOpacity
          style={styles.editCoverButton}
          onPress={() => uploadCoverImage()}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  )

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <ProfileAvatar
          size={120}
          url={tempProfile?.avatar_url || null}
          onUpload={(url: string) => {
            updateTempProfile('avatar_url', url)
            // Also update the main profile state immediately for UI consistency
            if (profile) {
              setProfile({ ...profile, avatar_url: url })
            }
          }}
          userId={session.user.id}
          editable={editMode}
          showUploadText={false}
        />
        {editMode && (
          <View style={styles.editAvatarOverlay}>
            <Ionicons name="camera-outline" size={24} color="#fff" />
          </View>
        )}
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.fullName}>{profile?.full_name || 'No Name'}</Text>
        <Text style={styles.displayName}>@{profile?.display_name || 'username'}</Text>
        <View style={styles.badgeContainer}>
          {profile?.is_walker && (
            <View style={[styles.badge, styles.walkerBadge]}>
              <Ionicons name="walk-outline" size={16} color="#fff" />
              <Text style={styles.badgeText}>Walker</Text>
            </View>
          )}
          {profile?.is_owner && (
            <View style={[styles.badge, styles.ownerBadge]}>
              <Ionicons name="heart-outline" size={16} color="#fff" />
              <Text style={styles.badgeText}>Owner</Text>
            </View>
          )}
          {profile?.identity_verified && (
            <View style={[styles.badge, styles.verifiedBadge]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.disabledInput]}
          value={tempProfile?.full_name || ''}
          onChangeText={(text) => updateTempProfile('full_name', text)}
          editable={editMode}
          placeholder="Enter your full name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Display Name</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.disabledInput]}
          value={tempProfile?.display_name || ''}
          onChangeText={(text) => updateTempProfile('display_name', text)}
          editable={editMode}
          placeholder="Choose a display name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={[styles.textInput, styles.disabledInput]}
          value={tempProfile?.email || ''}
          editable={false}
          placeholder="Email address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.disabledInput]}
          value={tempProfile?.phone || ''}
          onChangeText={(text) => updateTempProfile('phone', text)}
          editable={editMode}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Date of Birth</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.disabledInput]}
          value={tempProfile?.date_of_birth || ''}
          onChangeText={(text) => updateTempProfile('date_of_birth', text)}
          editable={editMode}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Gender</Text>
        <View style={styles.pickerContainer}>
          {GENDER_OPTIONS.map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.pickerOption,
                tempProfile?.gender === gender && styles.pickerOptionSelected
              ]}
              onPress={() => editMode && updateTempProfile('gender', gender)}
              disabled={!editMode}
            >
              <Text style={[
                styles.pickerOptionText,
                tempProfile?.gender === gender && styles.pickerOptionTextSelected
              ]}>
                {gender.charAt(0).toUpperCase() + gender.slice(1).replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  const renderLocationInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address Line 1</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.disabledInput]}
          value={tempProfile?.address_line1 || ''}
          onChangeText={(text) => updateTempProfile('address_line1', text)}
          editable={editMode}
          placeholder="Street address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address Line 2</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.disabledInput]}
          value={tempProfile?.address_line2 || ''}
          onChangeText={(text) => updateTempProfile('address_line2', text)}
          editable={editMode}
          placeholder="Apartment, suite, etc."
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>City</Text>
          <TextInput
            style={[styles.textInput, !editMode && styles.disabledInput]}
            value={tempProfile?.city || ''}
            onChangeText={(text) => updateTempProfile('city', text)}
            editable={editMode}
            placeholder="City"
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>State</Text>
          <TextInput
            style={[styles.textInput, !editMode && styles.disabledInput]}
            value={tempProfile?.state || ''}
            onChangeText={(text) => updateTempProfile('state', text)}
            editable={editMode}
            placeholder="State"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>Postal Code</Text>
          <TextInput
            style={[styles.textInput, !editMode && styles.disabledInput]}
            value={tempProfile?.postal_code || ''}
            onChangeText={(text) => updateTempProfile('postal_code', text)}
            editable={editMode}
            placeholder="Zip code"
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>Country</Text>
          <TextInput
            style={[styles.textInput, !editMode && styles.disabledInput]}
            value={tempProfile?.country || ''}
            onChangeText={(text) => updateTempProfile('country', text)}
            editable={editMode}
            placeholder="Country"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Preferred Radius (km)</Text>
        <TextInput
          style={[styles.textInput, !editMode && styles.disabledInput]}
          value={tempProfile?.preferred_radius?.toString() || '5'}
          onChangeText={(text) => updateTempProfile('preferred_radius', parseInt(text) || 5)}
          editable={editMode}
          placeholder="5"
          keyboardType="numeric"
        />
      </View>
    </View>
  )

  const renderUserTypes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>User Type</Text>
      
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Dog Walker</Text>
          <Text style={styles.switchDescription}>Offer walking services to other dog owners</Text>
        </View>
        <Switch
          value={tempProfile?.is_walker || false}
          onValueChange={(value) => updateTempProfile('is_walker', value)}
          disabled={!editMode}
          trackColor={{ false: '#767577', true: '#667eea' }}
          thumbColor={tempProfile?.is_walker ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Dog Owner</Text>
          <Text style={styles.switchDescription}>You own dogs that need walking services</Text>
        </View>
        <Switch
          value={tempProfile?.is_owner || false}
          onValueChange={(value) => updateTempProfile('is_owner', value)}
          disabled={!editMode}
          trackColor={{ false: '#767577', true: '#667eea' }}
          thumbColor={tempProfile?.is_owner ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  )

  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Push Notifications</Text>
          <Text style={styles.switchDescription}>Receive app notifications</Text>
        </View>
        <Switch
          value={tempProfile?.notifications_enabled || false}
          onValueChange={(value) => updateTempProfile('notifications_enabled', value)}
          disabled={!editMode}
          trackColor={{ false: '#767577', true: '#667eea' }}
          thumbColor={tempProfile?.notifications_enabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Email Notifications</Text>
          <Text style={styles.switchDescription}>Receive updates via email</Text>
        </View>
        <Switch
          value={tempProfile?.email_notifications || false}
          onValueChange={(value) => updateTempProfile('email_notifications', value)}
          disabled={!editMode}
          trackColor={{ false: '#767577', true: '#667eea' }}
          thumbColor={tempProfile?.email_notifications ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>SMS Notifications</Text>
          <Text style={styles.switchDescription}>Receive updates via text message</Text>
        </View>
        <Switch
          value={tempProfile?.sms_notifications || false}
          onValueChange={(value) => updateTempProfile('sms_notifications', value)}
          disabled={!editMode}
          trackColor={{ false: '#767577', true: '#667eea' }}
          thumbColor={tempProfile?.sms_notifications ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  )

  const renderSubscriptionInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Subscription</Text>
      
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionTier}>
            {tempProfile?.subscription_tier?.toUpperCase() || 'FREE'}
          </Text>
          {tempProfile?.subscription_tier !== 'free' && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
        
        {tempProfile?.subscription_expires_at && (
          <Text style={styles.subscriptionExpiry}>
            Expires: {new Date(tempProfile.subscription_expires_at).toLocaleDateString()}
          </Text>
        )}
        
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>
            {tempProfile?.subscription_tier === 'free' ? 'Upgrade to Premium' : 'Manage Subscription'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderVerificationStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Verification Status</Text>
      
      <View style={styles.verificationItem}>
        <Ionicons 
          name={profile?.phone_verified ? "checkmark-circle" : "close-circle"} 
          size={24} 
          color={profile?.phone_verified ? "#4CAF50" : "#FF5722"} 
        />
        <Text style={styles.verificationText}>Phone Verified</Text>
      </View>
      
      <View style={styles.verificationItem}>
        <Ionicons 
          name={profile?.email_verified ? "checkmark-circle" : "close-circle"} 
          size={24} 
          color={profile?.email_verified ? "#4CAF50" : "#FF5722"} 
        />
        <Text style={styles.verificationText}>Email Verified</Text>
      </View>
      
      <View style={styles.verificationItem}>
        <Ionicons 
          name={profile?.identity_verified ? "checkmark-circle" : "close-circle"} 
          size={24} 
          color={profile?.identity_verified ? "#4CAF50" : "#FF5722"} 
        />
        <Text style={styles.verificationText}>Identity Verified</Text>
      </View>
      
      <View style={styles.verificationItem}>
        <Ionicons 
          name={profile?.background_check_status === 'approved' ? "checkmark-circle" : "time-outline"} 
          size={24} 
          color={profile?.background_check_status === 'approved' ? "#4CAF50" : "#FF9800"} 
        />
        <Text style={styles.verificationText}>
          Background Check: {profile?.background_check_status ? 
            profile.background_check_status.charAt(0).toUpperCase() + profile.background_check_status.slice(1) 
            : 'Pending'}
        </Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {renderCoverImage()}
        
        <View style={styles.contentContainer}>
          {renderProfileHeader()}
          {renderStatsCard()}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, editMode && styles.cancelButton]}
              onPress={() => {
                if (editMode) {
                  setTempProfile(profile)
                  setEditMode(false)
                } else {
                  setEditMode(true)
                }
              }}
            >
              <Ionicons 
                name={editMode ? "close-outline" : "create-outline"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>

            {editMode && (
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, saving && styles.disabledButton]}
                onPress={updateProfile}
                disabled={saving}
              >
                <Ionicons name="checkmark-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {renderBasicInfo()}
          {renderLocationInfo()}
          {renderUserTypes()}
          {renderNotificationSettings()}
          {renderSubscriptionInfo()}
          {renderVerificationStatus()}
          
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => supabase.auth.signOut()}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF5722" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal 
        visible={showAchievements} 
        animationType="slide" 
        presentationStyle="pageSheet"
      >
        <UserAchievements 
          userId={session.user.id}
          isVisible={showAchievements}
          onClose={() => setShowAchievements(false)}
        />
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  coverImageContainer: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  editCoverButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    marginTop: -50,
    alignItems: 'center',
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  walkerBadge: {
    backgroundColor: '#4CAF50',
  },
  ownerBadge: {
    backgroundColor: '#2196F3',
  },
  verifiedBadge: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#FF5722',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  pickerOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666',
  },
  pickerOptionTextSelected: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  subscriptionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subscriptionTier: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  subscriptionExpiry: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF5722',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  signOutText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '600',
  },
})
