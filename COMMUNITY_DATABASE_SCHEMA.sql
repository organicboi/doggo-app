-- Additional tables needed for the Community feature
-- (Note: posts, post_comments, post_likes tables already exist)

-- Table for tracking comment likes
CREATE TABLE public.comment_likes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id),
  CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES post_comments (id) ON DELETE CASCADE,
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Table for post shares/reposts
CREATE TABLE public.post_shares (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  share_type character varying(20) NOT NULL DEFAULT 'repost'::character varying, -- 'repost', 'share_external'
  share_caption text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT post_shares_pkey PRIMARY KEY (id),
  CONSTRAINT post_shares_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT post_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Table for user follows (for community social features)
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (id),
  CONSTRAINT user_follows_follower_id_following_id_key UNIQUE (follower_id, following_id),
  CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
) TABLESPACE pg_default;

-- Table for post reports/flags
CREATE TABLE public.post_reports (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  post_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  report_reason character varying(50) NOT NULL,
  report_details text NULL,
  status character varying(20) NOT NULL DEFAULT 'pending'::character varying,
  reviewed_by uuid NULL,
  reviewed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT post_reports_pkey PRIMARY KEY (id),
  CONSTRAINT post_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT post_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT post_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Table for community hashtags
CREATE TABLE public.hashtags (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name character varying(100) NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT hashtags_pkey PRIMARY KEY (id),
  CONSTRAINT hashtags_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Junction table for post hashtags
CREATE TABLE public.post_hashtags (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  post_id uuid NOT NULL,
  hashtag_id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT post_hashtags_pkey PRIMARY KEY (id),
  CONSTRAINT post_hashtags_post_id_hashtag_id_key UNIQUE (post_id, hashtag_id),
  CONSTRAINT post_hashtags_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT post_hashtags_hashtag_id_fkey FOREIGN KEY (hashtag_id) REFERENCES hashtags (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON public.post_shares USING btree (post_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON public.post_shares USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_post_shares_created_at ON public.post_shares USING btree (created_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows USING btree (follower_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows USING btree (following_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON public.post_reports USING btree (post_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON public.post_reports USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_hashtags_name ON public.hashtags USING btree (name) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON public.hashtags USING btree (usage_count DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON public.post_hashtags USING btree (post_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON public.post_hashtags USING btree (hashtag_id) TABLESPACE pg_default;

-- Update existing posts table with missing columns if they don't exist
DO $$ 
BEGIN
    -- Add missing columns to posts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'visibility') THEN
        ALTER TABLE public.posts ADD COLUMN visibility character varying(20) DEFAULT 'public'::character varying;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'mentions') THEN
        ALTER TABLE public.posts ADD COLUMN mentions uuid[] NULL;
    END IF;
END $$;

-- Create a view for community feed with user and dog information
CREATE OR REPLACE VIEW public.community_feed_view AS
SELECT 
    p.id,
    p.author_id,
    u.full_name as author_name,
    u.display_name as author_display_name,
    u.avatar_url as author_avatar,
    p.dog_id,
    d.name as dog_name,
    d.breed as dog_breed,
    d.profile_image_url as dog_image,
    p.walk_id,
    p.post_type,
    p.title,
    p.content,
    p.images,
    p.video_url,
    p.latitude,
    p.longitude,
    p.location_description,
    p.likes_count,
    p.comments_count,
    p.shares_count,
    p.is_published,
    p.is_flagged,
    p.created_at,
    p.updated_at,
    COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as hashtags
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN dogs d ON p.dog_id = d.id
LEFT JOIN post_hashtags ph ON p.id = ph.post_id
LEFT JOIN hashtags h ON ph.hashtag_id = h.id
WHERE p.is_published = true AND p.is_flagged = false
GROUP BY p.id, u.full_name, u.display_name, u.avatar_url, d.name, d.breed, d.profile_image_url
ORDER BY p.created_at DESC;

-- Triggers for updating counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET shares_count = shares_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE post_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_hashtag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE hashtags SET usage_count = usage_count + 1 WHERE id = NEW.hashtag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE hashtags SET usage_count = usage_count - 1 WHERE id = OLD.hashtag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;
CREATE TRIGGER trigger_update_post_comments_count
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

DROP TRIGGER IF EXISTS trigger_update_post_shares_count ON post_shares;
CREATE TRIGGER trigger_update_post_shares_count
    AFTER INSERT OR DELETE ON post_shares
    FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

DROP TRIGGER IF EXISTS trigger_update_hashtag_usage_count ON post_hashtags;
CREATE TRIGGER trigger_update_hashtag_usage_count
    AFTER INSERT OR DELETE ON post_hashtags
    FOR EACH ROW EXECUTE FUNCTION update_hashtag_usage_count();

-- Row Level Security (RLS) policies
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- Policies for post_likes
CREATE POLICY "Users can view all post likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own post likes" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own post likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Policies for post_shares
CREATE POLICY "Users can view all post shares" ON post_shares FOR SELECT USING (true);
CREATE POLICY "Users can insert their own post shares" ON post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own post shares" ON post_shares FOR DELETE USING (auth.uid() = user_id);

-- Policies for comment_likes
CREATE POLICY "Users can view all comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comment likes" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_follows
CREATE POLICY "Users can view all follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow others" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Policies for post_reports
CREATE POLICY "Users can view their own reports" ON post_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON post_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
