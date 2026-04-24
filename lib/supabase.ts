import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://jjhocvhjmjwnbiwbtudl.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaG9jdmhqbWp3bmJpd2J0dWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjQzNjksImV4cCI6MjA5MjIwMDM2OX0.6o7g0VaJIRq3y1kne78Fnzr0Ol22u0cEzOhBIdP0SZ0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
