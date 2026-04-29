import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://paknizhvsgpoxytxlanz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBha25pemh2c2dwb3h5dHhsYW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDcwNjMsImV4cCI6MjA5MjAyMzA2M30.sZDnbbUgwxFjchJqlTbSlJWl6ul1YJDpDM_65RWPf88';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
