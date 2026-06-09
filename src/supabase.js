import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rbhpgritpzcbwdrnorng.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaHBncml0cHpjYndkcm5vcm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NzY1ODMsImV4cCI6MjA5NjU1MjU4M30.CQHZ83yP4i0vuXwD6Colagbvu9v3Jf0SsSebhvIQDRc';

export const supabase = createClient(supabaseUrl, supabaseKey);
