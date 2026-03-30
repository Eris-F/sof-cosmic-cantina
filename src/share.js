export async function shareScore(score, wave, mode, difficulty) {
  const text = [
    "Sofia's Cosmic Cantina",
    `Score: ${score} | Wave: ${wave}`,
    `Mode: ${mode.toUpperCase()} | ${difficulty.toUpperCase()}`,
    '',
    'Can you beat my score?',
  ].join('\n');

  if (navigator.share) {
    try {
      await navigator.share({ title: "Sofia's Cosmic Cantina", text });
      return true;
    } catch (_) {
      // User cancelled or error — fall through to clipboard
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    return false;
  }
}
