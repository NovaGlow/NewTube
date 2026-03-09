-- NewTube Database Schema
-- Run: psql -U postgres -d newtube -f schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username    VARCHAR(50) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  avatar_url  VARCHAR(500),
  bio         TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login  TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- USER PREFERENCES TABLE
-- Stores category interests to power discovery
-- (but NOT for personalization - for diversification)
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  category_name   VARCHAR(100) NOT NULL,
  category_id     VARCHAR(20),
  interest_level  SMALLINT DEFAULT 3 CHECK (interest_level BETWEEN 1 AND 5),
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_name)
);

-- ============================================
-- SAVED VIDEOS TABLE
-- Videos the user has bookmarked
-- ============================================
CREATE TABLE IF NOT EXISTS saved_videos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  youtube_id    VARCHAR(20) NOT NULL,
  title         VARCHAR(500) NOT NULL,
  channel_name  VARCHAR(255),
  thumbnail_url VARCHAR(500),
  duration      VARCHAR(20),
  view_count    BIGINT,
  published_at  TIMESTAMP WITH TIME ZONE,
  saved_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes         TEXT,
  UNIQUE(user_id, youtube_id)
);

-- ============================================
-- WATCH HISTORY TABLE
-- Videos the user has viewed in NewTube
-- ============================================
CREATE TABLE IF NOT EXISTS watch_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  youtube_id    VARCHAR(20) NOT NULL,
  title         VARCHAR(500) NOT NULL,
  channel_name  VARCHAR(255),
  thumbnail_url VARCHAR(500),
  watched_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  watch_count   INTEGER DEFAULT 1
);

-- ============================================
-- DISCOVERY SESSIONS TABLE
-- Tracks what categories/searches have been used
-- to help ensure true variety
-- ============================================
CREATE TABLE IF NOT EXISTS discovery_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  category      VARCHAR(100),
  search_query  VARCHAR(500),
  region_code   VARCHAR(5) DEFAULT 'US',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_saved_videos_user_id ON saved_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at ON watch_history(watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_user_id ON discovery_sessions(user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
