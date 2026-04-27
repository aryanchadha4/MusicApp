import { useEffect } from 'react';
import { ReadOnlyStarRow } from './components/HalfStarRating';
import { useNetworkController } from './features/social/useNetworkController';
import { ScreenMetrics, ScreenShell } from './lib/platform/web/app';
import { Avatar, Button, ListItem, Skeleton, TextField } from './lib/platform/web/ui';

function formatTimestamp(value) {
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getDisplayName(user) {
  return user?.displayName || user?.name || user?.username || user?.email || 'Listener';
}

function getUserHandle(user) {
  return user?.username ? `@${user.username}` : '';
}

function relationshipLabel(rel) {
  const status = rel?.status;
  if (status === 'friend') return 'Friends';
  if (status === 'incoming_request') return 'Sent you a request';
  if (status === 'outgoing_request') return 'Request sent';
  return '';
}

function NetworkSection({ title, subtitle, count, actions = null, children }) {
  return (
    <section className="mobile-section-card network-section">
      <div className="network-section__header">
        <div>
          <h2 className="network-section__title">{title}</h2>
          {subtitle ? <p className="network-section__subtitle">{subtitle}</p> : null}
        </div>
        <div className="network-section__meta">
          {typeof count === 'number' ? <span className="network-count-pill">{count}</span> : null}
          {actions}
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return <p className="network-empty">{children}</p>;
}

function SearchResultRow({
  user,
  busyKey,
  onSendRequest,
  onAccept,
  onDecline,
  onCancel,
  setError,
}) {
  const id = String(user?.id || user?._id || '').trim();
  const relationship = user?.relationship || { status: 'none' };
  const label = relationshipLabel(relationship);

  return (
    <ListItem
      className="network-item"
      leading={<Avatar src={user?.profilePic || user?.avatarUrl || ''} name={getDisplayName(user)} />}
      title={getDisplayName(user)}
      subtitle={getUserHandle(user) || null}
      meta={label || null}
      trailing={
        <div className="network-actions">
          {relationship.status === 'none' ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={busyKey === `add:${id}`}
              disabled={!id || busyKey === `add:${id}`}
              onClick={() => {
                setError('');
                onSendRequest(id);
              }}
            >
              Add Friend
            </Button>
          ) : null}

          {relationship.status === 'outgoing_request' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={busyKey === `cancel:${relationship.requestId}`}
              disabled={!relationship.requestId || busyKey === `cancel:${relationship.requestId}`}
              onClick={() => onCancel(relationship.requestId)}
            >
              Cancel
            </Button>
          ) : null}

          {relationship.status === 'incoming_request' ? (
            <>
              <Button
                type="button"
                size="sm"
                loading={busyKey === `accept:${relationship.requestId}`}
                disabled={!relationship.requestId || busyKey === `accept:${relationship.requestId}`}
                onClick={() => onAccept(relationship.requestId)}
              >
                Accept
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={busyKey === `decline:${relationship.requestId}`}
                disabled={!relationship.requestId || busyKey === `decline:${relationship.requestId}`}
                onClick={() => onDecline(relationship.requestId)}
              >
                Decline
              </Button>
            </>
          ) : null}
        </div>
      }
    />
  );
}

function RequestRow({ request, type, busyKey, onAccept, onDecline, onCancel }) {
  const user = request?.user || {};

  return (
    <ListItem
      className="network-item"
      leading={<Avatar src={user?.profilePic || user?.avatarUrl || ''} name={getDisplayName(user)} />}
      title={getDisplayName(user)}
      subtitle={getUserHandle(user) || null}
      meta={request?.createdAt ? `${type === 'incoming' ? 'Received' : 'Sent'} ${formatTimestamp(request.createdAt)}` : null}
      trailing={
        <div className="network-actions">
          {type === 'incoming' ? (
            <>
              <Button type="button" size="sm" loading={busyKey === `accept:${request.id}`} disabled={busyKey === `accept:${request.id}`} onClick={() => onAccept(request.id)}>
                Accept
              </Button>
              <Button type="button" variant="ghost" size="sm" loading={busyKey === `decline:${request.id}`} disabled={busyKey === `decline:${request.id}`} onClick={() => onDecline(request.id)}>
                Decline
              </Button>
            </>
          ) : null}

          {type === 'outgoing' ? (
            <Button type="button" variant="ghost" size="sm" loading={busyKey === `cancel:${request.id}`} disabled={busyKey === `cancel:${request.id}`} onClick={() => onCancel(request.id)}>
              Cancel
            </Button>
          ) : null}
        </div>
      }
    />
  );
}

function FriendRow({ user, busyKey, onRemoveFriend }) {
  const friendId = String(user?.id || user?._id || '').trim();

  return (
    <ListItem
      className="network-item"
      leading={<Avatar src={user?.profilePic || user?.avatarUrl || ''} name={getDisplayName(user)} />}
      title={getDisplayName(user)}
      subtitle={getUserHandle(user) || null}
      meta={user?.relationship?.since ? `Friends since ${formatTimestamp(user.relationship.since)}` : null}
      trailing={
        <div className="network-actions">
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={busyKey === `remove:${friendId}`}
            disabled={!friendId || busyKey === `remove:${friendId}`}
            onClick={() => {
              if (!window.confirm(`Remove ${getDisplayName(user)} from your friends list?`)) return;
              onRemoveFriend(friendId);
            }}
          >
            Remove
          </Button>
        </div>
      }
    />
  );
}

function FeedRow({ item }) {
  return (
    <ListItem
      className="network-feed-item"
      leading={<Avatar src={item?.actor?.profilePic || item?.actor?.avatarUrl || ''} name={item?.user || 'Listener'} size="sm" />}
      title={item?.album || 'Music'}
      subtitle={item?.artist || null}
      meta={formatTimestamp(item?.reviewedAt)}
      trailing={
        item?.image ? (
          <img
            src={item.image}
            alt={item.album ? `${item.album} cover` : 'Logged music cover'}
            className="network-feed-thumb"
            width={68}
            height={68}
            loading="lazy"
          />
        ) : null
      }
    >
      <div className="network-feed-item__rating">
        <ReadOnlyStarRow value={item?.rating || 0} size={18} />
      </div>
      {item?.review ? <p className="network-feed-review">{item.review}</p> : null}
    </ListItem>
  );
}

export default function Network({ user }) {
  const {
    friends,
    incoming,
    outgoing,
    feed,
    loading,
    error,
    setError,
    searchQuery,
    searchResults,
    searchLoading,
    searchError,
    busyKey,
    refresh,
    runSearch,
    acceptIncoming,
    declineIncoming,
    cancelOutgoing,
    removeFriend,
    sendRequest,
  } = useNetworkController(user);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSearchSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    runSearch(formData.get('q') || '');
  };

  return (
    <ScreenShell
      eyebrow="Community"
      title="Network"
      subtitle="Manage requests, keep friendships close, and browse a lightweight feed that already maps cleanly to a future mobile screen stack."
      actions={
        <Button
          type="button"
          variant="secondary"
          loading={loading}
          onClick={() => refresh()}
          disabled={loading}
        >
          Refresh
        </Button>
      }
      className="network-page"
    >
      <ScreenMetrics
        items={[
          { label: 'Friends', value: friends.length },
          { label: 'Incoming', value: incoming.length },
          { label: 'Outgoing', value: outgoing.length },
          { label: 'Feed', value: feed.length },
        ]}
      />

      <div className="search-form screen-shell__stack">
        {error ? (
          <p className="network-banner network-banner--error" role="alert">
            {error}
          </p>
        ) : null}

        {!user?.id && !loading ? (
          <section className="mobile-section-card network-section">
            <EmptyState>Sign in to view your friends, requests, and activity feed.</EmptyState>
          </section>
        ) : null}

        {user?.id ? (
          <>
          <NetworkSection
            title="Current friends"
            subtitle="People already in your circle."
            count={friends.length}
          >
            {loading ? (
              <div className="ui-loading-stack">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="ui-loading-row">
                    <Skeleton variant="avatar" />
                    <div className="ui-loading-row__body">
                      <Skeleton style={{ width: '42%' }} />
                      <Skeleton style={{ width: '58%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <EmptyState>You have not added friends yet.</EmptyState>
            ) : (
              <ul className="network-list">
                {friends.map((friend) => (
                  <FriendRow
                    key={String(friend?.id || friend?._id || friend?.email || '')}
                    user={friend}
                    busyKey={busyKey}
                    onRemoveFriend={removeFriend}
                  />
                ))}
              </ul>
            )}
          </NetworkSection>

          <NetworkSection
            title="Incoming requests"
            subtitle="People waiting for your response."
            count={incoming.length}
          >
            {loading ? (
              <div className="ui-loading-inline">
                <Skeleton variant="avatar" />
                Checking for requests…
              </div>
            ) : incoming.length === 0 ? (
              <EmptyState>No pending requests right now.</EmptyState>
            ) : (
              <ul className="network-list">
                {incoming.map((request) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    type="incoming"
                    busyKey={busyKey}
                    onAccept={acceptIncoming}
                    onDecline={declineIncoming}
                    onCancel={cancelOutgoing}
                  />
                ))}
              </ul>
            )}
          </NetworkSection>

          <NetworkSection
            title="Outgoing requests"
            subtitle="Invites you have already sent."
            count={outgoing.length}
          >
            {loading ? (
              <div className="ui-loading-inline">
                <Skeleton variant="avatar" />
                Loading sent requests…
              </div>
            ) : outgoing.length === 0 ? (
              <EmptyState>No outgoing requests at the moment.</EmptyState>
            ) : (
              <ul className="network-list">
                {outgoing.map((request) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    type="outgoing"
                    busyKey={busyKey}
                    onAccept={acceptIncoming}
                    onDecline={declineIncoming}
                    onCancel={cancelOutgoing}
                  />
                ))}
              </ul>
            )}
          </NetworkSection>

          <NetworkSection
            title="Search users"
            subtitle="Look up friends by name, username, or email."
            count={searchResults.length}
          >
            <form className="network-searchbar" onSubmit={onSearchSubmit}>
              <TextField
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by name or username…"
                autoComplete="off"
              />
              <Button type="submit" className="network-searchbar__button" size="sm" loading={searchLoading} disabled={searchLoading}>
                Search
              </Button>
            </form>

            {searchError ? <p className="network-banner network-banner--error">{searchError}</p> : null}

            {searchQuery && !searchLoading && searchResults.length === 0 && !searchError ? (
              <EmptyState>No users match that search.</EmptyState>
            ) : null}

            {searchLoading ? (
              <div className="ui-loading-stack">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="ui-loading-row">
                    <Skeleton variant="avatar" />
                    <div className="ui-loading-row__body">
                      <Skeleton style={{ width: '44%' }} />
                      <Skeleton style={{ width: '62%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {searchResults.length > 0 && !searchLoading ? (
              <ul className="network-list">
                {searchResults.map((result) => (
                  <SearchResultRow
                    key={String(result?.id || result?._id || result?.email || '')}
                    user={result}
                    busyKey={busyKey}
                    onSendRequest={sendRequest}
                    onAccept={acceptIncoming}
                    onDecline={declineIncoming}
                    onCancel={cancelOutgoing}
                    setError={setError}
                  />
                ))}
              </ul>
            ) : null}
          </NetworkSection>

          <NetworkSection
            title="Friend activity"
            subtitle="A lightweight feed of recent logs from your friends."
            count={feed.length}
          >
            {loading ? (
              <div className="ui-loading-stack">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="ui-loading-row">
                    <Skeleton variant="avatar" />
                    <div className="ui-loading-row__body">
                      <Skeleton style={{ width: '46%' }} />
                      <Skeleton style={{ width: '68%' }} />
                      <Skeleton style={{ width: '78%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : feed.length === 0 ? (
              <EmptyState>When friends log music, it will show up here.</EmptyState>
            ) : (
              <ul className="network-list network-list--feed">
                {feed.map((item) => (
                  <FeedRow key={String(item?.id || `${item?.user}-${item?.reviewedAt}`)} item={item} />
                ))}
              </ul>
            )}
          </NetworkSection>
          </>
        ) : null}
      </div>
    </ScreenShell>
  );
}
