import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Post } from '../app/(tabs)/community';
import { CommentsModal } from './CommentsModal';
import { ShareModal } from './ShareModal';

const { width } = Dimensions.get('window');

interface CommunityPostProps {
  post: Post;
  onLike: (postId: string, isLiked: boolean) => void;
  onShare: (postId: string, shareCaption?: string) => void;
  currentUserId?: string;
}

export function CommunityPost({ post, onLike, onShare, currentUserId }: CommunityPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const handleLike = () => {
    onLike(post.id, post.is_liked || false);
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleExternalShare = async () => {
    try {
      const shareContent = {
        message: `Check out this post from ${post.author_display_name || post.author_name}: ${post.content}`,
        url: `https://yourapp.com/post/${post.id}`, // Replace with your app's deep link
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return postTime.toLocaleDateString();
  };

  const getPostTypeIcon = () => {
    switch (post.post_type) {
      case 'help_request':
        return 'help-circle-outline';
      case 'walk_update':
        return 'walk-outline';
      case 'story':
        return 'library-outline';
      default:
        return 'camera-outline';
    }
  };

  const getPostTypeColor = () => {
    switch (post.post_type) {
      case 'help_request':
        return '#ff4757';
      case 'walk_update':
        return '#2ed573';
      case 'story':
        return '#ffa502';
      default:
        return '#5352ed';
    }
  };

  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    return (
      <View style={styles.imagesContainer}>
        {post.images.map((imageUrl, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setImageIndex(index)}
            style={[
              styles.imageWrapper,
              post.images!.length === 1 && styles.singleImage,
              post.images!.length === 2 && styles.doubleImage,
              post.images!.length > 2 && styles.multipleImage,
            ]}
          >
            <Image source={{ uri: imageUrl }} style={styles.postImage} />
            {post.images!.length > 3 && index === 2 && (
              <View style={styles.moreImagesOverlay}>
                <Text style={styles.moreImagesText}>+{post.images!.length - 3}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderHashtags = () => {
    if (!post.hashtags || post.hashtags.length === 0) return null;

    return (
      <View style={styles.hashtagsContainer}>
        {post.hashtags.map((hashtag, index) => (
          <TouchableOpacity key={index} style={styles.hashtag}>
            <Text style={styles.hashtagText}>#{hashtag}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDogInfo = () => {
    if (!post.dog_name) return null;

    return (
      <View style={styles.dogInfo}>
        {post.dog_image && (
          <Image source={{ uri: post.dog_image }} style={styles.dogAvatar} />
        )}
        <View>
          <Text style={styles.dogName}>{post.dog_name}</Text>
          {post.dog_breed && (
            <Text style={styles.dogBreed}>{post.dog_breed}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          {post.author_avatar ? (
            <Image source={{ uri: post.author_avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
          )}
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>
              {post.author_display_name || post.author_name}
            </Text>
            <View style={styles.postMeta}>
              <Ionicons
                name={getPostTypeIcon()}
                size={12}
                color={getPostTypeColor()}
              />
              <Text style={styles.timeAgo}>{formatTimeAgo(post.created_at)}</Text>
              {post.location_description && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Ionicons name="location-outline" size={12} color="#666" />
                  <Text style={styles.location}>{post.location_description}</Text>
                </>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Dog Info */}
      {renderDogInfo()}

      {/* Title */}
      {post.title && (
        <Text style={styles.title}>{post.title}</Text>
      )}

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Hashtags */}
      {renderHashtags()}

      {/* Images */}
      {renderImages()}

      {/* Video */}
      {post.video_url && (
        <View style={styles.videoContainer}>
          <TouchableOpacity style={styles.videoThumbnail}>
            <Ionicons name="play-circle" size={50} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={post.is_liked ? "heart" : "heart-outline"}
            size={20}
            color={post.is_liked ? "#ff4757" : "#666"}
          />
          <Text style={[styles.actionText, post.is_liked && styles.likedText]}>
            {post.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{post.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="repeat-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{post.shares_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleExternalShare}>
          <Ionicons name="share-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        currentUserId={currentUserId}
      />

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={(caption: string) => onShare(post.id, caption)}
        post={post}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  dot: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 6,
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  moreButton: {
    padding: 4,
  },
  dogInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  dogAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  dogName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dogBreed: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  hashtag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  hashtagText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    height: 200,
  },
  doubleImage: {
    width: '50%',
    height: 150,
  },
  multipleImage: {
    width: '33.33%',
    height: 120,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  videoContainer: {
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  likedText: {
    color: '#ff4757',
  },
});
