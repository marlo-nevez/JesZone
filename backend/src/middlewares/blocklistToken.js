const revogados = new Map(); // jti -> timestamp de expiração

export function revogarToken(jti, ttlMs = 8 * 60 * 60 * 1000) {
  if (!jti) return;
  revogados.set(jti, Date.now() + ttlMs);
}

export function tokenRevogado(jti) {
  if (!jti) return false;
  const expira = revogados.get(jti);
  if (!expira) return false;
  if (Date.now() > expira) {
    revogados.delete(jti);
    return false;
  }
  return true;
}