import { createClient } from '@supabase/supabase-js';

// .env 파일에 VITE_SUPABASE_URL 및 VITE_SUPABASE_ANON_KEY를 설정해야 합니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);