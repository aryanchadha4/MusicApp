import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppScreen from '../../components/native/AppScreen';
import MetricGrid from '../../components/native/MetricGrid';
import NativeAvatar from '../../components/native/NativeAvatar';
import NativeButton from '../../components/native/NativeButton';
import SectionCard from '../../components/native/SectionCard';
import StarRating from '../../components/StarRating';
import { socialClient } from '../../lib/api';
import { colors } from '../../theme/colors';
import { radii, spacing, typography } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';

function displayName(user) {
  return user?.displayName || user?.name || user?.username || user?.email || 'Listener';
}

export default function NetworkScreen() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [feed, setFeed] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [friendList, requests, feedItems] = await Promise.all([
        socialClient.getFriends(),
        socialClient.getFriendRequests(),
        socialClient.getFriendsFeed(user?.id),
      ]);

      setFriends(friendList || []);
      setIncoming(requests?.incoming || []);
      setOutgoing(requests?.outgoing || []);
      setFeed(feedItems || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load your network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      load();
    }
  }, [load, user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const users = await socialClient.searchUsers(trimmed);
      setResults(users || []);
    } catch (err) {
      setError(err.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async (targetUserId) => {
    setBusyKey(`send:${targetUserId}`);
    try {
      await socialClient.sendFriendRequest(targetUserId);
      await load();
      await runSearch();
    } finally {
      setBusyKey('');
    }
  };

  const handleAccept = async (requestId) => {
    setBusyKey(`accept:${requestId}`);
    try {
      await socialClient.acceptFriendRequest(requestId);
      await load();
      await runSearch();
    } finally {
      setBusyKey('');
    }
  };

  const handleDecline = async (requestId) => {
    setBusyKey(`decline:${requestId}`);
    try {
      await socialClient.declineFriendRequest(requestId);
      await load();
      await runSearch();
    } finally {
      setBusyKey('');
    }
  };

  const handleCancel = async (requestId) => {
    setBusyKey(`cancel:${requestId}`);
    try {
      await socialClient.cancelOutgoingFriendRequest(requestId);
      await load();
      await runSearch();
    } finally {
      setBusyKey('');
    }
  };

  const handleRemove = async (friendId) => {
    setBusyKey(`remove:${friendId}`);
    try {
      await socialClient.removeFriend(friendId);
      await load();
      await runSearch();
    } finally {
      setBusyKey('');
    }
  };

  const relationFor = (targetId) => {
    if (friends.some((friend) => String(friend.id || friend._id) === String(targetId))) {
      return { status: 'friend' };
    }
    const incomingRequest = incoming.find((request) => String(request.user?.id || request.user?._id) === String(targetId));
    if (incomingRequest) return { status: 'incoming', requestId: incomingRequest.id };
    const outgoingRequest = outgoing.find((request) => String(request.user?.id || request.user?._id) === String(targetId));
    if (outgoingRequest) return { status: 'outgoing', requestId: outgoingRequest.id };
    return { status: 'none' };
  };

  return (
    <AppScreen
      eyebrow="Friends"
      title="Network"
      subtitle="Manage requests, browse your friends, and keep a lightweight activity feed in the same native section."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      headerAccessory={<Text style={styles.headerPill}>Network</Text>}
    >
      <MetricGrid
        items={[
          { label: 'Friends', value: friends.length },
          { label: 'Incoming', value: incoming.length },
          { label: 'Outgoing', value: outgoing.length },
          { label: 'Feed', value: feed.length },
        ]}
      />

      {error ? (
        <SectionCard>
          <Text style={styles.errorText}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Search" title="Find listeners" subtitle="Search by username or email and send friend requests without leaving the tab.">
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search users…"
            placeholderTextColor={colors.foregroundMuted}
          />
          <NativeButton title="Search" onPress={runSearch} loading={searching} style={styles.searchButton} />
        </View>
        <View style={styles.column}>
          {results.map((person) => {
            const relation = relationFor(person.id || person._id);

            return (
              <View key={person.id || person._id} style={styles.personRow}>
                <NativeAvatar uri={person.profilePic} name={displayName(person)} size={44} />
                <View style={styles.personBody}>
                  <Text style={styles.personName}>{displayName(person)}</Text>
                  <Text style={styles.personHandle}>{person.username ? `@${person.username}` : person.email}</Text>
                </View>
                {relation.status === 'none' ? (
                  <NativeButton title="Add" onPress={() => handleSend(person.id || person._id)} loading={busyKey === `send:${person.id || person._id}`} style={styles.inlineButton} />
                ) : null}
                {relation.status === 'incoming' ? (
                  <View style={styles.inlineActions}>
                    <NativeButton title="Accept" onPress={() => handleAccept(relation.requestId)} loading={busyKey === `accept:${relation.requestId}`} style={styles.inlineButton} />
                    <NativeButton title="Decline" variant="secondary" onPress={() => handleDecline(relation.requestId)} loading={busyKey === `decline:${relation.requestId}`} style={styles.inlineButton} />
                  </View>
                ) : null}
                {relation.status === 'outgoing' ? (
                  <NativeButton title="Cancel" variant="secondary" onPress={() => handleCancel(relation.requestId)} loading={busyKey === `cancel:${relation.requestId}`} style={styles.inlineButton} />
                ) : null}
                {relation.status === 'friend' ? (
                  <NativeButton title="Remove" variant="danger" onPress={() => handleRemove(person.id || person._id)} loading={busyKey === `remove:${person.id || person._id}`} style={styles.inlineButton} />
                ) : null}
              </View>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard eyebrow="Requests" title="Incoming requests" subtitle="Quick actions for the people waiting on you.">
        {incoming.length ? (
          incoming.map((request) => (
            <View key={request.id} style={styles.personRow}>
              <NativeAvatar uri={request.user?.profilePic} name={displayName(request.user)} size={44} />
              <View style={styles.personBody}>
                <Text style={styles.personName}>{displayName(request.user)}</Text>
                <Text style={styles.personHandle}>{request.user?.username ? `@${request.user.username}` : request.user?.email}</Text>
              </View>
              <View style={styles.inlineActions}>
                <NativeButton title="Accept" onPress={() => handleAccept(request.id)} loading={busyKey === `accept:${request.id}`} style={styles.inlineButton} />
                <NativeButton title="Decline" variant="secondary" onPress={() => handleDecline(request.id)} loading={busyKey === `decline:${request.id}`} style={styles.inlineButton} />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No incoming requests right now.</Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Friends" title="Current friends" subtitle="Your active network in one scrollable list.">
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : friends.length ? (
          friends.map((friend) => (
            <View key={friend.id || friend._id} style={styles.personRow}>
              <NativeAvatar uri={friend.profilePic} name={displayName(friend)} size={44} />
              <View style={styles.personBody}>
                <Text style={styles.personName}>{displayName(friend)}</Text>
                <Text style={styles.personHandle}>{friend.username ? `@${friend.username}` : friend.email}</Text>
              </View>
              <NativeButton title="Remove" variant="secondary" onPress={() => handleRemove(friend.id || friend._id)} loading={busyKey === `remove:${friend.id || friend._id}`} style={styles.inlineButton} />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No friends yet. Search for people to get started.</Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Feed" title="Friend activity" subtitle="A compact native activity list for what your network is rating.">
        {feed.length ? (
          feed.slice(0, 5).map((item) => (
            <View key={item.id || `${item.userId}-${item.albumId}`} style={styles.feedCard}>
              <View style={styles.personRow}>
                <NativeAvatar uri={item.profilePic} name={item.user} size={40} />
                <View style={styles.personBody}>
                  <Text style={styles.personName}>{item.user}</Text>
                  <Text style={styles.personHandle}>
                    {item.album} · {item.artist}
                  </Text>
                </View>
                <StarRating value={item.rating} disabled size={16} />
              </View>
              {item.review ? <Text style={styles.feedReview}>{item.review}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Your feed will fill up once your friends start logging reviews.</Text>
        )}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerPill: {
    minWidth: 82,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(82, 121, 111, 0.16)',
    color: colors.accent,
    fontWeight: '700',
    overflow: 'hidden',
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    ...typography.body,
  },
  searchRow: {
    gap: spacing.md,
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.lg,
    color: colors.foreground,
    fontSize: 15,
  },
  searchButton: {
    width: '100%',
  },
  column: {
    gap: spacing.md,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personBody: {
    flex: 1,
    gap: 2,
  },
  personName: {
    ...typography.cardTitle,
  },
  personHandle: {
    ...typography.muted,
  },
  inlineActions: {
    gap: spacing.sm,
  },
  inlineButton: {
    minWidth: 82,
  },
  emptyText: {
    ...typography.muted,
  },
  feedCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(202, 210, 197, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.18)',
  },
  feedReview: {
    ...typography.body,
    fontStyle: 'italic',
  },
});
