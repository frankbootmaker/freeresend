export function postAuthPath(user?: { isPlatformAdmin?: boolean } | null) {
  return user?.isPlatformAdmin ? '/portal' : '/';
}
