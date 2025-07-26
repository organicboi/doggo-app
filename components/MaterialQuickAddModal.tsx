import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  Portal,
  Modal,
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  SegmentedButtons,
  Chip,
  Surface,
  Text,
  ActivityIndicator,
  useTheme,
  IconButton,
  Avatar,
  Divider,
  HelperText,
  Switch,
  List,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MaterialQuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  userLocation: any;
  selectedLocation: { latitude: number; longitude: number } | null;
  onSuccess: () => void;
}

interface FormData {
  type: 'dog' | 'stray' | 'emergency';
  name: string;
  breed: string;
  size: 'small' | 'medium' | 'large';
  age: string;
  description: string;
  ownerName: string;
  ownerContact: string;
  emergencyType: string;
  severity: 'low' | 'medium' | 'high';
  volunteersNeeded: string;
}

export default function MaterialQuickAddModal({
  visible,
  onClose,
  userLocation,
  selectedLocation,
  onSuccess,
}: MaterialQuickAddModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    type: 'dog',
    name: '',
    breed: '',
    size: 'medium',
    age: '',
    description: '',
    ownerName: '',
    ownerContact: '',
    emergencyType: '',
    severity: 'medium',
    volunteersNeeded: '1',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setFormData({
        type: 'dog',
        name: '',
        breed: '',
        size: 'medium',
        age: '',
        description: '',
        ownerName: '',
        ownerContact: '',
        emergencyType: '',
        severity: 'medium',
        volunteersNeeded: '1',
      });
      setImageUri(null);
      setErrors({});
      setUseCurrentLocation(!selectedLocation);
    }
  }, [visible, selectedLocation]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.type === 'dog' || formData.type === 'stray') {
      if (!formData.breed.trim()) {
        newErrors.breed = 'Breed is required';
      }
      if (formData.type === 'dog' && !formData.ownerName.trim()) {
        newErrors.ownerName = 'Owner name is required';
      }
    }

    if (formData.type === 'emergency') {
      if (!formData.emergencyType.trim()) {
        newErrors.emergencyType = 'Emergency type is required';
      }
      if (!formData.volunteersNeeded.trim() || isNaN(Number(formData.volunteersNeeded))) {
        newErrors.volunteersNeeded = 'Valid number required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Could not pick image');
    }
  };

  const takePhoto = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not take photo');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const file = {
        uri,
        type: 'image/jpeg',
        name: fileName,
      };

      const formData = new FormData();
      formData.append('file', file as any);

      const { data, error } = await supabase.storage.from('dogs').upload(fileName, file as any);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: publicURL } = supabase.storage.from('dogs').getPublicUrl(fileName);

      return publicURL.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return userLocation;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Get location
      const location = useCurrentLocation
        ? await getCurrentLocation()
        : selectedLocation || userLocation;

      if (!location) {
        Alert.alert('Error', 'Could not get location');
        setLoading(false);
        return;
      }

      // Upload image if selected
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      // Submit based on type
      if (formData.type === 'emergency') {
        const { error } = await supabase.from('emergency_requests').insert({
          emergency_type: formData.emergencyType,
          severity: formData.severity,
          description: formData.description.trim() || null,
          latitude: location.latitude,
          longitude: location.longitude,
          volunteers_needed: parseInt(formData.volunteersNeeded),
          volunteers_responded: 0,
          contact_info: formData.ownerContact.trim() || null,
          image_url: imageUrl,
          user_id: user.id,
        });

        if (error) {
          console.error('Emergency submission error:', error);
          Alert.alert('Error', 'Could not submit emergency request');
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.from('dogs').insert({
          name: formData.name.trim(),
          breed: formData.breed.trim(),
          size: formData.size,
          age_years: formData.age ? parseInt(formData.age) : null,
          description: formData.description.trim() || null,
          latitude: location.latitude,
          longitude: location.longitude,
          dog_type: formData.type,
          owner_id: formData.type === 'dog' ? user.id : null,
          contact_info: formData.ownerContact.trim() || null,
          profile_image_url: imageUrl,
        });

        if (error) {
          console.error('Dog submission error:', error);
          Alert.alert('Error', 'Could not add dog');
          setLoading(false);
          return;
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Could not submit. Please try again.');
    }

    setLoading(false);
  };

  const typeOptions = [
    { value: 'dog', label: 'Owned Dog', icon: 'dog' },
    { value: 'stray', label: 'Stray Dog', icon: 'dog-side' },
    { value: 'emergency', label: 'Emergency', icon: 'alert' },
  ];

  const sizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  const severityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            marginTop: insets.top + 20,
            zIndex: 11000,
            elevation: 11000,
          },
        ]}
        style={{
          zIndex: 11000,
          elevation: 11000,
        }}>
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Title
            title="Quick Add"
            subtitle="Add a dog or report an emergency"
            left={(props) => (
              <Avatar.Icon
                {...props}
                icon="plus"
                style={{ backgroundColor: theme.colors.primaryContainer }}
              />
            )}
            right={(props) => <IconButton {...props} icon="close" onPress={onClose} />}
          />

          <Card.Content>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}>
              {/* Type Selection */}
              <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                What are you adding?
              </Text>
              <SegmentedButtons
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                buttons={typeOptions}
                style={{ marginBottom: 16 }}
              />

              {/* Common Fields */}
              <TextInput
                label="Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                error={!!errors.name}
                style={{ marginBottom: 8 }}
                mode="outlined"
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              {/* Dog/Stray Specific Fields */}
              {(formData.type === 'dog' || formData.type === 'stray') && (
                <>
                  <TextInput
                    label="Breed *"
                    value={formData.breed}
                    onChangeText={(text) => setFormData({ ...formData, breed: text })}
                    error={!!errors.breed}
                    style={{ marginBottom: 8 }}
                    mode="outlined"
                  />
                  <HelperText type="error" visible={!!errors.breed}>
                    {errors.breed}
                  </HelperText>

                  <Text variant="titleSmall" style={{ marginBottom: 8, marginTop: 8 }}>
                    Size
                  </Text>
                  <SegmentedButtons
                    value={formData.size}
                    onValueChange={(value) => setFormData({ ...formData, size: value as any })}
                    buttons={sizeOptions}
                    style={{ marginBottom: 16 }}
                  />

                  <TextInput
                    label="Age (years)"
                    value={formData.age}
                    onChangeText={(text) => setFormData({ ...formData, age: text })}
                    keyboardType="numeric"
                    style={{ marginBottom: 16 }}
                    mode="outlined"
                  />

                  {formData.type === 'dog' && (
                    <>
                      <TextInput
                        label="Owner Name *"
                        value={formData.ownerName}
                        onChangeText={(text) => setFormData({ ...formData, ownerName: text })}
                        error={!!errors.ownerName}
                        style={{ marginBottom: 8 }}
                        mode="outlined"
                      />
                      <HelperText type="error" visible={!!errors.ownerName}>
                        {errors.ownerName}
                      </HelperText>
                    </>
                  )}
                </>
              )}

              {/* Emergency Specific Fields */}
              {formData.type === 'emergency' && (
                <>
                  <TextInput
                    label="Emergency Type *"
                    value={formData.emergencyType}
                    onChangeText={(text) => setFormData({ ...formData, emergencyType: text })}
                    error={!!errors.emergencyType}
                    style={{ marginBottom: 8 }}
                    mode="outlined"
                    placeholder="e.g., Injured dog, Lost pet, etc."
                  />
                  <HelperText type="error" visible={!!errors.emergencyType}>
                    {errors.emergencyType}
                  </HelperText>

                  <Text variant="titleSmall" style={{ marginBottom: 8, marginTop: 8 }}>
                    Severity
                  </Text>
                  <SegmentedButtons
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value as any })}
                    buttons={severityOptions}
                    style={{ marginBottom: 16 }}
                  />

                  <TextInput
                    label="Volunteers Needed *"
                    value={formData.volunteersNeeded}
                    onChangeText={(text) => setFormData({ ...formData, volunteersNeeded: text })}
                    keyboardType="numeric"
                    error={!!errors.volunteersNeeded}
                    style={{ marginBottom: 8 }}
                    mode="outlined"
                  />
                  <HelperText type="error" visible={!!errors.volunteersNeeded}>
                    {errors.volunteersNeeded}
                  </HelperText>
                </>
              )}

              {/* Contact Info */}
              <TextInput
                label="Contact Information"
                value={formData.ownerContact}
                onChangeText={(text) => setFormData({ ...formData, ownerContact: text })}
                style={{ marginBottom: 16 }}
                mode="outlined"
                placeholder="Phone number or email"
              />

              {/* Description */}
              <TextInput
                label="Description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                style={{ marginBottom: 16 }}
                mode="outlined"
                placeholder="Additional details..."
              />

              {/* Image Section */}
              <Divider style={{ marginVertical: 16 }} />
              <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                Add Photo (Optional)
              </Text>

              <View style={styles.imageSection}>
                {imageUri ? (
                  <Surface style={styles.imagePreview} elevation={2}>
                    <Text>Image selected ✓</Text>
                    <Button onPress={() => setImageUri(null)} mode="text" compact>
                      Remove
                    </Button>
                  </Surface>
                ) : (
                  <View style={styles.imageButtons}>
                    <Button
                      icon="camera"
                      mode="outlined"
                      onPress={takePhoto}
                      style={{ flex: 1, marginRight: 8 }}>
                      Camera
                    </Button>
                    <Button icon="image" mode="outlined" onPress={pickImage} style={{ flex: 1 }}>
                      Gallery
                    </Button>
                  </View>
                )}
              </View>

              {/* Location Section */}
              <Divider style={{ marginVertical: 16 }} />
              <View style={styles.locationSection}>
                <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                  Location
                </Text>
                <List.Item
                  title="Use current location"
                  description={
                    useCurrentLocation
                      ? 'Using your current location'
                      : 'Using selected map location'
                  }
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                  right={() => (
                    <Switch
                      value={useCurrentLocation}
                      onValueChange={setUseCurrentLocation}
                      disabled={!selectedLocation}
                    />
                  )}
                />
              </View>
            </ScrollView>
          </Card.Content>

          <Card.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 16 }}>
            <Button onPress={onClose} mode="text">
              Cancel
            </Button>
            <Button
              onPress={handleSubmit}
              mode="contained"
              loading={loading}
              disabled={loading}
              style={{ backgroundColor: theme.colors.primary }}>
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  imageSection: {
    marginBottom: 16,
  },
  imagePreview: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
  },
  locationSection: {
    marginBottom: 16,
  },
});
