-- Saved Posts Database Schema
-- Run these queries in Supabase SQL Editor

-- 1. Create saved_posts table
CREATE TABLE saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 2. Create collections table
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create collection_posts table (many-to-many relationship)
CREATE TABLE collection_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, post_id)
);

-- 4. Add RLS (Row Level Security) policies
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_posts ENABLE ROW LEVEL SECURITY;

-- Saved posts policies
CREATE POLICY "Users can view their own saved posts" ON saved_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved posts" ON saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved posts" ON saved_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Collections policies
CREATE POLICY "Users can view their own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON collections
  FOR SELECT USING (is_private = false);

CREATE POLICY "Users can insert their own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Collection posts policies
CREATE POLICY "Users can view collection posts for their collections" ON collection_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_posts.collection_id 
      AND (collections.user_id = auth.uid() OR collections.is_private = false)
    )
  );

CREATE POLICY "Users can insert posts to their own collections" ON collection_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_posts.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete posts from their own collections" ON collection_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE collections.id = collection_posts.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- 5. Create indexes for better performance
CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX idx_saved_posts_post_id ON saved_posts(post_id);
CREATE INDEX idx_saved_posts_created_at ON saved_posts(created_at DESC);

CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_created_at ON collections(created_at DESC);

CREATE INDEX idx_collection_posts_collection_id ON collection_posts(collection_id);
CREATE INDEX idx_collection_posts_post_id ON collection_posts(post_id);
CREATE INDEX idx_collection_posts_added_at ON collection_posts(added_at DESC);

-- 6. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for collections updated_at
CREATE TRIGGER update_collections_updated_at 
  BEFORE UPDATE ON collections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
