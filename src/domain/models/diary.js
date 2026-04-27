export function buildDiaryEntryPayloadFromSelection(modalKind, album, track, rating, notes) {
  if (modalKind === 'album' && album) {
    return {
      kind: 'album',
      spotifyId: album.id,
      title: album.name,
      image: album.images?.[0]?.url || '',
      primaryArtistName: album.artists?.[0]?.name || '',
      primaryArtistId: album.artists?.[0]?.id || '',
      albumName: '',
      albumId: '',
      rating,
      notes,
    };
  }

  if (modalKind === 'track' && track) {
    return {
      kind: 'track',
      spotifyId: track.id,
      title: track.name,
      image: track.album?.images?.[0]?.url || '',
      primaryArtistName: track.artists?.[0]?.name || '',
      primaryArtistId: track.artists?.[0]?.id || '',
      albumName: track.album?.name || '',
      albumId: track.album?.id || '',
      rating,
      notes,
    };
  }

  return null;
}

export function getDiarySearchItems(results, searchType) {
  if (searchType === 'track') {
    return results?.tracks?.items || [];
  }
  return results?.albums?.items || [];
}
