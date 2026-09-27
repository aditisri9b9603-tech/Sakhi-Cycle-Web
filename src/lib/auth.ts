export function authRedirectUrl() {
  return `${window.location.origin}/auth/callback`
}

export function oauthErrorFromLocation(search = window.location.search, hash = window.location.hash) {
  const query = new URLSearchParams(search)
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  return (
    query.get('error_description') ||
    query.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error') ||
    ''
  )
}

export function displayNameFromUser(email: string | undefined, metadata: Record<string, unknown> | undefined) {
  const fromMeta = [metadata?.full_name, metadata?.name, metadata?.display_name]
    .find((value) => typeof value === 'string' && value.trim())
  if (typeof fromMeta === 'string') return fromMeta.trim()
  return email?.split('@')[0] || 'friend'
}
