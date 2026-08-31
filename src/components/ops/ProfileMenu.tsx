'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import { AVATAR_MAX_CHARS, initialsFrom } from '@/lib/profile-shared';

const MAX_SIDE = 128;

async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Picture must be a JPEG, PNG, or WebP image.');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not read that image.');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  for (const quality of [0.82, 0.62, 0.42]) {
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= AVATAR_MAX_CHARS) {
      return url;
    }
  }
  throw new Error('Picture is too large. Use a smaller image.');
}

export default function ProfileMenu({ onSignOut }: { onSignOut: () => void }) {
  const { user, updateProfile } = useAuth();
  const { t } = usePrefs();
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const initials = initialsFrom(user.name || '', user.email);
  const avatar = user.avatar || null;

  const save = async (payload: { name?: string; avatar?: string | null }) => {
    setBusy(true);
    setNote('');
    setError('');
    try {
      await updateProfile(payload);
      setNote(t.profile.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.profile.failed);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await save({ avatar: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.profile.failed);
    }
  };

  return (
    <div className="profile-wrap" ref={wrapRef}>
      <button
        type="button"
        className="profile-btn"
        aria-label={t.profile.menu}
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => {
          setOpen((value) => !value);
          setNote('');
          setError('');
        }}
      >
        {avatar ? <img src={avatar} alt="" /> : initials}
      </button>
      {open && (
        <div
          id="profile-menu"
          className="profile-menu"
          role="dialog"
          aria-label={t.profile.title}
        >
          <div className="profile-face">
            {avatar ? (
              <img src={avatar} alt="" />
            ) : (
              <span className="profile-initials" aria-hidden="true">{initials}</span>
            )}
            <div>
              <strong>{user.name || t.profile.title}</strong>
              <p className="profile-email">{user.email}</p>
            </div>
          </div>
          <p className="cardlead">{t.profile.pictureHint}</p>
          <div className="profile-actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {t.profile.changePicture}
            </button>
            {avatar ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => save({ avatar: null })}
              >
                {t.profile.removePicture}
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onFile}
          />
          <label>
            {t.profile.name}
            <input
              type="text"
              value={name}
              maxLength={80}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="primary"
            disabled={busy || !name.trim() || name.trim() === (user.name || '')}
            onClick={() => save({ name: name.trim() })}
          >
            {t.profile.save}
          </button>
          {note ? <p className="profile-note">{note}</p> : null}
          {error ? <p className="profile-error">{error}</p> : null}
          <button type="button" className="textlink profile-out" onClick={onSignOut}>
            {t.nav.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
