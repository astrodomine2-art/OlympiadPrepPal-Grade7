import React, { useEffect } from 'react';

const Confetti: React.FC = () => {
  useEffect(() => {
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '9999';
    document.body.appendChild(confettiContainer);

    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = confetti.style.width;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.top = '-10%';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.opacity = `${Math.random() + 0.5}`;
      const transform = `rotate(${Math.random() * 360}deg)`;
      confetti.style.transform = transform;
      confetti.style.animation = `fall ${Math.random() * 2 + 3}s linear ${Math.random() * 2}s forwards`;
      confettiContainer.appendChild(confetti);
    }

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fall {
        to {
          transform: translateY(110vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    const timeoutId = setTimeout(() => {
      document.body.removeChild(confettiContainer);
      document.head.removeChild(style);
    }, 7000); // Clean up after animation

    return () => {
      clearTimeout(timeoutId);
      if (document.body.contains(confettiContainer)) {
        document.body.removeChild(confettiContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return null;
};

export default Confetti;
