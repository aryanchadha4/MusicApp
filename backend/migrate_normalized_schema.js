require('dotenv').config();

const mongoose = require('mongoose');
const LegacyUser = require('./models/User');
const LegacyDiaryEntry = require('./models/DiaryEntry');
const LegacyMusicList = require('./models/MusicList');

const UserAccount = require('./models/UserAccount');
const AuthCredential = require('./models/AuthCredential');
const Artist = require('./models/Artist');
const Album = require('./models/Album');
const Track = require('./models/Track');
const MusicEntry = require('./models/MusicEntry');
const FriendRequest = require('./models/FriendRequest');
const Friendship = require('./models/Friendship');
const Follow = require('./models/Follow');
const ActivityEvent = require('./models/ActivityEvent');
const ListCollection = require('./models/ListCollection');
const ListItem = require('./models/ListItem');
const { normalizeObjectIdPair } = require('./models/schemaUtils');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/musicratingapp';
const SHOULD_RESET = process.argv.includes('--reset');

const userAccountByLegacyId = new Map();
const artistBySpotifyId = new Map();
const albumBySpotifyId = new Map();
const trackBySpotifyId = new Map();
const musicEntryByLegacyDiaryId = new Map();

function safeDate(value) {
  if (!value) return null;
  const next = new Date(value);
  return Number.isNaN(next.getTime()) ? null : next;
}

function normalizeArray(values) {
  return Array.isArray(values) ? values : [];
}

function uniqueObjectIds(values) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const key = String(value || '');
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(new mongoose.Types.ObjectId(key));
  });
  return result;
}

function buildActivityEventPayload(entry, actorUserId) {
  return {
    actorUserId,
    musicEntryId: entry._id,
    type: 'music_entry_logged',
    subjectType: entry.subjectType,
    subjectId: entry.subjectId,
    visibility: entry.visibility || 'friends',
    occurredAt: entry.loggedAt || entry.createdAt || new Date(),
    metadata: {
      source: entry.source,
    },
  };
}

async function resetNormalizedCollections() {
  await Promise.all([
    AuthCredential.deleteMany({}),
    ActivityEvent.deleteMany({}),
    Follow.deleteMany({}),
    Friendship.deleteMany({}),
    FriendRequest.deleteMany({}),
    MusicEntry.deleteMany({}),
    ListItem.deleteMany({}),
    ListCollection.deleteMany({}),
    Track.deleteMany({}),
    Album.deleteMany({}),
    Artist.deleteMany({}),
    UserAccount.deleteMany({}),
  ]);
}

async function upsertUserAccount(legacyUser) {
  const legacyId = legacyUser._id.toString();
  if (userAccountByLegacyId.has(legacyId)) {
    return userAccountByLegacyId.get(legacyId);
  }

  let userAccount = await UserAccount.findOne({ legacyUserId: legacyUser._id });
  if (!userAccount && legacyUser.email) {
    userAccount = await UserAccount.findOne({ email: String(legacyUser.email).trim().toLowerCase() });
  }

  if (!userAccount) {
    userAccount = new UserAccount();
  }

  userAccount.legacyUserId = legacyUser._id;
  userAccount.username = legacyUser.username || undefined;
  userAccount.displayName = legacyUser.name || legacyUser.username || 'Listener';
  userAccount.email = legacyUser.email;
  userAccount.avatarUrl = legacyUser.profilePic || '';
  userAccount.createdAtLegacy = safeDate(legacyUser.created_at || legacyUser.createdAt);
  await userAccount.save();

  userAccountByLegacyId.set(legacyId, userAccount);
  return userAccount;
}

async function upsertAuthCredential(legacyUser, userAccount) {
  const passwordHash = legacyUser.password || '';
  await AuthCredential.findOneAndUpdate(
    { userId: userAccount._id, provider: 'local' },
    {
      userId: userAccount._id,
      provider: 'local',
      loginIdentifier: userAccount.email,
      passwordHash,
      createdAtLegacy: safeDate(legacyUser.created_at || legacyUser.createdAt),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function upsertArtistFromLegacy({ spotifyId, name, imageUrl = '' }) {
  const key = String(spotifyId || '').trim();
  if (!key) return null;
  if (artistBySpotifyId.has(key)) return artistBySpotifyId.get(key);

  let artist = await Artist.findOne({ spotifyId: key });
  if (!artist) {
    artist = new Artist({
      spotifyId: key,
      name: String(name || 'Unknown Artist').trim(),
      imageUrl,
      lastSyncedAt: new Date(),
    });
  } else {
    if (name) artist.name = String(name).trim();
    if (imageUrl && !artist.imageUrl) artist.imageUrl = imageUrl;
    artist.lastSyncedAt = artist.lastSyncedAt || new Date();
  }

  await artist.save();
  artistBySpotifyId.set(key, artist);
  return artist;
}

async function upsertAlbumFromLegacy({
  spotifyId,
  title,
  imageUrl = '',
  primaryArtistSpotifyId = '',
  primaryArtistName = '',
  artistSpotifyIds = [],
  artistNames = [],
}) {
  const key = String(spotifyId || '').trim();
  if (!key) return null;
  if (albumBySpotifyId.has(key)) return albumBySpotifyId.get(key);

  const artistIds = [];
  for (let index = 0; index < artistSpotifyIds.length; index += 1) {
    const artist = await upsertArtistFromLegacy({
      spotifyId: artistSpotifyIds[index],
      name: artistNames[index],
    });
    if (artist) artistIds.push(artist._id);
  }

  let primaryArtist = null;
  if (primaryArtistSpotifyId || primaryArtistName) {
    primaryArtist = await upsertArtistFromLegacy({
      spotifyId: primaryArtistSpotifyId,
      name: primaryArtistName,
    });
    if (primaryArtist && !artistIds.some((artistId) => artistId.equals(primaryArtist._id))) {
      artistIds.unshift(primaryArtist._id);
    }
  }

  let album = await Album.findOne({ spotifyId: key });
  if (!album) {
    album = new Album({
      spotifyId: key,
      title: String(title || 'Unknown Album').trim(),
      coverImageUrl: imageUrl,
      primaryArtistId: primaryArtist?._id || null,
      artistIds: uniqueObjectIds(artistIds),
      lastSyncedAt: new Date(),
    });
  } else {
    if (title) album.title = String(title).trim();
    if (imageUrl && !album.coverImageUrl) album.coverImageUrl = imageUrl;
    if (primaryArtist?._id) album.primaryArtistId = primaryArtist._id;
    if (artistIds.length > 0) {
      album.artistIds = uniqueObjectIds([...(album.artistIds || []), ...artistIds]);
    }
    album.lastSyncedAt = album.lastSyncedAt || new Date();
  }

  await album.save();
  albumBySpotifyId.set(key, album);
  return album;
}

async function upsertTrackFromLegacy({
  spotifyId,
  title,
  albumSpotifyId = '',
  albumTitle = '',
  albumImageUrl = '',
  primaryArtistSpotifyId = '',
  primaryArtistName = '',
  artistSpotifyIds = [],
  artistNames = [],
}) {
  const key = String(spotifyId || '').trim();
  if (!key) return null;
  if (trackBySpotifyId.has(key)) return trackBySpotifyId.get(key);

  const album = albumSpotifyId
    ? await upsertAlbumFromLegacy({
        spotifyId: albumSpotifyId,
        title: albumTitle,
        imageUrl: albumImageUrl,
        primaryArtistSpotifyId,
        primaryArtistName,
        artistSpotifyIds,
        artistNames,
      })
    : null;

  const artistIds = [];
  for (let index = 0; index < artistSpotifyIds.length; index += 1) {
    const artist = await upsertArtistFromLegacy({
      spotifyId: artistSpotifyIds[index],
      name: artistNames[index],
    });
    if (artist) artistIds.push(artist._id);
  }

  let primaryArtist = null;
  if (primaryArtistSpotifyId || primaryArtistName) {
    primaryArtist = await upsertArtistFromLegacy({
      spotifyId: primaryArtistSpotifyId,
      name: primaryArtistName,
    });
    if (primaryArtist && !artistIds.some((artistId) => artistId.equals(primaryArtist._id))) {
      artistIds.unshift(primaryArtist._id);
    }
  }

  let track = await Track.findOne({ spotifyId: key });
  if (!track) {
    track = new Track({
      spotifyId: key,
      title: String(title || 'Unknown Track').trim(),
      albumId: album?._id || null,
      primaryArtistId: primaryArtist?._id || null,
      artistIds: uniqueObjectIds(artistIds),
      lastSyncedAt: new Date(),
    });
  } else {
    if (title) track.title = String(title).trim();
    if (album?._id) track.albumId = album._id;
    if (primaryArtist?._id) track.primaryArtistId = primaryArtist._id;
    if (artistIds.length > 0) {
      track.artistIds = uniqueObjectIds([...(track.artistIds || []), ...artistIds]);
    }
    track.lastSyncedAt = track.lastSyncedAt || new Date();
  }

  await track.save();
  trackBySpotifyId.set(key, track);
  return track;
}

async function migrateUsers() {
  const legacyUsers = await LegacyUser.find({}).select('+password');

  for (const legacyUser of legacyUsers) {
    const userAccount = await upsertUserAccount(legacyUser);
    await upsertAuthCredential(legacyUser, userAccount);

    const favoriteArtistDocs = [];
    for (const favoriteArtist of normalizeArray(legacyUser.favoriteArtists)) {
      const artist = await upsertArtistFromLegacy({
        spotifyId: favoriteArtist.id,
        name: favoriteArtist.name,
      });
      if (artist) favoriteArtistDocs.push(artist._id);
    }

    userAccount.favoriteArtistIds = uniqueObjectIds(favoriteArtistDocs);
    await userAccount.save();
  }

  return legacyUsers;
}

async function migrateSocialGraph(legacyUsers) {
  for (const legacyUser of legacyUsers) {
    const followerAccount = await upsertUserAccount(legacyUser);

    for (const followIdRaw of normalizeArray(legacyUser.following)) {
      const followeeAccount = userAccountByLegacyId.get(String(followIdRaw));
      if (!followeeAccount || followerAccount._id.equals(followeeAccount._id)) continue;

      const follow = await Follow.findOneAndUpdate(
        {
          followerUserId: followerAccount._id,
          followeeUserId: followeeAccount._id,
        },
        {
          followerUserId: followerAccount._id,
          followeeUserId: followeeAccount._id,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await ActivityEvent.findOneAndUpdate(
        {
          type: 'follow_created',
          actorUserId: followerAccount._id,
          targetUserId: followeeAccount._id,
        },
        {
          actorUserId: followerAccount._id,
          targetUserId: followeeAccount._id,
          type: 'follow_created',
          subjectType: 'follow',
          subjectId: follow._id,
          visibility: 'friends',
          occurredAt: safeDate(legacyUser.updated_at || legacyUser.created_at) || new Date(),
          metadata: {},
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    for (const friendIdRaw of normalizeArray(legacyUser.friends)) {
      const friendAccount = userAccountByLegacyId.get(String(friendIdRaw));
      if (!friendAccount || followerAccount._id.equals(friendAccount._id)) continue;

      const [userAId, userBId] = normalizeObjectIdPair(followerAccount._id, friendAccount._id);
      await Friendship.findOneAndUpdate(
        { userAId, userBId },
        { userAId, userBId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }
}

async function createMusicEntry({
  legacyUserId,
  legacyDiaryEntryId = null,
  source,
  subjectType,
  subjectDoc,
  rating,
  reviewText = '',
  notes = '',
  loggedAt,
}) {
  if (!subjectDoc) return null;
  const userAccount = userAccountByLegacyId.get(String(legacyUserId));
  if (!userAccount) return null;

  const subjectModel = subjectType === 'album' ? 'Album' : 'Track';
  const query = legacyDiaryEntryId
    ? { legacyDiaryEntryId }
    : {
        legacyUserId,
        subjectType,
        subjectId: subjectDoc._id,
        source,
      };

  const entry = await MusicEntry.findOneAndUpdate(
    query,
    {
      userId: userAccount._id,
      legacyUserId,
      legacyDiaryEntryId,
      source,
      subjectType,
      subjectModel,
      subjectId: subjectDoc._id,
      rating: Number(rating) || 0,
      reviewText: reviewText || '',
      notes: notes || '',
      visibility: 'friends',
      loggedAt: safeDate(loggedAt) || new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await ActivityEvent.findOneAndUpdate(
    { type: 'music_entry_logged', musicEntryId: entry._id },
    buildActivityEventPayload(entry, userAccount._id),
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (legacyDiaryEntryId) {
    musicEntryByLegacyDiaryId.set(String(legacyDiaryEntryId), entry);
  }

  return entry;
}

async function migrateDiaryEntries() {
  const legacyEntries = await LegacyDiaryEntry.find({}).sort({ loggedAt: 1 });

  for (const entry of legacyEntries) {
    let subjectDoc = null;
    if (entry.kind === 'album') {
      subjectDoc = await upsertAlbumFromLegacy({
        spotifyId: entry.spotifyId,
        title: entry.title,
        imageUrl: entry.image,
        primaryArtistSpotifyId: entry.primaryArtistId,
        primaryArtistName: entry.primaryArtistName,
        artistSpotifyIds: entry.primaryArtistId ? [entry.primaryArtistId] : [],
        artistNames: entry.primaryArtistName ? [entry.primaryArtistName] : [],
      });
    } else {
      subjectDoc = await upsertTrackFromLegacy({
        spotifyId: entry.spotifyId,
        title: entry.title,
        albumSpotifyId: entry.albumId,
        albumTitle: entry.albumName,
        albumImageUrl: entry.image,
        primaryArtistSpotifyId: entry.primaryArtistId,
        primaryArtistName: entry.primaryArtistName,
        artistSpotifyIds: entry.primaryArtistId ? [entry.primaryArtistId] : [],
        artistNames: entry.primaryArtistName ? [entry.primaryArtistName] : [],
      });
    }

    await createMusicEntry({
      legacyUserId: entry.userId,
      legacyDiaryEntryId: entry._id,
      source: 'legacy_diary_entry',
      subjectType: entry.kind,
      subjectDoc,
      rating: entry.rating,
      notes: entry.notes,
      loggedAt: entry.loggedAt,
    });
  }
}

async function migrateRatedAlbums(legacyUsers) {
  for (const legacyUser of legacyUsers) {
    for (const rating of normalizeArray(legacyUser.ratedAlbums)) {
      if (!rating.albumId) continue;

      const subjectDoc = await upsertAlbumFromLegacy({
        spotifyId: rating.albumId,
        title: rating.albumName,
        imageUrl: rating.image,
        primaryArtistSpotifyId: rating.artistId,
        primaryArtistName: rating.artist,
        artistSpotifyIds: rating.artistId ? [rating.artistId] : [],
        artistNames: rating.artist ? [rating.artist] : [],
      });

      if (!subjectDoc) continue;

      const existingEntry = await MusicEntry.findOne({
        legacyUserId: legacyUser._id,
        subjectType: 'album',
        subjectId: subjectDoc._id,
      }).sort({ loggedAt: -1 });

      if (existingEntry) continue;

      await createMusicEntry({
        legacyUserId: legacyUser._id,
        source: 'legacy_rated_album',
        subjectType: 'album',
        subjectDoc,
        rating: rating.rating,
        reviewText: rating.review,
        loggedAt: rating.reviewedAt,
      });
    }
  }
}

async function migrateLists() {
  const legacyLists = await LegacyMusicList.find({}).sort({ createdAt: 1 });

  for (const legacyList of legacyLists) {
    const ownerUser = userAccountByLegacyId.get(String(legacyList.userId));
    if (!ownerUser) continue;

    const list = await ListCollection.findOneAndUpdate(
      { legacyListId: legacyList._id },
      {
        legacyListId: legacyList._id,
        ownerUserId: ownerUser._id,
        name: legacyList.name,
        itemType: legacyList.itemKind,
        displayMode: legacyList.displayMode || 'both',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const listItems = normalizeArray(legacyList.items);
    for (let index = 0; index < listItems.length; index += 1) {
      const legacyItem = listItems[index];
      let sourceMusicEntryId = null;
      let subjectDoc = null;

      if (legacyItem.diaryEntryId && musicEntryByLegacyDiaryId.has(String(legacyItem.diaryEntryId))) {
        const entry = musicEntryByLegacyDiaryId.get(String(legacyItem.diaryEntryId));
        sourceMusicEntryId = entry._id;
        subjectDoc = { _id: entry.subjectId };
      } else if (legacyItem.kind === 'album') {
        subjectDoc = await upsertAlbumFromLegacy({
          spotifyId: legacyItem.spotifyId,
          title: legacyItem.title,
          imageUrl: legacyItem.image,
          primaryArtistSpotifyId: '',
          primaryArtistName: legacyItem.primaryArtistName,
        });
      } else {
        subjectDoc = await upsertTrackFromLegacy({
          spotifyId: legacyItem.spotifyId,
          title: legacyItem.title,
          albumSpotifyId: '',
          albumTitle: legacyItem.albumName,
          albumImageUrl: legacyItem.image,
          primaryArtistSpotifyId: '',
          primaryArtistName: legacyItem.primaryArtistName,
        });
      }

      if (!subjectDoc) continue;

      const subjectModel = legacyItem.kind === 'album' ? 'Album' : 'Track';
      await ListItem.findOneAndUpdate(
        {
          listId: list._id,
          subjectType: legacyItem.kind,
          subjectId: subjectDoc._id,
        },
        {
          listId: list._id,
          sourceMusicEntryId,
          subjectType: legacyItem.kind,
          subjectModel,
          subjectId: subjectDoc._id,
          legacyListItemId: legacyItem._id?.toString() || '',
          position: index,
          addedAt: safeDate(legacyItem.addedAt) || new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to ${MONGO_URI}`);

  if (SHOULD_RESET) {
    console.log('Resetting normalized collections...');
    await resetNormalizedCollections();
  }

  const legacyUsers = await migrateUsers();
  await migrateSocialGraph(legacyUsers);
  await migrateDiaryEntries();
  await migrateRatedAlbums(legacyUsers);
  await migrateLists();

  const summary = await Promise.all([
    UserAccount.countDocuments(),
    AuthCredential.countDocuments(),
    Artist.countDocuments(),
    Album.countDocuments(),
    Track.countDocuments(),
    MusicEntry.countDocuments(),
    Follow.countDocuments(),
    Friendship.countDocuments(),
    ActivityEvent.countDocuments(),
    ListCollection.countDocuments(),
    ListItem.countDocuments(),
  ]);

  console.log('Normalized schema migration complete.');
  console.log({
    userAccounts: summary[0],
    authCredentials: summary[1],
    artists: summary[2],
    albums: summary[3],
    tracks: summary[4],
    musicEntries: summary[5],
    follows: summary[6],
    friendships: summary[7],
    activityEvents: summary[8],
    listCollections: summary[9],
    listItems: summary[10],
  });
}

main()
  .catch((error) => {
    console.error('Normalized schema migration failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
