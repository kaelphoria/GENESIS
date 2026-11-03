/** Pure origin policy shared by the server guard and Node tests. */
export function originAllowed(supplied, expected) {
  if (typeof supplied !== 'string' || !supplied || supplied === 'null') return false;
  try {
    return new URL(supplied).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}
