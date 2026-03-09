const express = require('express');
const axios = require('axios');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

// YouTube category IDs
const YOUTUBE_CATEGORIES = [
  { id: '1',  name: 'Film & Animation' },
  { id: '2',  name: 'Autos & Vehicles' },
  { id: '10', name: 'Music' },
  { id: '15', name: 'Pets & Animals' },
  { id: '17', name: 'Sports' },
  { id: '19', name: 'Travel & Events' },
  { id: '20', name: 'Gaming' },
  { id: '22', name: 'People & Blogs' },
  { id: '23', name: 'Comedy' },
  { id: '24', name: 'Entertainment' },
  { id: '25', name: 'News & Politics' },
  { id: '26', name: 'Howto & Style' },
  { id: '27', name: 'Education' },
  { id: '28', name: 'Science & Technology' },
  { id: '29', name: 'Nonprofits & Activism' },
];

// Diverse regions for global discovery
const REGIONS = ['US', 'GB', 'JP', 'BR', 'IN', 'KR', 'FR', 'DE', 'AU', 'MX', 'NG', 'ZA'];

// ============================================================
// GET /api/videos/categories
// ============================================================
router.get('/categories', (req, res) => {
  res.json({ categories: YOUTUBE_CATEGORIES });
});

// ============================================================
// GET /api/videos/discover
// Returns algorithm-free videos from diverse sources
// ============================================================
router.get('/discover', authenticate, async (req, res) => {
  const { categoryId, region, pageToken } = req.query;
  const maxResults = parseInt(req.query.maxResults) || 12;

  // If no category specified, pick a random one
  const selectedCategory = categoryId || 
    YOUTUBE_CATEGORIES[Math.floor(Math.random() * YOUTUBE_CATEGORIES.length)].id;
  
  // If no region specified, pick a random one for diversity
  const selectedRegion = region || REGIONS[Math.floor(Math.random() * REGIONS.length)];

  try {
    const params = {
      part: 'snippet,statistics,contentDetails',
      chart: 'mostPopular',
      videoCategoryId: selectedCategory,
      regionCode: selectedRegion,
      maxResults,
      key: API_KEY,
    };

    if (pageToken) params.pageToken = pageToken;

    const response = await axios.get(`${YT_BASE}/videos`, { params });
    const data = response.data;

    // Log discovery session for authenticated users
    if (req.user) {
      const categoryName = YOUTUBE_CATEGORIES.find(c => c.id === selectedCategory)?.name;
      await db.query(
        `INSERT INTO discovery_sessions (user_id, category, region_code)
         VALUES ($1, $2, $3)`,
        [req.user.id, categoryName, selectedRegion]
      );
    }

    // Get saved video IDs for this user to mark saved status
    let savedIds = new Set();
    if (req.user) {
      const saved = await db.query(
        'SELECT youtube_id FROM saved_videos WHERE user_id = $1',
        [req.user.id]
      );
      savedIds = new Set(saved.rows.map(r => r.youtube_id));
    }

    const videos = data.items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnail: item.snippet.thumbnails?.maxres?.url || 
                 item.snippet.thumbnails?.high?.url ||
                 item.snippet.thumbnails?.medium?.url,
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails?.duration,
      viewCount: parseInt(item.statistics?.viewCount) || 0,
      likeCount: parseInt(item.statistics?.likeCount) || 0,
      commentCount: parseInt(item.statistics?.commentCount) || 0,
      categoryId: item.snippet?.categoryId,
      tags: item.snippet?.tags?.slice(0, 5) || [],
      isSaved: savedIds.has(item.id),
    }));

    res.json({
      videos,
      nextPageToken: data.nextPageToken || null,
      prevPageToken: data.prevPageToken || null,
      totalResults: data.pageInfo?.totalResults,
      regionUsed: selectedRegion,
      categoryUsed: selectedCategory,
    });
  } catch (err) {
    console.error('Discover error:', err.response?.data || err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ 
      error: 'Failed to fetch videos',
      details: err.response?.data?.error?.message 
    });
  }
});

// ============================================================
// GET /api/videos/search
// Search without personalization
// ============================================================
router.get('/search', authenticate, async (req, res) => {
  const { q, pageToken } = req.query;
  const maxResults = parseInt(req.query.maxResults) || 12;
  // Use random region for search diversity
  const regionCode = req.query.region || REGIONS[Math.floor(Math.random() * REGIONS.length)];

  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

  try {
    // First get search results
    const searchRes = await axios.get(`${YT_BASE}/search`, {
      params: {
        part: 'snippet',
        q,
        type: 'video',
        regionCode,
        maxResults,
        key: API_KEY,
        pageToken: pageToken || undefined,
        safeSearch: 'moderate',
        relevanceLanguage: undefined, // No language bias
      },
    });

    const videoIds = searchRes.data.items.map(i => i.id.videoId).join(',');

    // Get full video details including stats
    const detailsRes = await axios.get(`${YT_BASE}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoIds,
        key: API_KEY,
      },
    });

    // Log the search
    if (req.user) {
      await db.query(
        `INSERT INTO discovery_sessions (user_id, search_query, region_code)
         VALUES ($1, $2, $3)`,
        [req.user.id, q, regionCode]
      );
    }

    let savedIds = new Set();
    if (req.user) {
      const saved = await db.query(
        'SELECT youtube_id FROM saved_videos WHERE user_id = $1',
        [req.user.id]
      );
      savedIds = new Set(saved.rows.map(r => r.youtube_id));
    }

    const videos = detailsRes.data.items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelName: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails?.duration,
      viewCount: parseInt(item.statistics?.viewCount) || 0,
      likeCount: parseInt(item.statistics?.likeCount) || 0,
      isSaved: savedIds.has(item.id),
    }));

    res.json({
      videos,
      nextPageToken: searchRes.data.nextPageToken || null,
      totalResults: searchRes.data.pageInfo?.totalResults,
    });
  } catch (err) {
    console.error('Search error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================================
// GET /api/videos/surprise
// Returns a single completely random video
// ============================================================
router.get('/surprise', authenticate, async (req, res) => {
  const randomCategory = YOUTUBE_CATEGORIES[Math.floor(Math.random() * YOUTUBE_CATEGORIES.length)];
  const randomRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];

  try {
    const response = await axios.get(`${YT_BASE}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        videoCategoryId: randomCategory.id,
        regionCode: randomRegion,
        maxResults: 50,
        key: API_KEY,
      },
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'No videos found' });
    }

    const random = items[Math.floor(Math.random() * items.length)];

    res.json({
      video: {
        id: random.id,
        title: random.snippet.title,
        channelName: random.snippet.channelTitle,
        thumbnail: random.snippet.thumbnails?.maxres?.url || random.snippet.thumbnails?.high?.url,
        publishedAt: random.snippet.publishedAt,
        duration: random.contentDetails?.duration,
        viewCount: parseInt(random.statistics?.viewCount) || 0,
        categoryName: randomCategory.name,
        regionFrom: randomRegion,
      },
    });
  } catch (err) {
    console.error('Surprise error:', err.message);
    res.status(500).json({ error: 'Failed to get surprise video' });
  }
});

// ============================================================
// POST /api/videos/save
// ============================================================
router.post('/save', authenticate, async (req, res) => {
  const { youtubeId, title, channelName, thumbnailUrl, duration, viewCount, publishedAt } = req.body;

  if (!youtubeId || !title) {
    return res.status(400).json({ error: 'youtubeId and title are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO saved_videos (user_id, youtube_id, title, channel_name, thumbnail_url, duration, view_count, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, youtube_id) DO NOTHING
       RETURNING *`,
      [req.user.id, youtubeId, title, channelName, thumbnailUrl, duration, viewCount, publishedAt]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'Video already saved' });
    }

    res.status(201).json({ message: 'Video saved', video: result.rows[0] });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Failed to save video' });
  }
});

// ============================================================
// DELETE /api/videos/save/:youtubeId
// ============================================================
router.delete('/save/:youtubeId', authenticate, async (req, res) => {
  const { youtubeId } = req.params;

  try {
    await db.query(
      'DELETE FROM saved_videos WHERE user_id = $1 AND youtube_id = $2',
      [req.user.id, youtubeId]
    );

    res.json({ message: 'Video removed from saved' });
  } catch (err) {
    console.error('Unsave error:', err);
    res.status(500).json({ error: 'Failed to remove video' });
  }
});

// ============================================================
// GET /api/videos/saved
// ============================================================
router.get('/saved', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM saved_videos WHERE user_id = $1 ORDER BY saved_at DESC`,
      [req.user.id]
    );
    res.json({ videos: result.rows });
  } catch (err) {
    console.error('Fetch saved error:', err);
    res.status(500).json({ error: 'Failed to fetch saved videos' });
  }
});

// ============================================================
// POST /api/videos/history
// ============================================================
router.post('/history', authenticate, async (req, res) => {
  const { youtubeId, title, channelName, thumbnailUrl } = req.body;

  if (!youtubeId || !title) {
    return res.status(400).json({ error: 'youtubeId and title are required' });
  }

  try {
    // Upsert: increment count if already exists
    await db.query(
      `INSERT INTO watch_history (user_id, youtube_id, title, channel_name, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [req.user.id, youtubeId, title, channelName, thumbnailUrl]
    );

    res.status(201).json({ message: 'History updated' });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to record history' });
  }
});

// ============================================================
// GET /api/videos/history
// ============================================================
router.get('/history', authenticate, async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  try {
    const result = await db.query(
      `SELECT * FROM watch_history WHERE user_id = $1 ORDER BY watched_at DESC LIMIT $2`,
      [req.user.id, limit]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error('Fetch history error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
