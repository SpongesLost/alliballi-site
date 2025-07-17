// Canvas Confetti integration for bottom-up effect
// https://www.npmjs.com/package/canvas-confetti
import confetti from 'https://cdn.skypack.dev/canvas-confetti';

// Fire confetti from the bottom center of the screen
function fireBottomConfetti() {
    confetti({
        disableForReducedMotion: true,
        startVelocity: 30,
        decay: 0.93,
        gravity: 0.5,
        particleCount: 50,
        spread: 40,
        origin: { x: 0.5, y: 1.1 }
    });
}

// Export for use in other scripts
typeof window !== 'undefined' && (window.fireBottomConfetti = fireBottomConfetti);
