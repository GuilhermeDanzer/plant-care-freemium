-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  care_streak INTEGER DEFAULT 0,
  last_action_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plants table
CREATE TABLE IF NOT EXISTS public.plants (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  original_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  watering_freq_days INTEGER NOT NULL,
  last_watered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_watering_at TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  health_data JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  image_url TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policies for plants
CREATE POLICY "Users can view own plants" 
  ON public.plants FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plants" 
  ON public.plants FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants" 
  ON public.plants FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants" 
  ON public.plants FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for journal_entries
CREATE POLICY "Users can view own journal entries" 
  ON public.journal_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" 
  ON public.journal_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" 
  ON public.journal_entries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" 
  ON public.journal_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Storage bucket for user media (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user_media', 'user_media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user_media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user_media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user_media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Media is publically accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user_media');
