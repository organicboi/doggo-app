import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Dog {
  id: string;
  name: string;
  breed?: string;
  profile_image_url?: string;
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  userId?: string;
}

export function CreatePostModal({ visible, onClose, onPostCreated, userId }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [postType, setPostType] = useState<'photo' | 'video' | 'story' | 'help_request'>('photo');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [userDogs, setUserDogs] = useState<Dog[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationDescription, setLocationDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);

  useEffect(() => {
    if (visible && userId) {
      fetchUserDogs();
      getCurrentLocation();
    }
  }, [visible, userId]);

  const fetchUserDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, profile_image_url')
        .eq('owner_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      setUserDogs(data || []);
    } catch (error) {
      console.error('Error fetching user dogs:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Get address from coordinates
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const { city, region } = address[0];
        setLocationDescription(`${city}, ${region}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUris = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...imageUris].slice(0, 5));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (imageUris: string[]) => {
    const uploadedUrls: string[] = [];

    for (const uri of imageUris) {
      try {
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        const formData = new FormData();
        
        formData.append('file', {
          uri,
          name: fileName,
          type: 'image/jpeg',
        } as any);

        const { data, error } = await supabase.storage
          .from('dogs')
          .upload(`community/${fileName}`, formData, {
            contentType: 'image/jpeg',
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('dogs')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    return uploadedUrls;
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  };

  const createHashtags = async (tags: string[]) => {
    for (const tag of tags) {
      try {
        // Try to insert or update hashtag
        await supabase
          .from('hashtags')
          .upsert({ name: tag }, { onConflict: 'name' });
      } catch (error) {
        console.error('Error creating hashtag:', error);
      }
    }
  };

  const linkHashtagsToPost = async (postId: string, tags: string[]) => {
    for (const tag of tags) {
      try {
        // Get hashtag ID
        const { data: hashtagData } = await supabase
          .from('hashtags')
          .select('id')
          .eq('name', tag)
          .single();

        if (hashtagData) {
          await supabase
            .from('post_hashtags')
            .insert({
              post_id: postId,
              hashtag_id: hashtagData.id,
            });
        }
      } catch (error) {
        console.error('Error linking hashtag to post:', error);
      }
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() || !userId) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    setLoading(true);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages(selectedImages);
      }

      // Extract hashtags from content
      const extractedHashtags = extractHashtags(content);
      
      // Create hashtags in database
      if (extractedHashtags.length > 0) {
        await createHashtags(extractedHashtags);
      }

      // Create post
      const postData = {
        author_id: userId,
        dog_id: selectedDog?.id || null,
        post_type: postType,
        title: title.trim() || null,
        content: content.trim(),
        images: imageUrls.length > 0 ? imageUrls : null,
        latitude: location?.coords.latitude || null,
        longitude: location?.coords.longitude || null,
        location_description: locationDescription.trim() || null,
      };

      const { data: postResult, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      // Link hashtags to post
      if (extractedHashtags.length > 0 && postResult) {
        await linkHashtagsToPost(postResult.id, extractedHashtags);
      }

      // Reset form
      setContent('');
      setTitle('');
      setSelectedImages([]);
      setSelectedDog(null);
      setLocationDescription('');
      setHashtags([]);
      
      onPostCreated();
      Alert.alert('Success', 'Your post has been created!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const postTypes = [
    { id: 'photo', label: 'Photo', icon: 'camera-outline' },
    { id: 'story', label: 'Story', icon: 'library-outline' },
    { id: 'help_request', label: 'Help', icon: 'help-circle-outline' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postButton, loading && styles.postButtonDisabled]}
            onPress={handleCreatePost}
            disabled={loading || !content.trim()}
          >
            <Text style={[styles.postButtonText, loading && styles.postButtonTextDisabled]}>
              {loading ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Post Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postTypes}>
              {postTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.postTypeButton,
                    postType === type.id && styles.postTypeButtonActive,
                  ]}
                  onPress={() => setPostType(type.id as any)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={postType === type.id ? '#FF6B6B' : '#666'}
                  />
                  <Text
                    style={[
                      styles.postTypeText,
                      postType === type.id && styles.postTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder="Add a title (optional)"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Content Input */}
          <View style={styles.section}>
            <TextInput
              style={styles.contentInput}
              placeholder="What's happening with your furry friend?"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
            />
            <Text style={styles.characterCount}>{content.length}/500</Text>
          </View>

          {/* Dog Selection */}
          {userDogs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tag a Dog</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dogsList}>
                <TouchableOpacity
                  style={[
                    styles.dogOption,
                    !selectedDog && styles.dogOptionActive,
                  ]}
                  onPress={() => setSelectedDog(null)}
                >
                  <Text style={styles.dogOptionText}>None</Text>
                </TouchableOpacity>
                {userDogs.map((dog) => (
                  <TouchableOpacity
                    key={dog.id}
                    style={[
                      styles.dogOption,
                      selectedDog?.id === dog.id && styles.dogOptionActive,
                    ]}
                    onPress={() => setSelectedDog(dog)}
                  >
                    {dog.profile_image_url ? (
                      <Image source={{ uri: dog.profile_image_url }} style={styles.dogAvatar} />
                    ) : (
                      <View style={[styles.dogAvatar, styles.defaultDogAvatar]}>
                        <Ionicons name="paw" size={16} color="#666" />
                      </View>
                    )}
                    <Text style={styles.dogName}>{dog.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Images */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <TouchableOpacity style={styles.addImagesButton} onPress={pickImages}>
                <Ionicons name="camera-outline" size={20} color="#FF6B6B" />
                <Text style={styles.addImagesText}>Add Photos</Text>
              </TouchableOpacity>
            </View>
            {selectedImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                <Ionicons name="location-outline" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.locationInput}
              placeholder="Add location"
              value={locationDescription}
              onChangeText={setLocationDescription}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    paddingTop: 60, // Account for status bar
  },
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  postButtonTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postTypes: {
    marginTop: 8,
  },
  postTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
    gap: 6,
  },
  postTypeButtonActive: {
    backgroundColor: '#FFE8E8',
  },
  postTypeText: {
    fontSize: 14,
    color: '#666',
  },
  postTypeTextActive: {
    color: '#FF6B6B',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    paddingVertical: 12,
  },
  contentInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  dogsList: {
    marginTop: 8,
  },
  dogOption: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
    minWidth: 60,
  },
  dogOptionActive: {
    backgroundColor: '#FFE8E8',
  },
  dogAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  defaultDogAvatar: {
    backgroundColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  dogOptionText: {
    fontSize: 14,
    color: '#666',
  },
  addImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addImagesText: {
    fontSize: 14,
    color: '#FF6B6B',
  },
  imagesContainer: {
    marginTop: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    padding: 4,
  },
  locationInput: {
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
