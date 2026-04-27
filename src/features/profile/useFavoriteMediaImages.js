import { useEffect, useState } from 'react';
import { normalizeFavoriteArtists, normalizeFavoriteSongs } from '../../domain/models';
import { spotifyClient } from '../../lib/api';

export function useFavoriteMediaImages({ favoriteArtists = [], favoriteSongs = [] }) {
  const [artistImages, setArtistImages] = useState({});
  const [songImages, setSongImages] = useState({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const artists = normalizeFavoriteArtists(favoriteArtists, 0).filter((artist) => artist.name && artist.id);
      const songs = normalizeFavoriteSongs(favoriteSongs, 0).filter((song) => song.title);

      const nextArtistEntries = await Promise.all(
        artists
          .filter((artist) => !artistImages[artist.id])
          .map(async (artist) => [artist.id, await spotifyClient.lookupImage({ type: 'artist', name: artist.name })])
      );

      const nextSongEntries = await Promise.all(
        songs
          .filter((song) => !songImages[`${song.title} - ${song.artist}`])
          .map(async (song) => [
            `${song.title} - ${song.artist}`,
            await spotifyClient.lookupImage({ type: 'track', name: song.title, artist: song.artist }),
          ])
      );

      if (cancelled) return;

      if (nextArtistEntries.length) {
        setArtistImages((current) => ({ ...current, ...Object.fromEntries(nextArtistEntries) }));
      }
      if (nextSongEntries.length) {
        setSongImages((current) => ({ ...current, ...Object.fromEntries(nextSongEntries) }));
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [artistImages, favoriteArtists, favoriteSongs, songImages]);

  return {
    artistImages,
    songImages,
  };
}
