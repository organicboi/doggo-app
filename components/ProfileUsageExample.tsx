import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PremiumProfileScreen from './PremiumProfileScreen';
import ProfileDemo from './ProfileDemo';

const ProfileUsageExample: React.FC = () => {
  const [currentView, setCurrentView] = useState<'demo' | 'live'>('demo');

  const handleSignOut = () => {
    console.log('User signed out');
    // Handle sign out logic here
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Toggle between Demo and Live Profile */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Pressable
          onPress={() => setCurrentView('demo')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: currentView === 'demo' ? '#ec4899' : 'transparent',
          }}
        >
          <Text style={{
            textAlign: 'center',
            fontWeight: '600',
            color: currentView === 'demo' ? 'white' : '#6b7280',
          }}>
            Demo Profile
          </Text>
        </Pressable>
        
        <Pressable
          onPress={() => setCurrentView('live')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: currentView === 'live' ? '#ec4899' : 'transparent',
          }}
        >
          <Text style={{
            textAlign: 'center',
            fontWeight: '600',
            color: currentView === 'live' ? 'white' : '#6b7280',
          }}>
            Live Profile
          </Text>
        </Pressable>
      </View>

      {/* Render Selected View */}
      {currentView === 'demo' ? (
        <ProfileDemo />
      ) : (
        <PremiumProfileScreen 
          onSignOut={handleSignOut}
          userEmail="user@example.com"
        />
      )}
    </SafeAreaView>
  );
};

export default ProfileUsageExample; 