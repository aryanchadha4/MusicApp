import { useCallback, useEffect, useMemo, useState } from 'react';
import { sortReviewsByDate } from '../../domain/models';
import { socialClient } from '../../lib/api';
import { useFavoriteMediaImages } from '../profile/useFavoriteMediaImages';
import { useProfileResource } from '../profile/useProfileResource';

export function usePublicProfileController({ profileId, user, onProfileChange }) {
  const { profile, loading, error, reload } = useProfileResource({ id: profileId, enabled: Boolean(profileId) });
  const [relationshipStatus, setRelationshipStatus] = useState('none');
  const [followLoading, setFollowLoading] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const reviewsPerView = 3;
  const networkTargetId = profile?.accountId || profileId;

  const ratings = useMemo(() => sortReviewsByDate(profile?.ratedAlbums || []), [profile?.ratedAlbums]);
  const visibleRatings = ratings.slice(carouselIdx, carouselIdx + reviewsPerView);
  const { artistImages, songImages } = useFavoriteMediaImages({
    favoriteArtists: profile?.favoriteArtists || [],
    favoriteSongs: profile?.favoriteSongs || [],
  });

  useEffect(() => {
    let active = true;

    const loadRelationship = async () => {
      if (!networkTargetId || !user?.id || user.id === profileId) {
        if (active) setRelationshipStatus('self');
        return;
      }

      try {
        const relationship = await socialClient.getRelationshipState(networkTargetId);
        if (active) {
          setRelationshipStatus(relationship?.status || 'none');
        }
      } catch {
        if (active) {
          setRelationshipStatus('none');
        }
      }
    };

    loadRelationship();

    return () => {
      active = false;
    };
  }, [networkTargetId, profileId, user]);

  const follow = useCallback(async () => {
    if (!user?.id || !networkTargetId) return false;
    setFollowLoading(true);
    try {
      const nextState = await socialClient.followUser(user.id, networkTargetId);
      setRelationshipStatus(nextState?.status || 'none');
      return true;
    } finally {
      setFollowLoading(false);
    }
  }, [networkTargetId, user]);

  const unfollow = useCallback(async () => {
    if (!user?.id || !networkTargetId) return false;
    setFollowLoading(true);
    try {
      const nextState = await socialClient.unfollowUser(user.id, networkTargetId);
      setRelationshipStatus(nextState?.status || 'none');
      return true;
    } finally {
      setFollowLoading(false);
    }
  }, [networkTargetId, user]);

  const actionLabel = useMemo(() => {
    switch (relationshipStatus) {
      case 'friend':
        return 'Friends';
      case 'outgoing_request':
        return 'Request Sent';
      case 'incoming_request':
        return 'Accept Request';
      default:
        return 'Add Friend';
    }
  }, [relationshipStatus]);

  const actionMode = relationshipStatus === 'friend' || relationshipStatus === 'outgoing_request' ? 'active' : 'idle';

  const showPreviousReviews = useCallback(() => {
    setCarouselIdx((current) => Math.max(0, current - 1));
  }, []);

  const showNextReviews = useCallback(() => {
    setCarouselIdx((current) => Math.min((ratings.length - reviewsPerView), current + 1));
  }, [ratings.length]);

  return {
    profile,
    loading,
    error,
    relationshipStatus,
    isFollowing: relationshipStatus === 'friend',
    followLoading,
    follow,
    unfollow,
    actionLabel,
    actionMode,
    artistImages,
    songImages,
    ratings,
    visibleRatings,
    carouselIdx,
    showPreviousReviews,
    showNextReviews,
    reviewsPerView,
  };
}
