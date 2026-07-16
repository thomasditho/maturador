
import { createClient } from '@supabase/supabase-js';

// Credenciais oficiais do projeto BDR 2 (Thomas)
const supabaseUrl = 'https://hfmlleluimdnzwllbcnm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbWxsZWx1aW1kbnp3bGxiY25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzQ3OTAsImV4cCI6MjA5MjcxMDc5MH0.zZqaKSX9GTk8BTlqlz9Sti1BXkZ60gsNLaOUIOvDhbQ';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConnected = () => true;
