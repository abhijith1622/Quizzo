export interface AvatarInfo {
  key: string;
  name: string;
  emoji: string;
  bg: string;
  border: string;
}

export const AVATARS: AvatarInfo[] = [
  { key: 'fox', name: 'Speedy Fox', emoji: '🦊', bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-400' },
  { key: 'robot', name: 'Cyber Bot', emoji: '🤖', bg: 'bg-blue-100 dark:bg-blue-950/40', border: 'border-blue-400' },
  { key: 'cat', name: 'Shadow Cat', emoji: '🐱', bg: 'bg-purple-100 dark:bg-purple-950/40', border: 'border-purple-400' },
  { key: 'panda', name: 'Zen Panda', emoji: '🐼', bg: 'bg-emerald-100 dark:bg-emerald-950/40', border: 'border-emerald-400' },
  { key: 'dragon', name: 'Fire Drake', emoji: '🐲', bg: 'bg-red-100 dark:bg-red-950/40', border: 'border-red-400' },
  { key: 'wizard', name: 'Astro Mage', emoji: '🧙', bg: 'bg-indigo-100 dark:bg-indigo-950/40', border: 'border-indigo-400' },
  { key: 'falcon', name: 'Sky Falcon', emoji: '🦅', bg: 'bg-sky-100 dark:bg-sky-950/40', border: 'border-sky-400' },
  { key: 'alien', name: 'Cosmo Alien', emoji: '👽', bg: 'bg-lime-100 dark:bg-lime-950/40', border: 'border-lime-400' },
  { key: 'tiger', name: 'Flash Tiger', emoji: '🐯', bg: 'bg-orange-100 dark:bg-orange-950/40', border: 'border-orange-400' },
  { key: 'owl', name: 'Sage Owl', emoji: '🦉', bg: 'bg-teal-100 dark:bg-teal-950/40', border: 'border-teal-400' }
];

export function getAvatar(key: string): AvatarInfo {
  return AVATARS.find(a => a.key === key) || AVATARS[0];
}
