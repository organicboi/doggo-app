import { Ionicons } from '@expo/vector-icons'
import { Session } from '@supabase/supabase-js'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import Avatar from './Avatar'

interface Props {
  session: Session
}

export default function Account({ session }: Props) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (session) getProfile()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single()
      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string
    website: string
    avatar_url: string
  }) {
    try {
      setLoading(true)
      if (!session?.user) throw new Error('No user on the session!')

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) {
        throw error
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            { 
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 100) // Account for tab bar
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={() => supabase.auth.signOut()}
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileContainer}>
            <View style={styles.avatarSection}>
              <Avatar
                size={120}
                url={avatarUrl}
                onUpload={(url: string) => {
                  setAvatarUrl(url)
                  updateProfile({ username, website, avatar_url: url })
                }}
              />
              <Text style={styles.emailText}>{session?.user?.email}</Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your username"
                    placeholderTextColor="#999"
                    value={username || ''}
                    onChangeText={(text) => setUsername(text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Website</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="globe-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://example.com"
                    placeholderTextColor="#999"
                    value={website || ''}
                    onChangeText={(text) => setWebsite(text)}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.updateButton, loading && styles.updateButtonDisabled]}
                onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
                disabled={loading}
              >
                <Text style={styles.updateButtonText}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  signOutButton: {
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
  profileContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    backdropFilter: 'blur(10px)',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  formSection: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 18,
    color: '#333',
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
}) 