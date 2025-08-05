import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
  is_liked?: boolean;
  replies?: Comment[];
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  currentUserId?: string;
}

export function CommentsModal({ visible, onClose, postId, currentUserId }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
    }
  }, [visible, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // Fetch comments with user info
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          users:author_id (
            full_name,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData) {
        // Check which comments the current user has liked
        const commentsWithLikes = await Promise.all(
          commentsData.map(async (comment) => {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', currentUserId)
              .single();

            return {
              ...comment,
              author_name: comment.users?.display_name || comment.users?.full_name,
              author_avatar: comment.users?.avatar_url,
              is_liked: !!likeData,
            };
          })
        );

        // Organize comments into threads
        const parentComments = commentsWithLikes.filter(c => !c.parent_comment_id);
        const replies = commentsWithLikes.filter(c => c.parent_comment_id);

        const threaded = parentComments.map(parent => ({
          ...parent,
          replies: replies.filter(reply => reply.parent_comment_id === parent.id),
        }));

        setComments(threaded);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: currentUserId,
          parent_comment_id: replyingTo,
          content: newComment.trim(),
        })
        .select(`
          *,
          users:author_id (
            full_name,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        const newCommentWithUser = {
          ...data,
          author_name: data.users?.display_name || data.users?.full_name,
          author_avatar: data.users?.avatar_url,
          is_liked: false,
          replies: [],
        };

        if (replyingTo) {
          // Add reply to existing comment
          setComments(prev => 
            prev.map(comment => 
              comment.id === replyingTo
                ? { ...comment, replies: [...(comment.replies || []), newCommentWithUser] }
                : comment
            )
          );
        } else {
          // Add new parent comment
          setComments(prev => [...prev, newCommentWithUser]);
        }

        setNewComment('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!currentUserId) return;

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUserId);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: currentUserId,
          });
      }

      // Update local state
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: !isLiked,
              likes_count: isLiked ? comment.likes_count - 1 : comment.likes_count + 1,
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? {
                      ...reply,
                      is_liked: !isLiked,
                      likes_count: isLiked ? reply.likes_count - 1 : reply.likes_count + 1,
                    }
                  : reply
              ),
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error('Error toggling comment like:', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <View key={comment.id} style={[styles.commentContainer, isReply && styles.replyContainer]}>
      <View style={styles.commentHeader}>
        {comment.author_avatar ? (
          <Image source={{ uri: comment.author_avatar }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatar, styles.defaultAvatar]}>
            <Ionicons name="person" size={16} color="#666" />
          </View>
        )}
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentAuthor}>{comment.author_name}</Text>
            <Text style={styles.commentText}>{comment.content}</Text>
          </View>
          <View style={styles.commentActions}>
            <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
            <TouchableOpacity
              style={styles.commentAction}
              onPress={() => handleLikeComment(comment.id, comment.is_liked || false)}
            >
              <Ionicons
                name={comment.is_liked ? "heart" : "heart-outline"}
                size={14}
                color={comment.is_liked ? "#ff4757" : "#666"}
              />
              {comment.likes_count > 0 && (
                <Text style={[styles.commentActionText, comment.is_liked && styles.likedText]}>
                  {comment.likes_count}
                </Text>
              )}
            </TouchableOpacity>
            {!isReply && (
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => setReplyingTo(comment.id)}
              >
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={comments}
          renderItem={({ item }) => renderComment(item)}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>Replying to comment</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, newComment.trim() && styles.sendButtonActive]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={newComment.trim() ? "#007AFF" : "#ccc"}
              />
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    flex: 1,
    padding: 16,
  },
  commentContainer: {
    marginBottom: 16,
  },
  replyContainer: {
    marginLeft: 40,
    marginTop: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  defaultAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 12,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  likedText: {
    color: '#ff4757',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    backgroundColor: 'white',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonActive: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
  },
});
