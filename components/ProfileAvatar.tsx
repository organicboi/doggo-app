import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ImageService } from '../lib/imageService'

interface Props {
  size: number
  url: string | null
  onUpload?: (url: string) => void
  userId?: string
  editable?: boolean
  showUploadText?: boolean
}

export default function ProfileAvatar({ 
  url, 
  size = 150, 
  onUpload, 
  userId,
  editable = true,
  showUploadText = true 
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarSize = { height: size, width: size }

  useEffect(() => {
    // If we have a URL, use it directly (it should be a public URL from Supabase storage)
    if (url) {
      setAvatarUrl(url)
    } else {
      setAvatarUrl(null)
    }
  }, [url])

  async function uploadAvatar() {
    if (!userId || !onUpload) {
      Alert.alert('Error', 'Cannot upload image: missing user ID or upload handler')
      return
    }

    try {
      setUploading(true)

      const hasPermissions = await ImageService.requestPermissions()
      if (!hasPermissions) {
        Alert.alert('Permission Required', 'Please allow access to photos to upload images.')
        return
      }

      const result = await ImageService.pickImageFromGallery({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        
        const uploadResult = await ImageService.uploadAndUpdateProfileImage(
          userId,
          imageUri,
          'profile'
        )

        if (uploadResult.success && uploadResult.url) {
          setAvatarUrl(uploadResult.url)
          onUpload(uploadResult.url)
          Alert.alert('Success', 'Profile picture updated successfully!')
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to upload image')
        }
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      Alert.alert('Error', 'Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, avatarSize]}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            accessibilityLabel="Profile Avatar"
            style={[avatarSize, styles.avatar]}
            onError={(error) => {
              console.error('Avatar image load error:', error)
              setAvatarUrl(null)
            }}
          />
        ) : (
          <View style={[avatarSize, styles.noImage]}>
            <Ionicons name="person" size={size * 0.5} color="#ccc" />
          </View>
        )}
        
        {editable && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={uploadAvatar}
            disabled={uploading}
          >
            <Ionicons 
              name={uploading ? "hourglass-outline" : "camera"} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {showUploadText && editable && (
        <Text style={styles.uploadText}>
          {uploading ? 'Uploading...' : 'Tap to change photo'}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 999,
    overflow: 'hidden',
  },
  avatar: {
    borderRadius: 999,
    resizeMode: 'cover',
  },
  noImage: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#667eea',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})
