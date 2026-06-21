import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jgyimsnlbtkmtqstpqwo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpneWltc25sYnRrbXRxc3RwcXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MDU3NzgsImV4cCI6MjA5NzQ4MTc3OH0.SG6SZWMyHJ9eOeQ7I15eKRjQF4piY6gQR7CA6jp81vw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);