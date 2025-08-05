import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
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
  post_count: number;
}

export function SavedPostsScreen() {
  const [activeTab, setActiveTab] = useState<'posts' | 'collections'>('posts');
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'posts') {
        await loadSavedPosts();
      } else {
        await loadCollections();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          created_at,
          posts (
            id,
            title,
            content,
            images,
            video_url,
            post_type,
            created_at,
            author_id,
            likes_count,
            comments_count,
            users (
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const posts = data?.map(item => item.posts).filter(Boolean) || [];
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error loading saved posts:', error);
      throw error;
    }
  };

  const loadCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_posts (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const collectionsWithCount = data?.map(collection => ({
        ...collection,
        post_count: collection.collection_posts?.[0]?.count || 0
      })) || [];

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error('Error loading collections:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteCollection = async (collectionId: string) => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', collectionId);

              if (error) throw error;

              setCollections(prev => prev.filter(c => c.id !== collectionId));
              Alert.alert('Success', 'Collection deleted successfully');
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert('Error', 'Failed to delete collection');
            }
          }
        }
      ]
    );
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
          <View>
            <Text style={styles.authorName}>
              {item.users?.full_name || item.users?.username || 'Anonymous'}
            </Text>
            <Text style={styles.postDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      
      {item.title && (
        <Text style={styles.postTitle}>{item.title}</Text>
      )}
      
      <Text style={styles.postContent} numberOfLines={3}>
        {item.content}
      </Text>
      
      {item.images && item.images.length > 0 && (
        <View style={styles.imageContainer}>
          <Ionicons name="image" size={20} color="#666" />
          <Text style={styles.imageCount}>
            {item.images.length} image{item.images.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}
      
      <View style={styles.postStats}>
        <View style={styles.stat}>
          <Ionicons name="heart" size={16} color="#FF6B6B" />
          <Text style={styles.statText}>{item.likes_count || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble" size={16} color="#666" />
          <Text style={styles.statText}>{item.comments_count || 0}</Text>
        </View>
      </View>
    </View>
  );

  const renderCollection = ({ item }: { item: Collection }) => (
    <View style={styles.collectionCard}>
      <View style={styles.collectionHeader}>
        <View style={styles.collectionIcon}>
          <Ionicons name="folder" size={24} color="#FF6B6B" />
        </View>
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.collectionDescription}>{item.description}</Text>
          )}
          <Text style={styles.collectionMeta}>
            {item.post_count} posts • {item.is_private ? 'Private' : 'Public'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.collectionOptions}
          onPress={() => handleDeleteCollection(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeTab === 'posts' ? 'bookmark-outline' : 'folder-outline'} 
        size={64} 
        color="#ccc" 
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'posts' ? 'No Saved Posts' : 'No Collections'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'posts' 
          ? 'Posts you save will appear here'
          : 'Create collections to organize your saved posts'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons 
            name="bookmark" 
            size={20} 
            color={activeTab === 'posts' ? '#FF6B6B' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'collections' && styles.activeTab]}
          onPress={() => setActiveTab('collections')}
        >
          <Ionicons 
            name="folder" 
            size={20} 
            color={activeTab === 'collections' ? '#FF6B6B' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'collections' && styles.activeTabText]}>
            Collections
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'posts' ? savedPosts : collections}
        renderItem={activeTab === 'posts' ? renderPost : renderCollection}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          (activeTab === 'posts' ? savedPosts : collections).length === 0 && styles.emptyContent
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

  const loadCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_posts (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const collectionsWithCount = data?.map(collection => ({
        ...collection,
        post_count: collection.collection_posts?.[0]?.count || 0
      })) || [];

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error('Error loading collections:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePostLike = async (postId: string) => {
    // Update the post in the list optimistically
    setSavedPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.community_post_likes.some(like => like.user_id === post.user_id);
        return {
          ...post,
          likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
          community_post_likes: isLiked 
            ? post.community_post_likes.filter(like => like.user_id !== post.user_id)
            : [...post.community_post_likes, { user_id: post.user_id }]
        };
      }
      return post;
    }));
  };

  const handlePostShare = (postId: string, caption?: string) => {
    // Implement share functionality
    console.log('Sharing post:', postId, caption);
  };

  const handlePostComment = (postId: string) => {
    // Navigate to comments
    console.log('View comments for post:', postId);
  };

  const handleDeleteCollection = async (collectionId: string) => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', collectionId);

              if (error) throw error;

              setCollections(prev => prev.filter(c => c.id !== collectionId));
              Alert.alert('Success', 'Collection deleted successfully');
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert('Error', 'Failed to delete collection');
            }
          }
        }
      ]
    );
  };

  const renderPost = ({ item }: { item: Post }) => (
    <CommunityPost
      post={item}
      onLike={handlePostLike}
      onShare={handlePostShare}
      onComment={handlePostComment}
    />
  );

  const renderCollection = ({ item }: { item: Collection }) => (
    <View style={styles.collectionCard}>
      <View style={styles.collectionHeader}>
        <View style={styles.collectionIcon}>
          <Ionicons name="folder" size={24} color="#FF6B6B" />
        </View>
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.collectionDescription}>{item.description}</Text>
          )}
          <Text style={styles.collectionMeta}>
            {item.post_count} posts • {item.is_private ? 'Private' : 'Public'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.collectionOptions}
          onPress={() => handleDeleteCollection(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeTab === 'posts' ? 'bookmark-outline' : 'folder-outline'} 
        size={64} 
        color="#ccc" 
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'posts' ? 'No Saved Posts' : 'No Collections'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'posts' 
          ? 'Posts you save will appear here'
          : 'Create collections to organize your saved posts'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons 
            name="bookmark" 
            size={20} 
            color={activeTab === 'posts' ? '#FF6B6B' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'collections' && styles.activeTab]}
          onPress={() => setActiveTab('collections')}
        >
          <Ionicons 
            name="folder" 
            size={20} 
            color={activeTab === 'collections' ? '#FF6B6B' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'collections' && styles.activeTabText]}>
            Collections
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'posts' ? savedPosts : collections}
        renderItem={activeTab === 'posts' ? renderPost : renderCollection}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          (activeTab === 'posts' ? savedPosts : collections).length === 0 && styles.emptyContent
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  postCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  imageCount: {
    fontSize: 14,
    color: '#666',
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  collectionCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fff5f5',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
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
  collectionOptions: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
