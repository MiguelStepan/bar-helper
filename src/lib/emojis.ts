// Kurátorovaný set emoji pro avatar profilu zaměstnance.
// 32 ikonek (8 sloupců × 4 řady) — drinky, ovoce, vibe, zvířátka.
export const PROFILE_EMOJIS = [
  "🍸", "🍹", "🍺", "🍻", "🥂", "🍷", "🥃", "🍶",
  "🍋", "🍊", "🍒", "🍓", "🍍", "🥭", "🌿", "🧊",
  "✨", "⭐", "🔥", "⚡", "🎯", "🎨", "🎭", "🎵",
  "🦊", "🐱", "🦁", "🐺", "🦄", "🐙", "🦋", "🌙",
] as const;

export type ProfileEmoji = (typeof PROFILE_EMOJIS)[number];
