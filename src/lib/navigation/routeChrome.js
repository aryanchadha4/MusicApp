import { APP_TABS, normalizeSectionKey } from './appTabs';

const TAB_LOOKUP = Object.fromEntries(APP_TABS.map((tab) => [tab.key, tab]));

function getTabMeta(section) {
  return TAB_LOOKUP[normalizeSectionKey(section)] || TAB_LOOKUP.home;
}

export function getRouteChrome(pathname = '/') {
  const segments = String(pathname || '/')
    .split('/')
    .filter(Boolean);

  const section = normalizeSectionKey(segments[0] || 'home');
  const tab = getTabMeta(section);

  if (segments.length === 0) {
    return {
      eyebrow: tab.hint,
      title: tab.label,
      subtitle: 'Move through your music diary with persistent tabs and mobile-style navigation.',
    };
  }

  if (segments[1] === 'album') {
    return {
      eyebrow: 'Album',
      title: 'Album Detail',
      subtitle: 'Ratings, reviews, and related navigation stay anchored inside the same stack.',
    };
  }

  if (segments[1] === 'artist') {
    return {
      eyebrow: 'Artist',
      title: 'Artist Detail',
      subtitle: 'Albums, featured appearances, and review actions live in one native-style flow.',
    };
  }

  if (segments[1] === 'users' && segments[3] === 'reviews') {
    return {
      eyebrow: 'Reviews',
      title: 'User Reviews',
      subtitle: 'Review history stays in-context without breaking out of the current section.',
    };
  }

  if (segments[1] === 'users') {
    return {
      eyebrow: 'Profile',
      title: 'Listener Profile',
      subtitle: 'Public profile details stay nested under the section you came from.',
    };
  }

  if (section === 'activity' && segments[1] === 'diary') {
    return {
      eyebrow: 'Library',
      title: 'Diary',
      subtitle: 'Log albums and tracks, then jump back into your activity stack without losing context.',
    };
  }

  if (section === 'activity' && segments[1] === 'lists') {
    return {
      eyebrow: 'Library',
      title: 'Lists',
      subtitle: 'Curate collection views with the same shell and navigation rhythm as the rest of the app.',
    };
  }

  if (section === 'profile' && segments[1] === 'edit') {
    return {
      eyebrow: 'You',
      title: 'Edit Profile',
      subtitle: 'Account settings and favorites stay inside a dedicated profile stack.',
    };
  }

  if (section === 'profile' && segments[1] === 'reviews') {
    return {
      eyebrow: 'Reviews',
      title: 'My Reviews',
      subtitle: 'Your ratings stay in one consistent detail flow with edit and delete actions nearby.',
    };
  }

  if (section === 'profile' && segments[1] === 'friends') {
    return {
      eyebrow: 'Network',
      title: 'Friends',
      subtitle: 'Friend connections stay close to your profile tools in a compact mobile directory.',
    };
  }

  return {
    eyebrow: tab.hint,
    title: tab.label,
    subtitle: `Navigate ${tab.label.toLowerCase()} with a persistent tab shell and consistent section structure.`,
  };
}
