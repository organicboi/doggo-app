import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Share as RNShare,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Post } from '../app/(tabs)/community';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (caption: string) => void;
  post: Post;
}

export function ShareModal({ visible, onClose, onShare, post }: ShareModalProps) {
  const [shareCaption, setShareCaption] = useState('');
  const [shareType, setShareType] = useState<'repost' | 'external'>('repost');

  const handleRepost = () => {
    onShare(shareCaption);
    setShareCaption('');
    onClose();
  };

  const handleExternalShare = async () => {
    try {
      const shareContent = {
        message: `Check out this post from ${post.author_display_name || post.author_name}: ${post.content}`,
        url: `https://yourapp.com/post/${post.id}`, // Replace with your app's deep link
      };
      
      await RNShare.share(shareContent);
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  const renderPostPreview = () => (
    <View style={styles.postPreview}>
      <View style={styles.previewHeader}>
        {post.author_avatar ? (
          <Image source={{ uri: post.author_avatar }} style={styles.previewAvatar} />
        ) : (
          <View style={[styles.previewAvatar, styles.defaultAvatar]}>
            <Ionicons name="person" size={16} color="#666" />
          </View>
        )}
        <Text style={styles.previewAuthor}>
          {post.author_display_name || post.author_name}
        </Text>
      </View>
      <Text style={styles.previewContent} numberOfLines={3}>
        {post.content}
      </Text>
      {post.images && post.images.length > 0 && (
        <Image source={{ uri: post.images[0] }} style={styles.previewImage} />
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Post</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.shareOptions}>
            <TouchableOpacity
              style={[
                styles.shareOption,
                shareType === 'repost' && styles.shareOptionActive,
              ]}
              onPress={() => setShareType('repost')}
            >
              <Ionicons name="repeat" size={24} color={shareType === 'repost' ? '#007AFF' : '#666'} />
              <Text style={[
                styles.shareOptionText,
                shareType === 'repost' && styles.shareOptionTextActive,
              ]}>
                Repost
              </Text>
              <Text style={styles.shareOptionDescription}>
                Share to your timeline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.shareOption,
                shareType === 'external' && styles.shareOptionActive,
              ]}
              onPress={() => setShareType('external')}
            >
              <Ionicons name="share-outline" size={24} color={shareType === 'external' ? '#007AFF' : '#666'} />
              <Text style={[
                styles.shareOptionText,
                shareType === 'external' && styles.shareOptionTextActive,
              ]}>
                Share External
              </Text>
              <Text style={styles.shareOptionDescription}>
                Share via other apps
              </Text>
            </TouchableOpacity>
          </View>

          {shareType === 'repost' && (
            <>
              <View style={styles.captionContainer}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add a comment (optional)..."
                  value={shareCaption}
                  onChangeText={setShareCaption}
                  multiline
                  maxLength={280}
                />
                <Text style={styles.characterCount}>
                  {shareCaption.length}/280
                </Text>
              </View>

              {renderPostPreview()}

              <TouchableOpacity style={styles.shareButton} onPress={handleRepost}>
                <Text style={styles.shareButtonText}>Repost</Text>
              </TouchableOpacity>
            </>
          )}

          {shareType === 'external' && (
            <View style={styles.externalShareContainer}>
              {renderPostPreview()}
              
              <TouchableOpacity style={styles.shareButton} onPress={handleExternalShare}>
                <Ionicons name="share-outline" size={20} color="white" />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
  shareOptions: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  shareOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  shareOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  shareOptionTextActive: {
    color: '#007AFF',
  },
  shareOptionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  captionContainer: {
    margin: 20,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  postPreview: {
    margin: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  defaultAvatar: {
    backgroundColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  previewContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  externalShareContainer: {
    padding: 20,
  },
  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
