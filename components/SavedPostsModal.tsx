import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  post_count?: number;
}

interface SavedPostsModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
  onSave: (saved: boolean) => void;
}

export function SavedPostsModal({ visible, postId, onClose, onSave }: SavedPostsModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedCollections, setSavedCollections] = useState<string[]>([]);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCollections();
      checkIfSaved();
    }
  }, [visible, postId]);

  const loadCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's collections with post count
      const { data: collectionsData, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_posts(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const collectionsWithCount = collectionsData?.map(collection => ({
        ...collection,
        post_count: collection.collection_posts?.[0]?.count || 0
      })) || [];

      setCollections(collectionsWithCount);

      // Check which collections contain this post
      const { data: collectionPosts, error: collectionError } = await supabase
        .from('collection_posts')
        .select('collection_id')
        .eq('post_id', postId);

      if (collectionError) throw collectionError;

      setSavedCollections(collectionPosts?.map(cp => cp.collection_id) || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Failed to load collections');
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const toggleSavePost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isSaved) {
        // Remove from saved posts
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;
        setIsSaved(false);
        onSave(false);
      } else {
        // Add to saved posts
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: postId
          });

        if (error) throw error;
        setIsSaved(true);
        onSave(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      Alert.alert('Error', 'Failed to save post');
    }
  };

  const toggleCollectionPost = async (collectionId: string) => {
    try {
      const isInCollection = savedCollections.includes(collectionId);

      if (isInCollection) {
        // Remove from collection
        const { error } = await supabase
          .from('collection_posts')
          .delete()
          .eq('collection_id', collectionId)
          .eq('post_id', postId);

        if (error) throw error;
        setSavedCollections(prev => prev.filter(id => id !== collectionId));
      } else {
        // Add to collection
        const { error } = await supabase
          .from('collection_posts')
          .insert({
            collection_id: collectionId,
            post_id: postId
          });

        if (error) throw error;
        setSavedCollections(prev => [...prev, collectionId]);

        // Also save the post if not already saved
        if (!isSaved) {
          await toggleSavePost();
        }
      }
    } catch (error) {
      console.error('Error toggling collection post:', error);
      Alert.alert('Error', 'Failed to update collection');
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          is_private: isPrivate
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new collection to the list
      setCollections(prev => [{ ...data, post_count: 0 }, ...prev]);
      
      // Reset form
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsPrivate(false);
      setShowCreateCollection(false);

      Alert.alert('Success', 'Collection created successfully');
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const renderCollection = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={[
        styles.collectionItem,
        savedCollections.includes(item.id) && styles.collectionItemSelected
      ]}
      onPress={() => toggleCollectionPost(item.id)}
    >
      <View style={styles.collectionInfo}>
        <Text style={styles.collectionName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.collectionDescription}>{item.description}</Text>
        )}
        <Text style={styles.collectionMeta}>
          {item.post_count} posts • {item.is_private ? 'Private' : 'Public'}
        </Text>
      </View>
      <View style={[
        styles.checkbox,
        savedCollections.includes(item.id) && styles.checkboxSelected
      ]}>
        {savedCollections.includes(item.id) && (
          <Ionicons name="checkmark" size={16} color="white" />
        )}
      </View>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Save Post</Text>
            <TouchableOpacity onPress={() => setShowCreateCollection(true)}>
              <Ionicons name="add" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {/* Save to General */}
          <TouchableOpacity
            style={[styles.saveOption, isSaved && styles.saveOptionSelected]}
            onPress={toggleSavePost}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isSaved ? "#FF6B6B" : "#666"} 
            />
            <Text style={[styles.saveText, isSaved && styles.saveTextSelected]}>
              {isSaved ? 'Saved' : 'Save Post'}
            </Text>
          </TouchableOpacity>

          {/* Collections */}
          <Text style={styles.sectionTitle}>Add to Collection</Text>
          <FlatList
            data={collections}
            renderItem={renderCollection}
            keyExtractor={(item) => item.id}
            style={styles.collectionsList}
            showsVerticalScrollIndicator={false}
          />

          {/* Create Collection Form */}
          {showCreateCollection && (
            <View style={styles.createForm}>
              <Text style={styles.formTitle}>Create New Collection</Text>
              <TextInput
                style={styles.input}
                placeholder="Collection name"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                maxLength={100}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={newCollectionDescription}
                onChangeText={setNewCollectionDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.privacyToggle}
                onPress={() => setIsPrivate(!isPrivate)}
              >
                <Ionicons 
                  name={isPrivate ? "lock-closed" : "lock-open"} 
                  size={20} 
                  color={isPrivate ? "#FF6B6B" : "#666"} 
                />
                <Text style={styles.privacyText}>
                  {isPrivate ? 'Private' : 'Public'} Collection
                </Text>
              </TouchableOpacity>
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateCollection(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createButton, loading && styles.buttonDisabled]}
                  onPress={createCollection}
                  disabled={loading}
                >
                  <Text style={styles.createButtonText}>
                    {loading ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  saveOptionSelected: {
    backgroundColor: '#fff5f5',
  },
  saveText: {
    fontSize: 16,
    color: '#666',
  },
  saveTextSelected: {
    color: '#FF6B6B',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  collectionsList: {
    maxHeight: 200,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  collectionItemSelected: {
    backgroundColor: '#fff5f5',
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  collectionMeta: {
    fontSize: 12,
    color: '#999',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  createForm: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  privacyText: {
    fontSize: 16,
    color: '#333',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
