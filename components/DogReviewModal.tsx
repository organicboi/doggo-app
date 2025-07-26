import React, { useState, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Modal, Button, Card, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width: screenWidth } = Dimensions.get('window');

interface Dog {
  id: string;
  name: string;
  breed: string;
  profile_image_url?: string;
  owner_name?: string;
}

interface DogReviewModalProps {
  visible: boolean;
  dog: Dog | null;
  onClose: () => void;
  onSubmit: (review: DogReview) => void;
}

interface DogReview {
  dogId: string;
  rating: number;
  title: string;
  comment: string;
  photos: string[];
  categories: {
    behavior: number;
    friendliness: number;
    energy: number;
    obedience: number;
  };
}

function DogReviewModal({ visible, dog, onClose, onSubmit }: DogReviewModalProps) {
  const [overallRating, setOverallRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [categoryRatings, setCategoryRatings] = useState({
    behavior: 5,
    friendliness: 5,
    energy: 5,
    obedience: 5,
  });

  if (!dog) return null;

  const handleSubmit = () => {
    if (!title.trim() || !comment.trim()) {
      Alert.alert(
        'Missing Information',
        'Please provide both a title and comment for your review.'
      );
      return;
    }

    const review: DogReview = {
      dogId: dog.id,
      rating: overallRating,
      title: title.trim(),
      comment: comment.trim(),
      photos,
      categories: categoryRatings,
    };

    onSubmit(review);
    onClose();

    // Reset form
    setOverallRating(5);
    setTitle('');
    setComment('');
    setPhotos([]);
    setCategoryRatings({
      behavior: 5,
      friendliness: 5,
      energy: 5,
      obedience: 5,
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const renderStarRating = (rating: number, onPress: (star: number) => void, size: number = 24) => (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onPress(star)} className="mr-1">
          <Ionicons name="star" size={size} color={star <= rating ? '#fbbf24' : '#e5e7eb'} />
        </Pressable>
      ))}
    </View>
  );

  const categoryLabels = {
    behavior: 'Behavior',
    friendliness: 'Friendliness',
    energy: 'Energy Level',
    obedience: 'Obedience',
  };

  const suggestionPrompts = [
    `How was ${dog.name}'s behavior during your interaction?`,
    `Was ${dog.name} friendly and social?`,
    `How would you describe ${dog.name}'s energy level?`,
    `Any special traits or quirks about ${dog.name}?`,
    `Would you recommend ${dog.name} to other walkers?`,
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{
          marginHorizontal: 20,
          marginVertical: 40,
          backgroundColor: 'white',
          borderRadius: 20,
          maxHeight: '90%',
          zIndex: 11000,
          elevation: 11000,
        }}
        style={{
          zIndex: 11000,
          elevation: 11000,
        }}>
        <ScrollView className="flex-1 p-6">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-800">Review {dog.name}</Text>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Dog Info */}
          <Card className="mb-6">
            <Card.Content>
              <View className="flex-row items-center">
                {dog.profile_image_url ? (
                  <Image
                    source={{ uri: dog.profile_image_url }}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                    <Ionicons name="paw" size={24} color="#9ca3af" />
                  </View>
                )}
                <View className="ml-4 flex-1">
                  <Text className="text-xl font-bold text-gray-800">{dog.name}</Text>
                  <Text className="text-gray-600">{dog.breed}</Text>
                  {dog.owner_name && (
                    <Text className="text-sm text-gray-500">Owner: {dog.owner_name}</Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Overall Rating */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-800">Overall Rating</Text>
            <View className="flex-row items-center">
              {renderStarRating(overallRating, setOverallRating, 32)}
              <Text className="ml-3 text-lg font-medium text-gray-700">{overallRating}/5</Text>
            </View>
          </View>

          {/* Category Ratings */}
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-gray-800">Detailed Ratings</Text>
            <View className="rounded-xl bg-gray-50 p-4">
              {Object.entries(categoryRatings).map(([category, rating]) => (
                <View key={category} className="mb-3 flex-row items-center justify-between">
                  <Text className="font-medium text-gray-700">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </Text>
                  {renderStarRating(
                    rating,
                    (star) => setCategoryRatings((prev) => ({ ...prev, [category]: star })),
                    20
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Review Title */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-800">Review Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={`Summarize your experience with ${dog.name}`}
              className="rounded-xl bg-gray-50 p-4 text-gray-700"
              maxLength={100}
            />
            <Text className="mt-1 text-right text-sm text-gray-400">{title.length}/100</Text>
          </View>

          {/* Review Comment */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-800">Your Review</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder={`Tell others about your experience with ${dog.name}. What made them special?`}
              multiline
              numberOfLines={5}
              className="rounded-xl bg-gray-50 p-4 text-gray-700"
              style={{ textAlignVertical: 'top' }}
              maxLength={500}
            />
            <Text className="mt-1 text-right text-sm text-gray-400">{comment.length}/500</Text>

            {/* Suggestion Prompts */}
            <View className="mt-3">
              <Text className="mb-2 text-sm text-gray-500">Need ideas? Consider:</Text>
              {suggestionPrompts.slice(0, 3).map((prompt, index) => (
                <Text key={index} className="mb-1 text-xs text-gray-400">
                  • {prompt}
                </Text>
              ))}
            </View>
          </View>

          {/* Photos */}
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-800">Photos (Optional)</Text>
              <Pressable
                onPress={pickImage}
                className="flex-row items-center rounded-lg bg-blue-50 px-3 py-2">
                <Ionicons name="camera" size={16} color="#3b82f6" />
                <Text className="ml-1 font-medium text-blue-600">Add Photo</Text>
              </Pressable>
            </View>

            {photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((photo, index) => (
                  <View key={index} className="relative mr-3">
                    <Image source={{ uri: photo }} className="h-24 w-24 rounded-xl" />
                    <Pressable
                      onPress={() => removePhoto(index)}
                      className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-red-500">
                      <Ionicons name="close" size={12} color="white" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View className="items-center rounded-xl bg-gray-50 p-6">
                <Ionicons name="image-outline" size={32} color="#9ca3af" />
                <Text className="mt-2 text-sm text-gray-500">
                  Add photos from your walk with {dog.name}
                </Text>
              </View>
            )}
          </View>

          {/* Guidelines */}
          <View className="mb-6 rounded-xl bg-blue-50 p-4">
            <Text className="mb-2 font-semibold text-blue-800">Review Guidelines</Text>
            <Text className="text-sm leading-5 text-blue-700">
              • Be honest and constructive in your feedback • Focus on the dog's behavior and
              temperament • Help other walkers know what to expect • Keep it respectful and helpful
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            className="mt-4"
            contentStyle={{ paddingVertical: 8 }}
            buttonColor="#3b82f6"
            disabled={!title.trim() || !comment.trim()}>
            Submit Review
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

export default memo(DogReviewModal);
