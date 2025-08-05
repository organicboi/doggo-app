import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
}

let currentUser: User | null = null;
let loading = true;
const listeners: (() => void)[] = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const useAuthStore = () => {
  const [user, setUser] = useState<User | null>(currentUser);
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    const listener = () => {
      setUser(currentUser);
      setIsLoading(loading);
    };
    
    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const setUserState = (newUser: User | null) => {
    currentUser = newUser;
    notifyListeners();
  };

  const setLoadingState = (newLoading: boolean) => {
    loading = newLoading;
    notifyListeners();
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserState(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const fetchUser = async () => {
    try {
      setLoadingState(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Fetch user profile from public.users table
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!error && profile) {
          setUserState({
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            phone: profile.phone,
          });
        } else {
          setUserState(null);
        }
      } else {
        setUserState(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUserState(null);
    } finally {
      setLoadingState(false);
    }
  };

  return {
    user,
    loading: isLoading,
    signOut,
    fetchUser,
  };
};

// Initialize auth listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // We'll fetch user in the component
    const { fetchUser } = useAuthStore();
    fetchUser();
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
    notifyListeners();
  }
});
