import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SavedPostsModal } from './SavedPostsModal';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isOwner: boolean;
  postType: string;
  postTitle?: string;
  postId: string;
}

export function PostOptionsModal({
  visible,
  onClose,
  onEdit,
  onDelete,
  isOwner,
  postType,
  postTitle,
  postId,
}: PostOptionsModalProps) {
  const [showSavedModal, setShowSavedModal] = useState(false);
  const handleSave = () => {
    onClose();
    setShowSavedModal(true);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      `Are you sure you want to delete this ${postType}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onClose,
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDelete();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    onClose();
    onEdit();
  };

  const handleReport = () => {
    onClose();
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => reportPost('inappropriate') },
        { text: 'Spam', onPress: () => reportPost('spam') },
        { text: 'Harassment', onPress: () => reportPost('harassment') },
        { text: 'Other', onPress: () => reportPost('other') },
      ]
    );
  };

  const reportPost = (reason: string) => {
    // TODO: Implement report functionality
    Alert.alert('Thank you', 'Your report has been submitted and will be reviewed.');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <BlurView intensity={95} style={styles.modalContainer}>
              <View style={styles.handle} />
              
              <View style={styles.header}>
                <Text style={styles.title}>
                  {postTitle ? `"${postTitle.substring(0, 30)}${postTitle.length > 30 ? '...' : ''}"` : 'Post Options'}
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                {isOwner ? (
                  <>
                    {/* Owner Options */}
                    <TouchableOpacity style={styles.option} onPress={handleEdit}>
                      <View style={[styles.optionIcon, { backgroundColor: '#007AFF' }]}>
                        <Ionicons name="create-outline" size={20} color="white" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Edit Post</Text>
                        <Text style={styles.optionSubtitle}>Make changes to your post</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={handleDelete}>
                      <View style={[styles.optionIcon, { backgroundColor: '#FF3B30' }]}>
                        <Ionicons name="trash-outline" size={20} color="white" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={[styles.optionTitle, { color: '#FF3B30' }]}>Delete Post</Text>
                        <Text style={styles.optionSubtitle}>Remove this post permanently</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Non-owner Options */}
                    <TouchableOpacity style={styles.option} onPress={handleReport}>
                      <View style={[styles.optionIcon, { backgroundColor: '#FF9500' }]}>
                        <Ionicons name="flag-outline" size={20} color="white" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Report Post</Text>
                        <Text style={styles.optionSubtitle}>Report inappropriate content</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option} onPress={handleSave}>
                      <View style={[styles.optionIcon, { backgroundColor: '#34C759' }]}>
                        <Ionicons name="bookmark-outline" size={20} color="white" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Save Post</Text>
                        <Text style={styles.optionSubtitle}>Save to your bookmarks</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.option}>
                      <View style={[styles.optionIcon, { backgroundColor: '#666' }]}>
                        <Ionicons name="person-remove-outline" size={20} color="white" />
                      </View>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Hide Posts from User</Text>
                        <Text style={styles.optionSubtitle}>Stop seeing posts from this user</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </BlurView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      <SavedPostsModal
        visible={showSavedModal}
        postId={postId}
        onClose={() => setShowSavedModal(false)}
        onSave={(saved) => {
          console.log(`Post ${saved ? 'saved' : 'unsaved'}`);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    minHeight: 300,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#C6C6C8',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
