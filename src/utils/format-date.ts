export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
