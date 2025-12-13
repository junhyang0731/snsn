-- Drop existing foreign keys and constraints
ALTER TABLE IF EXISTS public.purchases DROP CONSTRAINT IF EXISTS purchases_video_id_fkey;
ALTER TABLE IF EXISTS public.videos DROP CONSTRAINT IF EXISTS videos_pkey CASCADE;

-- Recreate videos table with INTEGER id
CREATE TABLE IF NOT EXISTS public.videos_new (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  rating DECIMAL(3, 1) DEFAULT 5.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Copy data if it exists
INSERT INTO public.videos_new (title, description, price, thumbnail_url, video_url, user_id, is_admin, views, rating, created_at, updated_at)
SELECT title, description, price, thumbnail_url, video_url, user_id, is_admin, views, rating, created_at, updated_at
FROM public.videos WHERE TRUE;

-- Drop old table
DROP TABLE IF EXISTS public.videos CASCADE;

-- Rename new table
ALTER TABLE public.videos_new RENAME TO videos;

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Videos RLS policies
CREATE POLICY "Anyone can view videos" ON public.videos
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own videos" ON public.videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" ON public.videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" ON public.videos
  FOR DELETE USING (auth.uid() = user_id);

-- Recreate purchases table with video_id as INTEGER
CREATE TABLE IF NOT EXISTS public.purchases_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id INTEGER NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  bitcoin_address TEXT,
  bank_account TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Copy data if it exists
INSERT INTO public.purchases_new (id, user_id, video_id, payment_method, amount, status, bitcoin_address, bank_account, created_at, updated_at)
SELECT id, user_id, video_id::INTEGER, payment_method, amount, status, bitcoin_address, bank_account, created_at, updated_at
FROM public.purchases WHERE TRUE;

-- Drop old table
DROP TABLE IF EXISTS public.purchases CASCADE;

-- Rename new table
ALTER TABLE public.purchases_new RENAME TO purchases;

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Purchases RLS policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" ON public.purchases
  FOR UPDATE USING (auth.uid() = user_id);
