/**
 * Joins class names, filtering falsy values.
 * Minimal clsx-like helper — no dependencies.
 */
export function cn(...args) {
  return args
    .flat(Infinity)
    .filter(Boolean)
    .join(' ')
}
