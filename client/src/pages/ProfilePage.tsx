import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import SalonLoading from '../components/SalonLoading'

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<{ elo: number; games_played: number; games_won: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!user) return
    ;(supabase.from('profiles') as any)
      .select('display_name, avatar_url, elo, games_played, games_won')
      .eq('id', user.id).single()
      .then(({ data }: { data: any }) => {
        if (data) {
          setDisplayName(data.display_name ?? '')
          setAvatarUrl(data.avatar_url ?? null)
          setStats({ elo: data.elo ?? 1000, games_played: data.games_played ?? 0, games_won: data.games_won ?? 0 })
        }
        setLoading(false)
      })
  }, [user])

  const uploadAvatar = async (file: File) => {
    if (!user) return
    setUploading(true); setMessage(null)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) { setMessage({ text: `Upload échoué : ${upErr.message}`, ok: false }); return }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`
      const { error: dbErr } = await (supabase.from('profiles') as any).update({ avatar_url: url }).eq('id', user.id)
      if (dbErr) { setMessage({ text: `Sauvegarde échouée : ${dbErr.message}`, ok: false }); return }
      setAvatarUrl(url)
      setMessage({ text: 'Photo mise à jour !', ok: true })
    } catch (e) {
      setMessage({ text: `Erreur : ${e instanceof Error ? e.message : String(e)}`, ok: false })
    } finally { setUploading(false) }
  }

  const saveProfile = async () => {
    if (!user) return
    setSaving(true); setMessage(null)
    const { error } = await (supabase.from('profiles') as any).update({ display_name: displayName }).eq('id', user.id)
    setSaving(false)
    setMessage(error ? { text: error.message, ok: false } : { text: 'Profil enregistré !', ok: true })
  }

  if (loading) return <SalonLoading label="Ouverture du profil" />

  const winRate = stats && stats.games_played > 0 ? Math.round((stats.games_won / stats.games_played) * 100) : 0

  return (
    <div className="salon-root" style={{ minHeight: '100vh' }}>
      <div className="salon-ornament tl" /><div className="salon-ornament tr" />
      <div className="salon-ornament bl" /><div className="salon-ornament br" />

      <header className="salon-topbar">
        <button onClick={() => navigate('/')} className="salon-ghost-btn" style={{ justifySelf: 'start' }}>
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>‹</span>
          <span>Retour au salon</span>
        </button>
        <div className="salon-title-block">
          <span className="salon-title-eyebrow">Mon dossier</span>
          <span className="salon-title-main">Profil de joueur</span>
        </div>
        <div />
      </header>

      <main className="salon-page-main">
        <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Identity card */}
          <section className="salon-card-panel" style={{ padding: '32px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => fileRef.current?.click()}
                className="salon-avatar-big"
                title="Changer la photo"
                aria-label="Changer la photo"
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span>{displayName[0]?.toUpperCase() ?? '?'}</span>}
                <span className="salon-avatar-edit">Changer</span>
              </button>
              <button onClick={() => fileRef.current?.click()} className="salon-link-btn" disabled={uploading}>
                <span className="salon-link-bullet" />
                {uploading ? 'Envoi en cours…' : 'Téléverser une photo'}
              </button>
              <input
                ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }}
              />
            </div>
          </section>

          {/* Stats trio */}
          {stats && (
            <section className="salon-stats-row">
              <div className="salon-stat">
                <span className="salon-stat-label">Elo</span>
                <span className="salon-stat-value salon-stat-brass">{stats.elo}</span>
              </div>
              <div className="salon-stat">
                <span className="salon-stat-label">Parties</span>
                <span className="salon-stat-value">{stats.games_played}</span>
              </div>
              <div className="salon-stat">
                <span className="salon-stat-label">Victoires</span>
                <span className="salon-stat-value">
                  {stats.games_won}
                  <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginLeft: 6, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    {winRate}%
                  </span>
                </span>
              </div>
            </section>
          )}

          {/* Form */}
          <section className="salon-card-panel">
            <div className="salon-panel-head">
              <h2 className="salon-panel-title">Identité</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="salon-field-label">Nom d'affichage</label>
                <input
                  className="salon-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={30}
                  placeholder="Ton nom à la table"
                />
              </div>
              {message && (
                <p style={{ margin: 0, fontSize: 13, textAlign: 'center', color: message.ok ? '#a7d7a4' : '#e98e8e' }}>
                  {message.text}
                </p>
              )}
              <button
                onClick={saveProfile}
                disabled={saving || !displayName.trim()}
                className="salon-primary-btn"
                style={{ width: '100%', padding: '14px 24px' }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
