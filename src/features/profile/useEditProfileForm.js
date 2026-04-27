import { useEffect, useMemo, useState } from 'react';
import { normalizeFavoriteArtists, normalizeFavoriteSongs } from '../../domain/models';
import { profileClient, spotifyClient } from '../../lib/api';

const EMPTY_SUGGESTIONS = [[], [], [], [], []];

export function useEditProfileForm({ profileInfo, setProfileInfo }) {
  const [name, setName] = useState('');
  const [artists, setArtists] = useState(normalizeFavoriteArtists());
  const [songs, setSongs] = useState(normalizeFavoriteSongs());
  const [artistSuggestions, setArtistSuggestions] = useState(EMPTY_SUGGESTIONS);
  const [songSuggestions, setSongSuggestions] = useState(EMPTY_SUGGESTIONS);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState('');
  const [profilePicPreview, setProfilePicPreview] = useState('/default-avatar.jpeg');
  const [profilePicError, setProfilePicError] = useState('');
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  useEffect(() => {
    setName(profileInfo?.name || '');
    setArtists(normalizeFavoriteArtists(profileInfo?.favoriteArtists));
    setSongs(normalizeFavoriteSongs(profileInfo?.favoriteSongs));
    setProfilePic(profileInfo?.profilePic || '');
    setProfilePicPreview(profileInfo?.profilePic || '/default-avatar.jpeg');
    setArtistSuggestions(EMPTY_SUGGESTIONS);
    setSongSuggestions(EMPTY_SUGGESTIONS);
  }, [profileInfo]);

  const profileEmail = useMemo(() => profileInfo?.email || '', [profileInfo?.email]);

  const handleArtistChange = async (idx, value) => {
    const updated = [...artists];
    updated[idx] = { name: value, id: '' };
    setArtists(updated);

    if (value.trim()) {
      const suggestions = await spotifyClient.searchItems(value, 'artist');
      setArtistSuggestions((current) => current.map((item, index) => (index === idx ? suggestions : item)));
      return;
    }

    setArtistSuggestions((current) => current.map((item, index) => (index === idx ? [] : item)));
  };

  const handleArtistSuggestion = (idx, suggestion) => {
    const updated = [...artists];
    updated[idx] = { name: suggestion.name, id: suggestion.id };
    setArtists(updated);
    setArtistSuggestions((current) => current.map((item, index) => (index === idx ? [] : item)));
  };

  const handleSongTitleChange = async (idx, value) => {
    const updated = [...songs];
    updated[idx] = { ...updated[idx], title: value };
    setSongs(updated);

    if (value.trim()) {
      const suggestions = await spotifyClient.searchItems(`${value} ${updated[idx].artist || ''}`.trim(), 'track');
      setSongSuggestions((current) => current.map((item, index) => (index === idx ? suggestions : item)));
      return;
    }

    setSongSuggestions((current) => current.map((item, index) => (index === idx ? [] : item)));
  };

  const handleSongArtistChange = async (idx, value) => {
    const updated = [...songs];
    updated[idx] = { ...updated[idx], artist: value };
    setSongs(updated);

    if (updated[idx].title.trim()) {
      const suggestions = await spotifyClient.searchItems(`${updated[idx].title} ${value}`.trim(), 'track');
      setSongSuggestions((current) => current.map((item, index) => (index === idx ? suggestions : item)));
      return;
    }

    setSongSuggestions((current) => current.map((item, index) => (index === idx ? [] : item)));
  };

  const handleSongSuggestion = (idx, suggestion) => {
    const updated = [...songs];
    updated[idx] = {
      title: suggestion.name,
      artist: suggestion.artists?.[0]?.name || '',
      artistId: suggestion.artists?.[0]?.id || '',
    };
    setSongs(updated);
    setSongSuggestions((current) => current.map((item, index) => (index === idx ? [] : item)));
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfilePicError('Image is too large (max 2MB). Please choose a smaller file.');
      return;
    }

    setProfilePicError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProfilePic(dataUrl);
        setProfilePicPreview(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return false;
    }

    if (artists.some((artist) => !artist.name.trim()) || songs.some((song) => !song.title.trim() || !song.artist.trim())) {
      setError('Please fill in all favorite artists and songs (with artist).');
      return false;
    }

    setLoading(true);
    try {
      await profileClient.updateProfile({
        email: profileEmail,
        name,
        favoriteArtists: artists,
        favoriteSongs: songs,
        profilePic,
      });

      const refreshed = await profileClient.getProfileByEmail(profileEmail);
      setProfileInfo(refreshed);
      setSuccess('Profile updated!');
      return true;
    } catch (err) {
      setError(err.message || 'Update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitCredentials = async () => {
    setChangeError('');
    setChangeSuccess('');

    if (!currentPassword) {
      setChangeError('Enter current password.');
      return false;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setChangeError('Passwords do not match.');
      return false;
    }
    if (!newPassword && !newEmail) {
      setChangeError('Enter a new password or email.');
      return false;
    }

    try {
      await profileClient.changeCredentials({
        email: profileEmail,
        currentPassword,
        newPassword,
        newEmail,
      });

      const refreshed = await profileClient.getProfileByEmail(newEmail || profileEmail);
      setProfileInfo(refreshed);
      setChangeSuccess('Credentials updated successfully!');
      return true;
    } catch (err) {
      setChangeError(err.message || 'Update failed.');
      return false;
    }
  };

  const resetCredentialModal = () => {
    setShowChangeModal(false);
    setChangeError('');
    setChangeSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewEmail('');
  };

  return {
    name,
    setName,
    artists,
    songs,
    artistSuggestions,
    songSuggestions,
    error,
    success,
    loading,
    profilePicPreview,
    profilePicError,
    showChangeModal,
    setShowChangeModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    newEmail,
    setNewEmail,
    changeError,
    changeSuccess,
    handleArtistChange,
    handleArtistSuggestion,
    handleSongTitleChange,
    handleSongArtistChange,
    handleSongSuggestion,
    handleProfilePicChange,
    submitProfile,
    submitCredentials,
    resetCredentialModal,
  };
}
