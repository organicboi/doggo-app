import { Ionicons } from '@expo/vector-icons';
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
import { Post } from '../app/(tabs)/community';
import { supabase } from '../lib/supabase';

interface EditPostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
  post: Post;
}

export function EditPostModal({ visible, onClose, onPostUpdated, post }: EditPostModalProps) {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [locationDescription, setLocationDescription] = useState(post.location_description || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setLocationDescription(post.location_description || '');
    }
  }, [visible, post]);

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  };

  const createHashtags = async (tags: string[]) => {
    for (const tag of tags) {
      try {
        await supabase
          .from('hashtags')
          .upsert({ name: tag }, { onConflict: 'name' });
      } catch (error) {
        console.error('Error creating hashtag:', error);
      }
    }
  };

  const linkHashtagsToPost = async (postId: string, tags: string[]) => {
    // First, remove existing hashtag links
    await supabase
      .from('post_hashtags')
      .delete()
      .eq('post_id', postId);

    // Then add new ones
    for (const tag of tags) {
      try {
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

  const handleUpdatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    setLoading(true);

    try {
      // Extract hashtags from content
      const extractedHashtags = extractHashtags(content);
      
      // Create hashtags in database
      if (extractedHashtags.length > 0) {
        await createHashtags(extractedHashtags);
      }

      // Update post
      const { error } = await supabase
        .from('posts')
        .update({
          title: title.trim() || null,
          content: content.trim(),
          location_description: locationDescription.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (error) throw error;

      // Update hashtag links
      if (extractedHashtags.length >= 0) {
        await linkHashtagsToPost(post.id, extractedHashtags);
      }

      onPostUpdated();
      onClose();
      Alert.alert('Success', 'Your post has been updated!');
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const postTypes = {
    photo: { label: 'Photo', icon: 'camera-outline', color: '#007AFF' },
    video: { label: 'Video', icon: 'videocam-outline', color: '#FF3B30' },
    story: { label: 'Story', icon: 'library-outline', color: '#34C759' },
    help_request: { label: 'Help Request', icon: 'help-circle-outline', color: '#FF9500' },
    walk_update: { label: 'Walk Update', icon: 'walk-outline', color: '#5856D6' },
  };

  const currentPostType = postTypes[post.post_type as keyof typeof postTypes] || postTypes.photo;

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
          <Text style={styles.headerTitle}>Edit Post</Text>
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
            onPress={handleUpdatePost}
            disabled={loading || !content.trim()}
          >
            <Text style={[styles.updateButtonText, loading && styles.updateButtonTextDisabled]}>
              {loading ? 'Updating...' : 'Update'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Post Type Display */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Type</Text>
            <View style={styles.postTypeDisplay}>
              <Ionicons
                name={currentPostType.icon as any}
                size={20}
                color={currentPostType.color}
              />
              <Text style={[styles.postTypeText, { color: currentPostType.color }]}>
                {currentPostType.label}
              </Text>
            </View>
            <Text style={styles.postTypeNote}>Post type cannot be changed when editing</Text>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Add a title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Content Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content</Text>
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

          {/* Images Display (Read-only) */}
          {post.images && post.images.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                {post.images.map((imageUrl, index) => (
                  <Image key={index} source={{ uri: imageUrl }} style={styles.imagePreview} />
                ))}
              </ScrollView>
              <Text style={styles.imageNote}>Images cannot be changed when editing</Text>
            </View>
          )}

          {/* Video Display (Read-only) */}
          {post.video_url && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Video</Text>
              <View style={styles.videoPreview}>
                <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.8)" />
                <Text style={styles.videoLabel}>Video Attached</Text>
              </View>
              <Text style={styles.imageNote}>Video cannot be changed when editing</Text>
            </View>
          )}

          {/* Dog Info Display (Read-only) */}
          {post.dog_name && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tagged Dog</Text>
              <View style={styles.dogDisplay}>
                {post.dog_image && (
                  <Image source={{ uri: post.dog_image }} style={styles.dogAvatar} />
                )}
                <View>
                  <Text style={styles.dogName}>{post.dog_name}</Text>
                  {post.dog_breed && <Text style={styles.dogBreed}>{post.dog_breed}</Text>}
                </View>
              </View>
              <Text style={styles.imageNote}>Tagged dog cannot be changed when editing</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location (Optional)</Text>
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
    paddingTop: 60,
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
  updateButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButtonTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  postTypeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    gap: 8,
  },
  postTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  postTypeNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
  imagesContainer: {
    marginTop: 8,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  videoPreview: {
    width: 80,
    height: 80,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  videoLabel: {
    fontSize: 10,
    color: 'white',
    marginTop: 4,
    textAlign: 'center',
  },
  imageNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dogDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    gap: 12,
  },
  dogAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dogName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dogBreed: {
    fontSize: 12,
    color: '#666',
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
