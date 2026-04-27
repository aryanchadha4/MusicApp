export function buildListSearchPayload(list, rawItem) {
  if (!list || !rawItem?.id) return null;

  if (list.itemKind === 'track') {
    return {
      kind: 'track',
      spotifyId: String(rawItem.id),
      title: String(rawItem.name || ''),
      image: rawItem.album?.images?.[0]?.url || '',
      primaryArtistName: rawItem.artists?.[0]?.name || '',
      albumName: rawItem.album?.name || '',
    };
  }

  return {
    kind: 'album',
    spotifyId: String(rawItem.id),
    title: String(rawItem.name || ''),
    image: rawItem.images?.[0]?.url || '',
    primaryArtistName: rawItem.artists?.[0]?.name || '',
    albumName: '',
  };
}

export function getListItemSubtitle(item) {
  return [item?.primaryArtistName, item?.kind === 'track' ? item?.albumName : null].filter(Boolean).join(' · ');
}
