import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const ModernAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert('Error', error.message);
    if (!session) Alert.alert('Success', 'Please check your inbox for email verification!');
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center px-8 py-12">
            {/* Header */}
            <View className="items-center mb-12">
              <View className="bg-white/20 p-6 rounded-full mb-6">
                <Ionicons name="paw" size={48} color="white" />
              </View>
              <Text className="text-white text-4xl font-bold mb-2">PawPals</Text>
              <Text className="text-white/80 text-lg text-center leading-6">
                {isSignUp 
                  ? 'Join our community of dog lovers' 
                  : 'Welcome back to your pack'
                }
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Email Input */}
              <View>
                <Text className="text-white/90 text-sm font-medium mb-2">Email Address</Text>
                <View className="bg-white/10 rounded-2xl border border-white/20">
                  <View className="flex-row items-center px-4 py-4">
                    <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-white/90 text-sm font-medium mb-2">Password</Text>
                <View className="bg-white/10 rounded-2xl border border-white/20">
                  <View className="flex-row items-center px-4 py-4">
                    <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      className="p-1"
                    >
                      <Ionicons 
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                        size={20} 
                        color="rgba(255,255,255,0.7)" 
                      />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                onPress={isSignUp ? signUpWithEmail : signInWithEmail}
                disabled={loading || !email || !password}
                className={`mt-8 rounded-2xl overflow-hidden ${
                  loading || !email || !password ? 'opacity-50' : ''
                }`}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.8)']}
                  className="py-4 px-6"
                >
                  <Text className="text-center text-gray-800 text-lg font-bold">
                    {loading 
                      ? 'Please wait...' 
                      : isSignUp 
                        ? 'Create Account' 
                        : 'Sign In'
                    }
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Toggle Sign Up/Sign In */}
              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-white/70 text-base">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <Pressable
                  onPress={() => setIsSignUp(!isSignUp)}
                  className="ml-2"
                >
                  <Text className="text-white font-bold text-base underline">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Pressable>
              </View>

              {/* Divider */}
              <View className="flex-row items-center my-8">
                <View className="flex-1 h-px bg-white/20" />
                <Text className="mx-4 text-white/60 text-sm">OR</Text>
                <View className="flex-1 h-px bg-white/20" />
              </View>

              {/* Social Login Placeholder */}
              <Pressable className="bg-white/10 rounded-2xl border border-white/20 py-4 px-6">
                <View className="flex-row items-center justify-center">
                  <Ionicons name="logo-google" size={20} color="white" />
                  <Text className="text-white font-medium ml-3">Continue with Google</Text>
                </View>
              </Pressable>
            </View>

            {/* Footer */}
            <View className="mt-12 items-center">
              <Text className="text-white/60 text-sm text-center leading-5">
                By continuing, you agree to our{'\n'}
                <Text className="underline">Terms of Service</Text> and{' '}
                <Text className="underline">Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default ModernAuth;