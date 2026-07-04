const socket = io();

const openButton = document.getElementById('openButton');
const openInvite = document.getElementById('openInvite');
const detailsPanel = document.getElementById('detailsPanel');
const launchOverlay = document.getElementById('launchOverlay');
const launchNumber = document.getElementById('launchNumber');
const launchMascot = document.getElementById('launchMascot');
const launchText = document.getElementById('launchText');
const statusNote = document.getElementById('statusNote');
const daysElement = document.getElementById('days');
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const progressFill = document.getElementById('progressFill');
const connectedCount = document.getElementById('connectedCount');
const revealOverlay = document.getElementById('revealOverlay');
const revealMessage = document.getElementById('revealMessage');
const envelopeTop = document.querySelector('.envelope-top');
const waxSeal = document.querySelector('.wax-seal');
const confettiCanvas = document.getElementById('confettiCanvas');
const daysRing = document.querySelector('.ring-progress');
const targetTime = document.body.dataset.targetTime ? new Date(document.body.dataset.targetTime) : null;
const startTime = document.body.dataset.startTime ? new Date(document.body.dataset.startTime) : null;
const serverTime = document.body.dataset.serverTime ? new Date(document.body.dataset.serverTime) : null;
const pageLoadTime = Date.now();
const launchState = { isRunning: false };

let confettiInstance;
let glowTimeline;
let revealActive = false;

function easeNumber(value) {
  return value.toString().padStart(2, '0');
}

function updateCountdown(data) {
  daysElement.textContent = easeNumber(data.days);
  hoursElement.textContent = easeNumber(data.hours);
  minutesElement.textContent = easeNumber(data.minutes);
  secondsElement.textContent = easeNumber(data.seconds);
  progressFill.style.width = `${Math.round(data.progress * 100)}%`;
  const circumference = 2 * Math.PI * 100;
  const offset = circumference * (1 - data.progress);
  if (daysRing) {
    daysRing.style.strokeDashoffset = offset;
  }

  if (data.reveal_active && !revealActive) {
    revealActive = true;
    triggerReveal({gender: 'girl'});
  } else if (data.is_final_window) {
    statusNote.textContent = '¡Faltan menos de 10 minutos!';
    if (!glowTimeline) {
      glowTimeline = gsap.to('.progress-fill', {boxShadow: '0 0 40px rgba(200,169,120,0.7)', repeat: -1, yoyo: true, duration: 1.2, ease: 'sine.inOut'});
    }
  }
}

function getLocalCountdown() {
  if (!targetTime || !startTime || !serverTime) return null;
  const now = new Date(serverTime.getTime() + (Date.now() - pageLoadTime));
  const remainingMs = targetTime - now;
  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const totalRange = Math.max(1, Math.floor((targetTime - startTime) / 1000));
  const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
  const progress = Math.min(1, Math.max(0, elapsed / totalRange));

  return {
    days: Math.floor(remainingSeconds / 86400),
    hours: Math.floor((remainingSeconds % 86400) / 3600),
    minutes: Math.floor((remainingSeconds % 3600) / 60),
    seconds: remainingSeconds % 60,
    progress,
    is_final_window: remainingSeconds <= 600,
    reveal_active: remainingSeconds === 0
  };
}

function tickLocalCountdown() {
  const data = getLocalCountdown();
  if (!data) return;
  updateCountdown(data);
}

function launchOpenConfetti() {
  if (!confettiCanvas || !window.confetti) return;
  const openConfetti = confetti.create(confettiCanvas, { resize: true, useWorker: true });
  const colors = ['#ff1f8c', '#4caeff', '#fff45d', '#ff79c7', '#7ee5ff'];

  for (let i = 0; i < 5; i += 1) {
    setTimeout(() => {
      openConfetti({
        particleCount: 36,
        angle: 60,
        spread: 96,
        origin: { x: 0.04 + i * 0.2, y: 0.72 },
        colors,
        scalar: 1.25,
        gravity: 0.45,
      });
      openConfetti({
        particleCount: 36,
        angle: 120,
        spread: 96,
        origin: { x: 0.96 - i * 0.2, y: 0.72 },
        colors,
        scalar: 1.25,
        gravity: 0.45,
      });
    }, i * 100);
  }
}

function startLaunchConfetti() {
  if (!confettiCanvas || !window.confetti) return;
  const launchConfetti = confetti.create(confettiCanvas, { resize: true, useWorker: true });
  const colors = ['#ff1f8c', '#459ef8', '#fff45d', '#ff73cd', '#7ee5ff'];

  launchConfetti({
    particleCount: 36,
    angle: 58,
    spread: 100,
    origin: { x: 0.08, y: 0.38 },
    colors,
    scalar: 1.35,
    gravity: 0.42,
  });
  launchConfetti({
    particleCount: 36,
    angle: 122,
    spread: 100,
    origin: { x: 0.92, y: 0.38 },
    colors,
    scalar: 1.35,
    gravity: 0.42,
  });
}

function startRevealConfetti(gender) {
  if (!confettiCanvas || !window.confetti) return;
  const revealConfetti = confetti.create(confettiCanvas, { resize: true, useWorker: true });
  const colors = gender === 'girl'
    ? ['#ff4da6', '#ffd3e8', '#ff93bf', '#ffffff']
    : ['#63d0ff', '#dbe9ff', '#8ac6ff', '#ffffff'];

  const duration = 7 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    revealConfetti({
      particleCount: 16,
      angle: 55,
      spread: 80,
      origin: { x: 0.08, y: 0.35 },
      colors,
      scalar: 1.2,
      gravity: 0.45,
    });
    revealConfetti({
      particleCount: 16,
      angle: 125,
      spread: 80,
      origin: { x: 0.92, y: 0.35 },
      colors,
      scalar: 1.2,
      gravity: 0.45,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function triggerReveal(data) {
  revealOverlay.classList.remove('hidden');
  revealMessage.textContent = data.gender === 'girl' ? '💗 Es una niña 💗' : '💙 Es un niño 💙';
  revealOverlay.style.background = data.gender === 'girl' ? 'rgba(246, 182, 198, 0.18)' : 'rgba(167, 191, 230, 0.18)';
  document.body.style.background = data.gender === 'girl' ? '#fff2f7' : '#eff6ff';
  startRevealConfetti(data.gender);
  gsap.fromTo(revealOverlay.querySelector('.reveal-content'), {scale: 0.85, opacity: 0}, {scale: 1, opacity: 1, duration: 1.1, ease: 'back.out(1.2)'});
}

function launchSequence() {
  const launchProgressFill = document.getElementById('launchProgressFill');
  const launchText = document.getElementById('launchText');
  if (!launchOverlay || !launchNumber || !launchProgressFill || !launchText || launchState.isRunning) return;

  launchState.isRunning = true;
  launchOverlay.classList.remove('hidden');
  launchNumber.textContent = '3';
  launchText.textContent = 'Prepárate';
  launchProgressFill.style.width = '0%';
  launchProgressFill.style.transition = 'width 0.8s ease';
  document.body.classList.add('launching');

  const sequence = ['3', '2', '1'];
  let index = 0;

  return new Promise((resolve) => {
    function nextStep() {
      if (index >= sequence.length) {
        gsap.to(launchOverlay, { opacity: 0, duration: 0.45, ease: 'power2.out', onComplete: () => {
          launchOverlay.classList.add('hidden');
          launchOverlay.style.opacity = '';
          document.body.classList.remove('launching');
          launchState.isRunning = false;
          resolve();
        }});
        return;
      }

      const value = sequence[index];
      const progress = ((index + 1) / sequence.length);
      launchNumber.textContent = value;
      launchProgressFill.style.width = `${progress * 100}%`;
      if (launchMascot) {
        gsap.to(launchMascot, { xPercent: (progress * 100) - 2, duration: 0.8, ease: 'power2.out' });
        gsap.to(launchMascot, { y: index % 2 === 0 ? -6 : -2, duration: 0.5, yoyo: true, repeat: 1, ease: 'power1.inOut' });
      }
      startLaunchConfetti();
      gsap.fromTo(launchNumber, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'elastic.out(1, 0.65)' });
      index += 1;
      setTimeout(nextStep, 1000);
    }

    nextStep();
  });
}

function animateEnvelopeOpen() {
  launchOpenConfetti();
  if (detailsPanel.classList.contains('hidden')) {
    detailsPanel.classList.remove('hidden');
  }
  document.body.classList.add('invite-opened');
  detailsPanel.classList.add('visible');
  gsap.to(openInvite, { scale: 0.96, duration: 0.4, ease: 'power2.out' });
  gsap.to(envelopeTop, { rotationX: -160, duration: 1.2, transformOrigin: 'top center', ease: 'power2.inOut' });
  gsap.to(waxSeal, { y: 18, opacity: 0.1, duration: 0.9, ease: 'power2.out' });
  gsap.fromTo(detailsPanel, {opacity: 0, y: 40}, {opacity: 1, y: 0, duration: 1.1, delay: 0.2, ease: 'power2.out'});
}

async function openInvitation() {
  await launchSequence();
  animateEnvelopeOpen();
}

if (openButton) {
  openButton.addEventListener('click', () => {
    if (detailsPanel.classList.contains('hidden')) {
      openInvitation();
    }
  });
}

if (openInvite) {
  openInvite.addEventListener('click', () => {
    if (detailsPanel.classList.contains('hidden')) {
      openInvitation();
    }
  });
}

socket.on('connect', () => {
  console.log('Conectado al servidor');
});

socket.on('presence_update', (data) => {
  connectedCount.textContent = data.count;
});

socket.on('countdown_update', (data) => {
  updateCountdown(data);
});

socket.on('reveal_event', (data) => {
  if (!revealActive) {
    revealActive = true;
    triggerReveal(data);
  }
});

window.addEventListener('load', () => {
  gsap.from('.headline-text', {opacity: 0, y: 24, duration: 1.1, ease: 'power3.out'});
  gsap.from(openInvite, {opacity: 0, y: 30, duration: 1.1, delay: 0.4, ease: 'power3.out'});
  gsap.from(openButton, {opacity: 0, y: 30, duration: 1.1, delay: 0.5, ease: 'power3.out'});
  tickLocalCountdown();
  setInterval(tickLocalCountdown, 1000);
});
