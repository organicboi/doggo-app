import React, { useState, memo } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput, Dimensions } from 'react-native';
import { Modal, Card, Button, Chip, Switch, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: screenWidth } = Dimensions.get('window');

interface Dog {
  id: string;
  name: string;
  breed: string;
  preferred_walk_duration?: number;
  walking_pace?: string;
  owner_name?: string;
  special_needs?: string;
}

interface WalkRequestModalProps {
  visible: boolean;
  dog: Dog | null;
  onClose: () => void;
  onSubmit: (walkRequest: WalkRequest) => void;
}

interface WalkRequest {
  dogId: string;
  scheduledTime: Date;
  duration: number;
  specialInstructions: string;
  emergencyContact: boolean;
  walkType: 'casual' | 'exercise' | 'training';
  route: 'park' | 'neighborhood' | 'trail' | 'beach';
}

function WalkRequestModal({ visible, dog, onClose, onSubmit }: WalkRequestModalProps) {
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [duration, setDuration] = useState(30);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [emergencyContact, setEmergencyContact] = useState(true);
  const [walkType, setWalkType] = useState<'casual' | 'exercise' | 'training'>('casual');
  const [route, setRoute] = useState<'park' | 'neighborhood' | 'trail' | 'beach'>('park');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  if (!dog) return null;

  const handleSubmit = () => {
    const walkRequest: WalkRequest = {
      dogId: dog.id,
      scheduledTime,
      duration,
      specialInstructions,
      emergencyContact,
      walkType,
      route,
    };

    onSubmit(walkRequest);
    onClose();

    // Reset form
    setScheduledTime(new Date());
    setDuration(30);
    setSpecialInstructions('');
    setEmergencyContact(true);
    setWalkType('casual');
    setRoute('park');
  };

  const durationOptions = [15, 30, 45, 60, 90];
  const walkTypeOptions = [
    {
      value: 'casual',
      label: 'Casual Walk',
      icon: 'walk',
      description: 'Relaxed pace, bathroom breaks',
    },
    {
      value: 'exercise',
      label: 'Exercise',
      icon: 'fitness',
      description: 'High energy, running/jogging',
    },
    {
      value: 'training',
      label: 'Training',
      icon: 'school',
      description: 'Behavior training focus',
    },
  ];
  const routeOptions = [
    { value: 'park', label: 'Park', icon: 'leaf' },
    { value: 'neighborhood', label: 'Neighborhood', icon: 'home' },
    { value: 'trail', label: 'Nature Trail', icon: 'trail-sign' },
    { value: 'beach', label: 'Beach', icon: 'water' },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={{
          marginHorizontal: 20,
          marginVertical: 50,
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
            <Text className="text-2xl font-bold text-gray-800">Walk Request for {dog.name}</Text>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Dog Info Summary */}
          <Card className="mb-6">
            <Card.Content>
              <Text className="mb-2 text-lg font-semibold">{dog.name}</Text>
              <Text className="mb-2 text-gray-600">{dog.breed}</Text>
              {dog.owner_name && <Text className="text-gray-600">Owner: {dog.owner_name}</Text>}
              {dog.preferred_walk_duration && (
                <Text className="mt-2 text-blue-600">
                  Preferred duration: {dog.preferred_walk_duration} minutes
                </Text>
              )}
              {dog.special_needs && (
                <View className="mt-2 rounded-lg bg-yellow-50 p-2">
                  <Text className="text-sm text-yellow-800">
                    ⚠️ Special needs: {dog.special_needs}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Schedule */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-800">
              When would you like to walk {dog.name}?
            </Text>

            <View className="flex-row space-x-3">
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="flex-1 flex-row items-center rounded-xl bg-gray-50 p-4">
                <Ionicons name="calendar" size={20} color="#6b7280" />
                <Text className="ml-2 font-medium text-gray-700">
                  {scheduledTime.toDateString()}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowTimePicker(true)}
                className="flex-1 flex-row items-center rounded-xl bg-gray-50 p-4">
                <Ionicons name="time" size={20} color="#6b7280" />
                <Text className="ml-2 font-medium text-gray-700">
                  {scheduledTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Duration */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-800">Duration</Text>
            <View className="flex-row flex-wrap">
              {durationOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setDuration(option)}
                  className={`mb-2 mr-2 rounded-full px-4 py-2 ${
                    duration === option ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                  <Text
                    className={`font-medium ${
                      duration === option ? 'text-white' : 'text-gray-700'
                    }`}>
                    {option} min
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Walk Type */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-800">Walk Type</Text>
            {walkTypeOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setWalkType(option.value as any)}
                className={`mb-2 rounded-xl border p-4 ${
                  walkType === option.value
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                <View className="flex-row items-center">
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={walkType === option.value ? '#3b82f6' : '#6b7280'}
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className={`font-semibold ${
                        walkType === option.value ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                      {option.label}
                    </Text>
                    <Text className="text-sm text-gray-500">{option.description}</Text>
                  </View>
                  {walkType === option.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>

          {/* Route Preference */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-800">Preferred Route</Text>
            <View className="flex-row flex-wrap">
              {routeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setRoute(option.value as any)}
                  className={`mb-2 mr-2 flex-row items-center rounded-xl px-4 py-3 ${
                    route === option.value ? 'bg-green-500' : 'bg-gray-100'
                  }`}>
                  <Ionicons
                    name={option.icon as any}
                    size={16}
                    color={route === option.value ? 'white' : '#6b7280'}
                  />
                  <Text
                    className={`ml-2 font-medium ${
                      route === option.value ? 'text-white' : 'text-gray-700'
                    }`}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Special Instructions */}
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-800">Special Instructions</Text>
            <TextInput
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Any special instructions for walking this dog?"
              multiline
              numberOfLines={3}
              className="rounded-xl bg-gray-50 p-4 text-gray-700"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          {/* Emergency Contact */}
          <View className="mb-6 flex-row items-center justify-between rounded-xl bg-orange-50 p-4">
            <View className="flex-1">
              <Text className="font-semibold text-orange-800">Notify Emergency Contact</Text>
              <Text className="text-sm text-orange-600">
                Owner will be notified when walk starts and ends
              </Text>
            </View>
            <Switch
              value={emergencyContact}
              onValueChange={setEmergencyContact}
              trackColor={{ false: '#d1d5db', true: '#bfdbfe' }}
              thumbColor={emergencyContact ? '#3b82f6' : '#9ca3af'}
            />
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            className="mt-4"
            contentStyle={{ paddingVertical: 8 }}
            buttonColor="#3b82f6">
            Send Walk Request
          </Button>
        </ScrollView>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={scheduledTime}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setScheduledTime(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={scheduledTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const newDateTime = new Date(scheduledTime);
                newDateTime.setHours(selectedTime.getHours());
                newDateTime.setMinutes(selectedTime.getMinutes());
                setScheduledTime(newDateTime);
              }
            }}
          />
        )}
      </Modal>
    </Portal>
  );
}

export default memo(WalkRequestModal);
