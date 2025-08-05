import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommunityFilters } from '../../components/CommunityFilters';
import { CommunityPost } from '../../components/CommunityPost';
import { CreatePostModal } from '../../components/CreatePostModal';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_display_name: string | null;
  author_avatar: string | null;
  dog_id: string | null;
  dog_name: string | null;
  dog_breed: string | null;
  dog_image: string | null;
  walk_id: string | null;
  post_type: 'photo' | 'video' | 'story' | 'help_request' | 'walk_update';
  title: string | null;
  content: string;
  images: string[] | null;
  video_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_description: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  hashtags: string[];
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  is_shared?: boolean;
}

interface User {
  id: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
}

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const pageSize = 10;

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Fetch user profile from public.users table
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!error && profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            phone: profile.phone,
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchPosts = useCallback(async (pageNum: number = 1, filter: string = 'all', isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      let query = supabase
        .from('community_feed_view')
        .select('*')
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * pageSize, pageNum * pageSize - 1);

      // Apply filters
      if (filter !== 'all') {
        switch (filter) {
          case 'photos':
            query = query.in('post_type', ['photo', 'walk_update']);
            break;
          case 'stories':
            query = query.eq('post_type', 'story');
            break;
          case 'help':
            query = query.eq('post_type', 'help_request');
            break;
          case 'nearby':
            // This would require location-based filtering
            // For now, we'll just use the regular query
            break;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        Alert.alert('Error', 'Failed to load community posts');
        return;
      }

      if (data) {
        // Check if user has liked/shared posts
        const postsWithUserActions = await Promise.all(
          data.map(async (post) => {
            const [likesResult, sharesResult] = await Promise.all([
              supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user?.id)
                .single(),
              supabase
                .from('post_shares')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user?.id)
                .single(),
            ]);

            return {
              ...post,
              is_liked: !!likesResult.data,
              is_shared: !!sharesResult.data,
            };
          })
        );

        if (pageNum === 1 || isRefresh) {
          setPosts(postsWithUserActions);
        } else {
          setPosts((prev) => [...prev, ...postsWithUserActions]);
        }

        setHasMore(data.length === pageSize);
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      Alert.alert('Error', 'Something went wrong while loading posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchPosts(1, activeFilter);
    }
  }, [user, activeFilter, fetchPosts]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    fetchPosts(1, activeFilter, true);
  }, [activeFilter, fetchPosts]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, activeFilter);
    }
  }, [loading, hasMore, page, activeFilter, fetchPosts]);

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like the post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: !isLiked,
                likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const handleSharePost = async (postId: string, shareCaption?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          user_id: user.id,
          share_type: 'repost',
          share_caption: shareCaption || null,
        });

      if (error) throw error;

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_shared: true,
                shares_count: post.shares_count + 1,
              }
            : post
        )
      );

      Alert.alert('Success', 'Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    handleRefresh();
  };

  const renderPost = ({ item }: { item: Post }) => (
    <CommunityPost
      post={item}
      onLike={handleLikePost}
      onShare={handleSharePost}
      currentUserId={user?.id}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Community</Text>
      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="pets" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No posts yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Be the first to share a moment with your furry friend!
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Please log in to view the community</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <CommunityFilters
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
        style={styles.list}
      />

      <FloatingActionButton
        onPress={() => setShowCreateModal(true)}
        icon="add"
        color="#FF6B6B"
      />

      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
        userId={user?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    padding: 8,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
