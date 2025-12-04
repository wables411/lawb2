/**
 * Play a sound effect when icons are clicked
 * Uses the same move.mp3 sound as chess piece moves
 */
export const playIconClickSound = () => {
  try {
    const audio = new Audio('/images/move.mp3');
    audio.volume = 0.3; // Match chess sound volume
    audio.play().catch((error) => {
      // Silently fail if audio can't play (e.g., autoplay restrictions)
      console.warn('Icon click sound failed to play:', error);
    });
  } catch (error) {
    console.warn('Icon click sound error:', error);
  }
};

