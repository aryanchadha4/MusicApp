import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScreenMetrics, ScreenShell } from './lib/platform/web/app';
import { Button, ListItem, Skeleton, TextField } from './lib/platform/web/ui';
import { spotifyClient } from './lib/api';
import { buildAlbumPath, buildArtistPath } from './lib/navigation/appTabs';

function getSubtitle(item, type) {
  if (type === 'artist') {
    return item.genres?.slice(0, 2).join(', ') || 'Artist';
  }
  if (type === 'track') {
    return [item.album?.name, item.artists?.map((artist) => artist.name).join(', ')].filter(Boolean).join(' · ');
  }
  return item.artists?.map((artist) => artist.name).join(', ') || 'Album';
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('album');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setLoading(true);
    setError('');
    try {
      const items = await spotifyClient.searchItems(trimmedQuery, type);
      setResults(Array.isArray(items) ? items : []);
    } catch (searchError) {
      setResults([]);
      setError(searchError.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      eyebrow="Discover"
      title="Search"
      actions={
        <Button to="/activity/diary" variant="primary">
          Open diary
        </Button>
      }
    >
      <ScreenMetrics
        items={[
          { label: 'Mode', value: type },
          { label: 'Results', value: results.length },
        ]}
      />

      <section className="mobile-section-card">
        <form onSubmit={runSearch} className="search-form search-form--stacked">
          <div className="diary-toolbar">
            {['album', 'artist', 'track'].map((option) => (
              <button
                key={option}
                type="button"
                className={`diary-toolbar-btn${type === option ? ' diary-toolbar-btn--active' : ''}`}
                onClick={() => setType(option)}
              >
                {option === 'album' ? 'Albums' : option === 'artist' ? 'Artists' : 'Tracks'}
              </button>
            ))}
          </div>
          <TextField
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={type === 'artist' ? 'Search for an artist…' : type === 'track' ? 'Search for a song…' : 'Search for an album…'}
          />
          <Button type="submit" variant="primary" loading={loading}>
            Search
          </Button>
        </form>
        {error ? <p className="mobile-section-error">{error}</p> : null}
        {loading ? (
          <div className="ui-loading-stack">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="ui-loading-row">
                <Skeleton variant="block" style={{ width: '3rem', height: '3rem', borderRadius: '14px' }} />
                <div className="ui-loading-row__body">
                  <Skeleton style={{ width: '48%' }} />
                  <Skeleton style={{ width: '72%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !error && results.length === 0 ? (
          <p className="mobile-section-empty">Search results will appear here after you run a query.</p>
        ) : null}
        {!loading && results.length > 0 ? (
          <div className="mobile-section-list">
            {results.map((item) => {
              const image =
                type === 'artist'
                  ? item.images?.[0]?.url
                  : type === 'track'
                    ? item.album?.images?.[0]?.url
                    : item.images?.[0]?.url;
              const subtitle = getSubtitle(item, type);
              const primaryLink =
                type === 'artist'
                  ? buildArtistPath('search', item.id)
                  : type === 'track'
                    ? item.album?.id
                      ? buildAlbumPath('search', item.album.id)
                      : null
                    : buildAlbumPath('search', item.id);

              return (
                <ListItem
                  key={item.id}
                  interactive={false}
                  leading={image ? <img src={image} alt="" className="mobile-list-row__image" /> : null}
                  title={
                    primaryLink ? (
                      <Link to={primaryLink} className="mobile-list-row__title">
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )
                  }
                  subtitle={subtitle}
                  trailing={
                    type === 'track' && item.artists?.[0]?.id ? (
                      <Button to={buildArtistPath('search', item.artists[0].id)} variant="ghost" size="sm">
                        Artist
                      </Button>
                    ) : null
                  }
                />
              );
            })}
          </div>
        ) : null}
      </section>
    </ScreenShell>
  );
}
