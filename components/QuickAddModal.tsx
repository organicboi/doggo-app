import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  selectedLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  onSuccess: () => void;
}

type AddType = 'dog' | 'emergency' | 'stray';
type DogSize = 'small' | 'medium' | 'large';
type EmergencySeverity = 'low' | 'medium' | 'high' | 'critical';

const QuickAddModal: React.FC<QuickAddModalProps> = ({
  visible,
  onClose,
  userLocation,
  selectedLocation,
  onSuccess,
}) => {
  const [activeType, setActiveType] = useState<AddType>('dog');
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Form states
  const [dogName, setDogName] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogSize, setDogSize] = useState<DogSize>('medium');
  const [dogAge, setDogAge] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [description, setDescription] = useState('');
  const [emergencyType, setEmergencyType] = useState('');
  const [emergencySeverity, setEmergencySeverity] = useState<EmergencySeverity>('medium');
  const [volunteersNeeded, setVolunteersNeeded] = useState('1');

  const resetForm = () => {
    setDogName('');
    setDogBreed('');
    setDogSize('medium');
    setDogAge('');
    setOwnerName('');
    setOwnerContact('');
    setDescription('');
    setEmergencyType('');
    setEmergencySeverity('medium');
    setVolunteersNeeded('1');
    setImageUri(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setImageUri(manipulatedImage.uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setImageUri(manipulatedImage.uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      // Create form data for upload
      const formData = new FormData();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;

      // For React Native, we need to create a file object
      const file = {
        uri: uri,
        type: `image/${fileExt}`,
        name: fileName,
      } as any;

      formData.append('file', file);

      const { data, error } = await supabase.storage.from('dogs').upload(fileName, file, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('dogs').getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    const locationToUse = selectedLocation || userLocation;
    if (!locationToUse) {
      Alert.alert('Location Required', 'Please enable location access to add items.');
      return;
    }

    // Validation
    if (activeType === 'dog' || activeType === 'stray') {
      if (!dogName.trim()) {
        Alert.alert('Name Required', 'Please enter a name for the dog.');
        return;
      }
    } else if (activeType === 'emergency') {
      if (!emergencyType.trim() || !description.trim()) {
        Alert.alert('Details Required', 'Please fill in emergency type and description.');
        return;
      }
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Authentication Required', 'Please sign in to add items.');
        return;
      }

      let imageUrl: string | null = null;
      if (imageUri) {
        console.log('📤 Uploading image...');
        try {
          imageUrl = await uploadImage(imageUri);
          if (imageUrl) {
            console.log('✅ Image uploaded successfully:', imageUrl);
          } else {
            console.log('❌ Image upload failed, continuing without image');
          }
        } catch (uploadError) {
          console.log('❌ Image upload error, continuing without image:', uploadError);
          // Continue without image rather than failing the entire submission
        }
      }

      if (activeType === 'dog' || activeType === 'stray') {
        const dogData = {
          name: dogName.trim(),
          breed: dogBreed.trim() || null,
          size: dogSize,
          age_years: dogAge ? parseInt(dogAge) : null,
          dog_type: activeType === 'stray' ? 'stray' : 'owned',
          owner_id: activeType === 'stray' ? null : user.id,
          // owner_name is retrieved from users table via owner_id relationship
          contact_info: activeType === 'stray' ? null : ownerContact.trim() || null,
          description: description.trim() || null,
          latitude: locationToUse.latitude,
          longitude: locationToUse.longitude,
          profile_image_url: imageUrl,
          is_available_for_walks: activeType !== 'stray',
          // created_at will be set by database default
        };

        const { error } = await supabase.from('dogs').insert([dogData]);

        if (error) throw error;

        Alert.alert(
          'Success!',
          `${activeType === 'stray' ? 'Stray dog' : 'Dog'} added successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
                onSuccess();
              },
            },
          ]
        );
      } else if (activeType === 'emergency') {
        const emergencyData = {
          reporter_id: user.id,
          emergency_type: emergencyType.trim(),
          severity: emergencySeverity,
          description: description.trim(),
          latitude: locationToUse.latitude,
          longitude: locationToUse.longitude,
          volunteers_needed: parseInt(volunteersNeeded) || 1,
          volunteers_responded: 0,
          status: 'open',
          image_url: imageUrl,
          // created_at will be set by database default
        };

        const { error } = await supabase.from('emergency_requests').insert([emergencyData]);

        if (error) throw error;

        Alert.alert(
          'Emergency Reported!',
          'Emergency has been reported successfully. Help is on the way!',
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
                onSuccess();
              },
            },
          ]
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error submitting:', error);
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <View style={styles.modal}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <Text style={styles.headerTitle}>Add to Map</Text>
                  <Text style={styles.headerSubtitle}>
                    {selectedLocation ? '📍 At selected location' : '📍 At your location'}
                  </Text>
                </View>
                <Pressable onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
              </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
              {/* Type Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What would you like to add?</Text>
                <View style={styles.typeGrid}>
                  {[
                    {
                      type: 'dog' as AddType,
                      icon: 'paw',
                      label: 'My Dog',
                      color: '#3b82f6',
                      gradient: ['#3b82f6', '#1d4ed8'],
                    },
                    {
                      type: 'stray' as AddType,
                      icon: 'heart-outline',
                      label: 'Stray Dog',
                      color: '#f97316',
                      gradient: ['#f97316', '#ea580c'],
                    },
                    {
                      type: 'emergency' as AddType,
                      icon: 'warning',
                      label: 'Emergency',
                      color: '#ef4444',
                      gradient: ['#ef4444', '#dc2626'],
                    },
                  ].map(({ type, icon, label, color, gradient }) => (
                    <Pressable
                      key={type}
                      onPress={() => {
                        setActiveType(type);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.typeCard,
                        activeType === type && { ...styles.typeCardActive, borderColor: color },
                      ]}>
                      {activeType === type ? (
                        <LinearGradient colors={gradient as any} style={styles.typeCardGradient}>
                          <Ionicons name={icon as any} size={32} color="white" />
                          <Text style={styles.typeLabelActive}>{label}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.typeCardContent}>
                          <Ionicons name={icon as any} size={32} color={color} />
                          <Text style={[styles.typeLabel, { color }]}>{label}</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Image Upload */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add Photo</Text>
                <View style={styles.imageContainer}>
                  {imageUri ? (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: imageUri }} style={styles.previewImage} />
                      <Pressable onPress={() => setImageUri(null)} style={styles.removeImageButton}>
                        <Ionicons name="close-circle" size={28} color="#ef4444" />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={48} color="#9ca3af" />
                      <Text style={styles.imagePlaceholderText}>Add a photo</Text>
                    </View>
                  )}

                  <View style={styles.imageActions}>
                    <Pressable onPress={takePhoto} style={styles.imageActionButton}>
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.imageActionGradient}>
                        <Ionicons name="camera" size={20} color="white" />
                        <Text style={styles.imageActionText}>Camera</Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable onPress={pickImage} style={styles.imageActionButton}>
                      <LinearGradient
                        colors={['#8b5cf6', '#7c3aed']}
                        style={styles.imageActionGradient}>
                        <Ionicons name="images" size={20} color="white" />
                        <Text style={styles.imageActionText}>Gallery</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Dynamic Form Content */}
              {(activeType === 'dog' || activeType === 'stray') && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dog Details</Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Name *</Text>
                    <TextInput
                      value={dogName}
                      onChangeText={setDogName}
                      placeholder="Enter dog's name"
                      style={styles.textInput}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Breed</Text>
                    <TextInput
                      value={dogBreed}
                      onChangeText={setDogBreed}
                      placeholder="e.g., Golden Retriever, Mixed"
                      style={styles.textInput}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Size</Text>
                    <View style={styles.optionRow}>
                      {(['small', 'medium', 'large'] as DogSize[]).map((size) => (
                        <Pressable
                          key={size}
                          onPress={() => setDogSize(size)}
                          style={[
                            styles.optionButton,
                            dogSize === size && styles.optionButtonActive,
                          ]}>
                          <Text
                            style={[
                              styles.optionText,
                              dogSize === size && styles.optionTextActive,
                            ]}>
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Age (years)</Text>
                    <TextInput
                      value={dogAge}
                      onChangeText={setDogAge}
                      placeholder="e.g., 3"
                      keyboardType="numeric"
                      style={styles.textInput}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Tell us about this dog..."
                      multiline
                      numberOfLines={3}
                      style={[styles.textInput, styles.textArea]}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {activeType === 'dog' && (
                    <>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Owner Name</Text>
                        <TextInput
                          value={ownerName}
                          onChangeText={setOwnerName}
                          placeholder="Your name"
                          style={styles.textInput}
                          placeholderTextColor="#9ca3af"
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Contact</Text>
                        <TextInput
                          value={ownerContact}
                          onChangeText={setOwnerContact}
                          placeholder="Phone or email"
                          style={styles.textInput}
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    </>
                  )}
                </View>
              )}

              {activeType === 'emergency' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Emergency Details</Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Emergency Type *</Text>
                    <TextInput
                      value={emergencyType}
                      onChangeText={setEmergencyType}
                      placeholder="e.g., Injured Dog, Lost Pet"
                      style={styles.textInput}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Severity</Text>
                    <View style={styles.severityGrid}>
                      {(['low', 'medium', 'high', 'critical'] as EmergencySeverity[]).map(
                        (severity) => (
                          <Pressable
                            key={severity}
                            onPress={() => setEmergencySeverity(severity)}
                            style={[
                              styles.severityButton,
                              emergencySeverity === severity && styles.severityButtonActive,
                              { borderColor: getSeverityColor(severity) },
                            ]}>
                            <Text
                              style={[
                                styles.severityText,
                                emergencySeverity === severity && { color: 'white' },
                              ]}>
                              {severity.charAt(0).toUpperCase() + severity.slice(1)}
                            </Text>
                          </Pressable>
                        )
                      )}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description *</Text>
                    <TextInput
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Describe the emergency..."
                      multiline
                      numberOfLines={4}
                      style={[styles.textInput, styles.textArea]}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <View style={styles.submitSection}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
                  <LinearGradient
                    colors={loading ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                    style={styles.submitGradient}>
                    {loading ? (
                      <Text style={styles.submitText}>Adding...</Text>
                    ) : (
                      <>
                        <Ionicons name="add-circle" size={24} color="white" />
                        <Text style={styles.submitText}>
                          Add{' '}
                          {activeType === 'dog'
                            ? 'Dog'
                            : activeType === 'stray'
                              ? 'Stray Dog'
                              : 'Emergency'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const getSeverityColor = (severity: EmergencySeverity): string => {
  switch (severity) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#eab308';
    default:
      return '#84cc16';
  }
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 11000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 11000,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  typeCardActive: {
    borderWidth: 3,
  },
  typeCardContent: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  typeCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  typeLabelActive: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    color: 'white',
  },
  imageContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  imageActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  optionTextActive: {
    color: 'white',
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  severityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
  },
  severityButtonActive: {
    backgroundColor: '#ef4444',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  submitSection: {
    padding: 24,
    paddingBottom: 32,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default QuickAddModal;
