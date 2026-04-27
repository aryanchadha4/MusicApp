/**
 * Shared app model typedefs for the UI, feature hooks, and API client layers.
 * This keeps our JavaScript codebase aligned around the same shapes while we
 * stay mobile-friendly and avoid UI-specific data contracts.
 */

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {Object} FavoriteArtist
 * @property {string} name
 * @property {string} id
 */

/**
 * @typedef {Object} FavoriteSong
 * @property {string} title
 * @property {string} artist
 * @property {string} artistId
 */

/**
 * @typedef {Object} ReviewSummary
 * @property {string} [albumId]
 * @property {string} [albumName]
 * @property {string} [artist]
 * @property {string} [artistId]
 * @property {string} [image]
 * @property {number} rating
 * @property {string} [review]
 * @property {string|Date} [reviewedAt]
 */

/**
 * @typedef {Object} ProfileModel
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string} [name]
 * @property {string} [profilePic]
 * @property {string|Date} [joined]
 * @property {FavoriteArtist[]} [favoriteArtists]
 * @property {FavoriteSong[]} [favoriteSongs]
 * @property {ReviewSummary[]} [ratedAlbums]
 * @property {Array<Object>} [followers]
 * @property {Array<Object>} [following]
 */

/**
 * @typedef {Object} DiaryEntryModel
 * @property {string} _id
 * @property {'album'|'track'} kind
 * @property {string} spotifyId
 * @property {string} title
 * @property {string} image
 * @property {string} primaryArtistName
 * @property {string} primaryArtistId
 * @property {string} albumName
 * @property {string} albumId
 * @property {number} rating
 * @property {string} notes
 * @property {string|Date} loggedAt
 */

/**
 * @typedef {Object} MusicListItem
 * @property {string} [_id]
 * @property {'album'|'track'} kind
 * @property {string} spotifyId
 * @property {string} title
 * @property {string} image
 * @property {string} primaryArtistName
 * @property {string} albumName
 */

/**
 * @typedef {Object} MusicListModel
 * @property {string} _id
 * @property {string} name
 * @property {'album'|'track'} itemKind
 * @property {'both'|'name'|'cover'} [displayMode]
 * @property {MusicListItem[]} [items]
 */

/**
 * @typedef {Object} FeedItem
 * @property {string} user
 * @property {string} userId
 * @property {string} album
 * @property {string} albumId
 * @property {string} artist
 * @property {string} artistId
 * @property {number} rating
 * @property {string} [review]
 * @property {string} [image]
 * @property {string|Date} [reviewedAt]
 */

export {};
