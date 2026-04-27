import React from 'react';
import { StackScreen } from './lib/platform/web/app';
import { Avatar, Button, Card, Field, Modal, TextField } from './lib/platform/web/ui';
import { useEditProfileForm } from './features/profile/useEditProfileForm';

const EditProfile = ({ profileInfo, setProfileInfo, backTo = '/profile' }) => {
  const {
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
  } = useEditProfileForm({ profileInfo, setProfileInfo });

  return (
    <StackScreen
      backTo={backTo}
      eyebrow="You"
      title="Edit profile"
      subtitle="Update your identity details and favorites from a dedicated profile settings screen."
    >
      <Card className="ui-form-card" style={{ maxWidth: 500, margin: '0 auto' }}>
      <form onSubmit={submitProfile} autoComplete="off">
        <div className="ui-profile-preview">
          <Field label="Profile picture">
            <div className="ui-profile-preview__body">
              <Avatar src={profilePicPreview} name={name || 'Profile preview'} size="lg" />
              <input type="file" accept="image/*" onChange={handleProfilePicChange} style={{ marginTop: 8 }} />
            </div>
          </Field>
          {profilePicError && <div style={{ color: '#ff7f7f', marginBottom: 8 }}>{profilePicError}</div>}
        </div>
        <div style={{ marginBottom: '1em' }}>
          <TextField label="Name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div style={{ marginBottom: '1em' }}>
          <Field label="5 Favorite Artists">
          {artists.map((artist, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <TextField
                type="text"
                value={artist.name}
                onChange={e => handleArtistChange(idx, e.target.value)}
                placeholder={`Artist #${idx + 1}`}
                style={{ marginBottom: 6, width: '90%' }}
                autoComplete="off"
              />
              {artistSuggestions[idx] && artistSuggestions[idx].length > 0 && (
                <ul style={{ position: 'absolute', left: 0, top: 36, background: '#23263a', color: '#fff', border: '1px solid #7fd7ff', borderRadius: 8, zIndex: 10, width: '90%', maxHeight: 120, overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0 }}>
                  {artistSuggestions[idx].map(sug => (
                    <li key={sug.id} style={{ padding: 6, cursor: 'pointer' }} onClick={() => handleArtistSuggestion(idx, sug)}>
                      {sug.images && sug.images[0] && <img src={sug.images[0].url} alt={sug.name} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8, verticalAlign: 'middle' }} />}
                      {sug.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          </Field>
        </div>
        <div style={{ marginBottom: '1em' }}>
          <Field label="5 Favorite Songs (with Artist)">
          {songs.map((song, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, position: 'relative' }}>
              <TextField
                type="text"
                value={song.title}
                onChange={e => handleSongTitleChange(idx, e.target.value)}
                placeholder={`Song #${idx + 1}`}
                style={{ width: '55%' }}
                autoComplete="off"
              />
              <TextField
                type="text"
                value={song.artist}
                onChange={e => handleSongArtistChange(idx, e.target.value)}
                placeholder="Artist"
                style={{ width: '35%' }}
                autoComplete="off"
              />
              {songSuggestions[idx] && songSuggestions[idx].length > 0 && (
                <ul style={{ position: 'absolute', left: 0, top: 36, background: '#23263a', color: '#fff', border: '1px solid #7fd7ff', borderRadius: 8, zIndex: 10, width: '90%', maxHeight: 120, overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0 }}>
                  {songSuggestions[idx].map(sug => (
                    <li key={sug.id} style={{ padding: 6, cursor: 'pointer' }} onClick={() => handleSongSuggestion(idx, sug)}>
                      {sug.album && sug.album.images && sug.album.images[0] && <img src={sug.album.images[0].url} alt={sug.name} style={{ width: 24, height: 24, borderRadius: 8, marginRight: 8, verticalAlign: 'middle' }} />}
                      {sug.name} <span style={{ color: '#aaa', fontSize: 13 }}>by {sug.artists[0]?.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          </Field>
        </div>
        {error && <div style={{ color: '#ff7f7f', marginBottom: '1em' }}>{error}</div>}
        {success && <div style={{ color: '#7fd7ff', marginBottom: '1em' }}>{success}</div>}
        <div className="ui-form-actions">
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={() => setShowChangeModal(true)}>Change Password / Email</Button>
        </div>
      </form>
      <Modal
        open={showChangeModal}
        onClose={resetCredentialModal}
        presentation="sheet"
        eyebrow="Account"
        title="Change password or email"
        description="Keep account details secure with the same form and action patterns used across the app."
      >
        <TextField type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        <TextField type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <TextField type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        <TextField type="email" placeholder="New Email (optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
        {changeError && <div style={{ color: '#ff7f7f', fontSize: 14 }}>{changeError}</div>}
        {changeSuccess && <div style={{ color: '#7fd7ff', fontSize: 14 }}>{changeSuccess}</div>}
        <div className="ui-form-actions">
          <Button type="button" onClick={submitCredentials}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={resetCredentialModal}>Cancel</Button>
        </div>
      </Modal>
      </Card>
    </StackScreen>
  );
};

export default EditProfile; 
