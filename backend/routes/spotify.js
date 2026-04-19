const express = require('express');
const axios = require('axios');
const router = express.Router();

let spotifyToken = null;
let tokenExpires = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < tokenExpires) return spotifyToken;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const resp = await axios.post('https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    }
  );
  spotifyToken = resp.data.access_token;
  tokenExpires = Date.now() + (resp.data.expires_in - 60) * 1000;
  return spotifyToken;
}

// GET /api/spotify/album/:id
router.get('/album/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const token = await getSpotifyToken();
    const resp = await axios.get(`https://api.spotify.com/v1/albums/${id}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ message: 'Spotify album fetch failed', error: err.message });
  }
});

// GET /api/spotify/artist/:id
router.get('/artist/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const token = await getSpotifyToken();
    // Fetch artist info
    const artistResp = await axios.get(`https://api.spotify.com/v1/artists/${id}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const artist = artistResp.data;
    // Fetch albums (includes singles, compilations, appears_on)
    const albumsResp = await axios.get(`https://api.spotify.com/v1/artists/${id}/albums`, {
      headers: { Authorization: 'Bearer ' + token },
      params: { include_groups: 'album,single', market: 'US', limit: 50 }
    });
    const featuredResp = await axios.get(`https://api.spotify.com/v1/artists/${id}/albums`, {
      headers: { Authorization: 'Bearer ' + token },
      params: { include_groups: 'appears_on', market: 'US', limit: 50 }
    });
    // Remove duplicate albums by id
    const uniqueAlbums = Object.values((albumsResp.data.items || []).reduce((acc, album) => {
      acc[album.id] = album;
      return acc;
    }, {}));
    const uniqueFeatured = Object.values((featuredResp.data.items || []).reduce((acc, album) => {
      acc[album.id] = album;
      return acc;
    }, {}));
    res.json({ artist, albums: uniqueAlbums, featuredOn: uniqueFeatured });
  } catch (err) {
    res.status(500).json({ message: 'Spotify artist fetch failed', error: err.message });
  }
});

// GET /api/spotify/top-albums
router.get('/top-albums', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    // Use Spotify's new releases endpoint for popular albums
    const resp = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
      headers: { Authorization: 'Bearer ' + token },
      params: { limit: 20, country: 'US' }
    });
    const albums = (resp.data.albums.items || []).map(album => ({
      id: album.id,
      album: album.name,
      artist: album.artists[0]?.name,
      artistId: album.artists[0]?.id, // Add artistId
      image: album.images[0]?.url
    }));
    res.json(albums);
  } catch (err) {
    console.error('Spotify top albums fetch failed:', err.response?.data || err.message || err);
    res.status(500).json({ message: 'Spotify top albums fetch failed', error: err.message });
  }
});

module.exports = router; 