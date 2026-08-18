<template>
  <NuxtPage />
</template>

<style>
body {
  margin: 0;
  background: #040608;
  font-family: 'JetBrains Mono', monospace;
}
::selection {
  background: #3fca7a;
  color: #040608;
}
a { color: inherit; text-decoration: none; }
a:hover { color: #3fca7a; }

@keyframes blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes riseIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes scanBand { from { top: -15%; } to { top: 115%; } }
@keyframes shake {
  0%, 100% { transform: none; }
  10% { transform: translate(-7px, 3px); }
  20% { transform: translate(6px, -4px); }
  30% { transform: translate(-5px, -3px); }
  40% { transform: translate(7px, 2px); }
  50% { transform: translate(-4px, 5px); }
  60% { transform: translate(5px, -2px); }
  70% { transform: translate(-6px, -4px); }
  80% { transform: translate(4px, 3px); }
  90% { transform: translate(-3px, -2px); }
}
@keyframes noiseFlick { 0% { opacity: .14; } 100% { opacity: .32; } }
@keyframes sliceJump {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-32px); }
  40% { transform: translateX(24px); }
  60% { transform: translateX(-14px); }
  80% { transform: translateX(38px); }
}
@keyframes glitchA {
  0%, 86%, 100% { clip-path: inset(0 0 100% 0); transform: none; }
  88% { clip-path: inset(8% 0 62% 0); transform: translate(-3px, -1px); }
  90% { clip-path: inset(58% 0 6% 0); transform: translate(3px, 1px); }
  92% { clip-path: inset(28% 0 44% 0); transform: translate(-2px, 0); }
  94% { clip-path: inset(0 0 100% 0); }
}
@keyframes glitchB {
  0%, 85%, 100% { clip-path: inset(100% 0 0 0); transform: none; }
  87% { clip-path: inset(64% 0 4% 0); transform: translate(3px, 1px); }
  89% { clip-path: inset(10% 0 70% 0); transform: translate(-3px, -1px); }
  93% { clip-path: inset(42% 0 30% 0); transform: translate(2px, 0); }
  95% { clip-path: inset(100% 0 0 0); }
}
@keyframes tuxBreathe {
  0%, 100% { transform: scale(1) rotate(-1.5deg); }
  50% { transform: scale(1.045) rotate(1.5deg); }
}
@keyframes tuxJitter {
  0%, 100% { transform: translate(0, 0); }
  12% { transform: translate(-9px, 4px); }
  25% { transform: translate(7px, -6px); }
  37% { transform: translate(-5px, -3px); }
  50% { transform: translate(9px, 5px); }
  62% { transform: translate(-7px, 2px); }
  75% { transform: translate(4px, -7px); }
  87% { transform: translate(-3px, 6px); }
}
@keyframes tuxGlow {
  0%, 100% { filter: drop-shadow(0 0 24px rgba(229, 103, 95, .55)); }
  50% { filter: drop-shadow(0 0 54px rgba(229, 103, 95, .85)); }
}

@media (prefers-reduced-motion: reduce) {
  .glitch-stage, .glitch-stage * { animation: none !important; }
}
</style>
