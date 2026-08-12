"use strict";

/*
  FIRST-DRAFT CONTENT
  -------------------
  Leave `src` blank to use the built-in temporary test sound.
  Later, replace it with a file path such as:
  src: "assets/audio/laser-impact.mp3"
*/
const sounds = [
  {
    id: "interface-glitch",
    title: "Interface Glitch",
    description: "A temporary digital texture made from short clicks and unstable tones.",
    src: "",
    testSound: "glitch",
    orbit: "horizontal",
    durationSeconds: 68,
    start: 0.07,
    direction: 1,
    icon: "wave"
  },
  {
    id: "metal-impact",
    title: "Metal Impact",
    description: "A temporary impact study combining a sharp attack with a low resonant tail.",
    src: "",
    testSound: "impact",
    orbit: "vertical",
    durationSeconds: 76,
    start: 0.35,
    direction: -1,
    icon: "impact"
  },
  {
    id: "machine-hum",
    title: "Machine Hum",
    description: "A temporary industrial drone with slow movement and mechanical overtones.",
    src: "",
    testSound: "hum",
    orbit: "diagonal-down",
    durationSeconds: 84,
    start: 0.61,
    direction: 1,
    icon: "bars"
  },
  {
    id: "low-atmosphere",
    title: "Low Atmosphere",
    description: "A temporary environmental bed designed to suggest depth, distance, and tension.",
    src: "",
    testSound: "atmosphere",
    orbit: "diagonal-up",
    durationSeconds: 91,
    start: 0.83,
    direction: -1,
    icon: "rings"
  },
  {
    id: "particle-clicks",
    title: "Particle Clicks",
    description: "A temporary cluster of small transient sounds arranged as a tactile texture.",
    src: "",
    testSound: "particles",
    orbit: "horizontal",
    durationSeconds: 98,
    start: 0.53,
    direction: -1,
    icon: "particles"
  }
];

const orbitDefinitions = {
  horizontal: { rotationDegrees: 0 },
  vertical: { rotationDegrees: 0 },
  "diagonal-down": { rotationDegrees: 38 },
  "diagonal-up": { rotationDegrees: -38 }
};

const elements = {
  stage: document.querySelector("#stage"),
  orbitMap: document.querySelector("#orbitMap"),
  planets: document.querySelector("#soundPlanets"),
  portrait: document.querySelector(".portrait"),
  card: document.querySelector("#soundCard"),
  cardEyebrow: document.querySelector("#soundCardEyebrow"),
  cardTitle: document.querySelector("#soundCardTitle"),
  cardDescription: document.querySelector("#soundCardDescription"),
  soundToggle: document.querySelector("#soundToggle"),
  soundToggleLabel: document.querySelector("#soundToggleLabel"),
  status: document.querySelector("#screenReaderStatus"),
  desktopInstruction: document.querySelector("#desktopInstruction"),
  touchInstruction: document.querySelector("#touchInstruction")
};

const state = {
  stageWidth: 0,
  stageHeight: 0,
  centerX: 0,
  centerY: 0,
  orbits: {},
  planets: new Map(),
  activeSoundId: null,
  audioEnabled: false,
  lastTimestamp: performance.now()
};

class SoundEngine {
  constructor() {
    this.context = null;
    this.audioElements = new Map();
    this.activeNodes = [];
  }

  async enable() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (AudioContextClass && !this.context) {
      this.context = new AudioContextClass();
    }

    if (this.context?.state === "suspended") {
      await this.context.resume();
    }
  }

  stop() {
    for (const audio of this.audioElements.values()) {
      audio.pause();
      audio.currentTime = 0;
    }

    const now = this.context?.currentTime ?? 0;

    for (const node of this.activeNodes) {
      try {
        if (node.gain) {
          node.gain.gain.cancelScheduledValues(now);
          node.gain.gain.setValueAtTime(
            Math.max(node.gain.gain.value, 0.0001),
            now
          );
          node.gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.035
          );
        }

        node.source?.stop(now + 0.05);
      } catch {
        // A one-shot test node may already have ended.
      }
    }

    this.activeNodes = [];
  }

  async play(sound) {
    this.stop();

    if (sound.src) {
      const audio =
        this.audioElements.get(sound.id) ||
        new Audio(sound.src);

      audio.preload = "auto";
      audio.currentTime = 0;
      this.audioElements.set(sound.id, audio);

      try {
        await audio.play();
      } catch (error) {
        console.warn(`Could not play ${sound.title}:`, error);
      }

      return;
    }

    if (!this.context) return;

    this.playTemporarySound(sound.testSound);
  }

  playTemporarySound(kind) {
    const context = this.context;
    const now = context.currentTime;

    const connectTone = ({
      frequency,
      type = "sine",
      gainValue = 0.04,
      start = 0,
      stop = 1
    }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(
        frequency,
        now + start
      );

      gain.gain.setValueAtTime(
        0.0001,
        now + start
      );

      gain.gain.exponentialRampToValueAtTime(
        gainValue,
        now + start + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + stop
      );

      oscillator
        .connect(gain)
        .connect(context.destination);

      oscillator.start(now + start);
      oscillator.stop(now + stop + 0.03);

      this.activeNodes.push({
        source: oscillator,
        gain
      });

      return {
        oscillator,
        gain
      };
    };

    if (kind === "impact") {
      const tone = connectTone({
        frequency: 135,
        type: "triangle",
        gainValue: 0.075,
        stop: 1.1
      });

      tone.oscillator.frequency.exponentialRampToValueAtTime(
        52,
        now + 0.55
      );

      connectTone({
        frequency: 920,
        type: "square",
        gainValue: 0.018,
        stop: 0.12
      });

      return;
    }

    if (kind === "hum") {
      connectTone({
        frequency: 82,
        type: "sawtooth",
        gainValue: 0.026,
        stop: 1.7
      });

      connectTone({
        frequency: 124,
        type: "sine",
        gainValue: 0.022,
        stop: 1.7
      });

      return;
    }

    if (kind === "atmosphere") {
      connectTone({
        frequency: 61,
        type: "sine",
        gainValue: 0.03,
        stop: 1.9
      });

      connectTone({
        frequency: 92,
        type: "triangle",
        gainValue: 0.018,
        start: 0.12,
        stop: 1.9
      });

      connectTone({
        frequency: 139,
        type: "sine",
        gainValue: 0.012,
        start: 0.28,
        stop: 1.9
      });

      return;
    }

    if (kind === "particles") {
      [0, 0.12, 0.26, 0.43, 0.62].forEach(
        (start, index) => {
          connectTone({
            frequency: 520 + index * 105,
            type:
              index % 2
                ? "triangle"
                : "sine",
            gainValue: 0.025,
            start,
            stop: start + 0.08
          });
        }
      );

      return;
    }

    [0, 0.09, 0.18, 0.31].forEach(
      (start, index) => {
        connectTone({
          frequency: [220, 610, 330, 780][index],
          type:
            index % 2
              ? "square"
              : "triangle",
          gainValue: 0.018,
          start,
          stop: start + 0.07
        });
      }
    );
  }
}

const soundEngine = new SoundEngine();

function escapeHtml(value) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;"
      })[character]
  );
}

function normalizeProgress(value) {
  return ((value % 1) + 1) % 1;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function createPlanet(sound) {
  const button = document.createElement("button");

  button.className = "sound-planet";
  button.type = "button";
  button.dataset.soundId = sound.id;

  button.setAttribute(
    "aria-label",
    `${sound.title}. Hover or select to listen.`
  );

  button.innerHTML = `
    <span class="sound-planet__disc" aria-hidden="true">
      <svg class="sound-planet__icon" viewBox="0 0 32 32">
        <use href="#icon-${sound.icon}"></use>
      </svg>
    </span>
    <span class="sound-planet__name">
      ${escapeHtml(sound.title)}
    </span>
  `;

  const planet = {
    sound,
    element: button,
    progress: normalizeProgress(sound.start),
    paused: false,
    selected: false,
    x: 0,
    y: 0
  };

  button.addEventListener(
    "pointerenter",
    (event) => {
      if (event.pointerType === "mouse") {
        activateSound(sound.id, "hover");
      }
    }
  );

  button.addEventListener(
    "pointerleave",
    (event) => {
      if (event.pointerType === "mouse") {
        deactivateSound(sound.id, "hover");
      }
    }
  );

  button.addEventListener(
    "focus",
    () => activateSound(sound.id, "focus")
  );

  button.addEventListener(
    "blur",
    () => deactivateSound(sound.id, "focus")
  );

  button.addEventListener(
    "click",
    async () => {
      if (!state.audioEnabled) {
        await enableSound();
      }

      toggleSelectedSound(sound.id);
    }
  );

  elements.planets.append(button);
  state.planets.set(sound.id, planet);
}

function calculateLayout() {
  const rect =
    elements.stage.getBoundingClientRect();

  state.stageWidth = rect.width;
  state.stageHeight = rect.height;

  state.centerX = rect.width / 2;
  state.centerY = rect.height / 2;

  const width = state.stageWidth;
  const height = state.stageHeight;

  const horizontalRx =
    Math.min(
      width * 0.37,
      height * 0.57
    );

  const horizontalRy =
    Math.min(
      height * 0.18,
      width * 0.15
    );

  const verticalRx =
    Math.min(
      width * 0.14,
      height * 0.20
    );

  const verticalRy =
    Math.min(
      height * 0.40,
      width * 0.50
    );

  const diagonalRx =
    Math.min(
      width * 0.35,
      height * 0.53
    );

  const diagonalRy =
    Math.min(
      height * 0.13,
      width * 0.12
    );

  state.orbits = {
    horizontal: {
      cx: state.centerX,
      cy: state.centerY,
      rx: horizontalRx,
      ry: horizontalRy,
      rotationRadians: 0
    },

    vertical: {
      cx: state.centerX,
      cy: state.centerY,
      rx: verticalRx,
      ry: verticalRy,
      rotationRadians: 0
    },

    "diagonal-down": {
      cx: state.centerX,
      cy: state.centerY,
      rx: diagonalRx,
      ry: diagonalRy,
      rotationRadians:
        degreesToRadians(
          orbitDefinitions[
            "diagonal-down"
          ].rotationDegrees
        )
    },

    "diagonal-up": {
      cx: state.centerX,
      cy: state.centerY,
      rx: diagonalRx,
      ry: diagonalRy,
      rotationRadians:
        degreesToRadians(
          orbitDefinitions[
            "diagonal-up"
          ].rotationDegrees
        )
    }
  };

  elements.orbitMap.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`
  );

  for (
    const ellipse
    of elements.orbitMap.querySelectorAll(
      "ellipse[data-orbit]"
    )
  ) {
    const orbitName =
      ellipse.dataset.orbit;

    const orbit =
      state.orbits[orbitName];

    const rotation =
      orbitDefinitions[
        orbitName
      ].rotationDegrees;

    ellipse.setAttribute(
      "cx",
      orbit.cx
    );

    ellipse.setAttribute(
      "cy",
      orbit.cy
    );

    ellipse.setAttribute(
      "rx",
      orbit.rx
    );

    ellipse.setAttribute(
      "ry",
      orbit.ry
    );

    ellipse.setAttribute(
      "transform",
      `rotate(${rotation} ${orbit.cx} ${orbit.cy})`
    );
  }

  for (
    const planet
    of state.planets.values()
  ) {
    positionPlanet(planet);
  }

  if (state.activeSoundId) {
    positionCard(
      state.planets.get(
        state.activeSoundId
      )
    );
  }
}

function pointOnOrbit(
  orbit,
  progress
) {
  const angle =
    progress * Math.PI * 2;

  const localX =
    orbit.rx * Math.cos(angle);

  const localY =
    orbit.ry * Math.sin(angle);

  const cos =
    Math.cos(
      orbit.rotationRadians
    );

  const sin =
    Math.sin(
      orbit.rotationRadians
    );

  return {
    x:
      orbit.cx +
      localX * cos -
      localY * sin,

    y:
      orbit.cy +
      localX * sin +
      localY * cos
  };
}

function positionPlanet(planet) {
  const orbit =
    state.orbits[
      planet.sound.orbit
    ];

  if (!orbit) return;

  const point =
    pointOnOrbit(
      orbit,
      planet.progress
    );

  planet.x = point.x;
  planet.y = point.y;

  planet.element.style.left =
    `${point.x}px`;

  planet.element.style.top =
    `${point.y}px`;
}

function animate(timestamp) {
  const elapsedSeconds =
    Math.min(
      (
        timestamp -
        state.lastTimestamp
      ) / 1000,
      0.1
    );

  state.lastTimestamp =
    timestamp;

  for (
    const planet
    of state.planets.values()
  ) {
    if (!planet.paused) {
      planet.progress =
        normalizeProgress(
          planet.progress +
          (
            elapsedSeconds /
            planet.sound.durationSeconds
          ) *
          planet.sound.direction
        );

      positionPlanet(planet);
    }
  }

  if (state.activeSoundId) {
    positionCard(
      state.planets.get(
        state.activeSoundId
      )
    );
  }

  requestAnimationFrame(animate);
}

async function enableSound() {
  try {
    await soundEngine.enable();

    state.audioEnabled = true;

    elements.soundToggle.setAttribute(
      "aria-pressed",
      "true"
    );

    elements.soundToggleLabel.textContent =
      "Sound enabled";

    elements.desktopInstruction.textContent =
      "Hover over an icon to stop and listen";

    elements.touchInstruction.textContent =
      "Tap an icon to stop and listen";

    elements.status.textContent =
      "Sound enabled. Hover over an icon to listen.";
  } catch (error) {
    console.error(
      "Unable to enable audio:",
      error
    );

    elements.status.textContent =
      "Audio could not be enabled in this browser.";
  }
}

function disableSound() {
  state.audioEnabled = false;

  soundEngine.stop();

  if (state.activeSoundId) {
    clearActiveSound(
      state.activeSoundId
    );
  }

  elements.soundToggle.setAttribute(
    "aria-pressed",
    "false"
  );

  elements.soundToggleLabel.textContent =
    "Enable sound";

  elements.desktopInstruction.textContent =
    "Enable sound, then hover over an icon";

  elements.touchInstruction.textContent =
    "Tap an icon to enable sound and listen";

  elements.status.textContent =
    "Sound disabled.";
}

function activateSound(
  soundId,
  source
) {
  const planet =
    state.planets.get(soundId);

  if (!planet) return;

  if (
    state.activeSoundId &&
    state.activeSoundId !== soundId
  ) {
    clearActiveSound(
      state.activeSoundId
    );
  }

  state.activeSoundId =
    soundId;

  planet.paused = true;

  planet.element.classList.add(
    "is-active"
  );

  planet.element.dataset.activeSource =
    source;

  elements.cardEyebrow.textContent =
    state.audioEnabled
      ? (
          planet.sound.src
            ? "SOUND WORK"
            : "TEMPORARY TEST AUDIO"
        )
      : "ENABLE SOUND TO LISTEN";

  elements.cardTitle.textContent =
    planet.sound.title;

  elements.cardDescription.textContent =
    planet.sound.description;

  elements.card.classList.add(
    "is-visible"
  );

  elements.card.setAttribute(
    "aria-hidden",
    "false"
  );

  positionCard(planet);

  if (state.audioEnabled) {
    soundEngine.play(
      planet.sound
    );

    elements.status.textContent =
      `${planet.sound.title} playing.`;
  } else {
    elements.status.textContent =
      `${planet.sound.title} selected. Enable sound to listen.`;
  }
}

function deactivateSound(
  soundId,
  source
) {
  const planet =
    state.planets.get(soundId);

  if (
    !planet ||
    planet.selected
  ) {
    return;
  }

  const activeSource =
    planet.element.dataset.activeSource;

  if (
    source &&
    activeSource &&
    source !== activeSource
  ) {
    return;
  }

  clearActiveSound(soundId);
}

function clearActiveSound(
  soundId
) {
  const planet =
    state.planets.get(soundId);

  if (!planet) return;

  planet.paused = false;
  planet.selected = false;

  planet.element.classList.remove(
    "is-active"
  );

  delete planet.element.dataset.activeSource;

  if (
    state.activeSoundId === soundId
  ) {
    state.activeSoundId = null;

    soundEngine.stop();

    elements.card.classList.remove(
      "is-visible"
    );

    elements.card.setAttribute(
      "aria-hidden",
      "true"
    );

    elements.status.textContent =
      `${planet.sound.title} stopped.`;
  }
}

function toggleSelectedSound(
  soundId
) {
  const planet =
    state.planets.get(soundId);

  if (!planet) return;

  if (planet.selected) {
    clearActiveSound(soundId);
    return;
  }

  if (state.activeSoundId) {
    clearActiveSound(
      state.activeSoundId
    );
  }

  planet.selected = true;

  activateSound(
    soundId,
    "selected"
  );
}

function positionCard(planet) {
  if (
    !planet ||
    !elements.card.classList.contains(
      "is-visible"
    )
  ) {
    return;
  }

  const padding = 10;
  const gap = 43;

  const cardRect =
    elements.card.getBoundingClientRect();

  if (state.stageWidth < 640) {
    elements.card.style.left =
      `${Math.max(
        padding,
        (
          state.stageWidth -
          cardRect.width
        ) / 2
      )}px`;

    elements.card.style.top =
      `${Math.max(
        padding,
        state.stageHeight -
        cardRect.height -
        22
      )}px`;

    return;
  }

  const stageRect =
    elements.stage.getBoundingClientRect();

  const portraitRect =
    elements.portrait.getBoundingClientRect();

  const exclusion = {
    left:
      portraitRect.left -
      stageRect.left -
      25,

    top:
      portraitRect.top -
      stageRect.top -
      25,

    right:
      portraitRect.right -
      stageRect.left +
      25,

    bottom:
      portraitRect.bottom -
      stageRect.top +
      25
  };

  const candidates = [
    {
      x: planet.x + gap,
      y:
        planet.y -
        cardRect.height / 2
    },
    {
      x:
        planet.x -
        cardRect.width -
        gap,
      y:
        planet.y -
        cardRect.height / 2
    },
    {
      x:
        planet.x -
        cardRect.width / 2,
      y:
        planet.y -
        cardRect.height -
        gap
    },
    {
      x:
        planet.x -
        cardRect.width / 2,
      y:
        planet.y +
        gap
    }
  ].map(
    (candidate) => {
      const x =
        Math.max(
          padding,
          Math.min(
            candidate.x,
            state.stageWidth -
            cardRect.width -
            padding
          )
        );

      const y =
        Math.max(
          padding,
          Math.min(
            candidate.y,
            state.stageHeight -
            cardRect.height -
            padding
          )
        );

      const rect = {
        left: x,
        top: y,
        right:
          x +
          cardRect.width,
        bottom:
          y +
          cardRect.height
      };

      const overlapWidth =
        Math.max(
          0,
          Math.min(
            rect.right,
            exclusion.right
          ) -
          Math.max(
            rect.left,
            exclusion.left
          )
        );

      const overlapHeight =
        Math.max(
          0,
          Math.min(
            rect.bottom,
            exclusion.bottom
          ) -
          Math.max(
            rect.top,
            exclusion.top
          )
        );

      const overlapArea =
        overlapWidth *
        overlapHeight;

      const clampDistance =
        Math.abs(
          x -
          candidate.x
        ) +
        Math.abs(
          y -
          candidate.y
        );

      return {
        x,
        y,
        score:
          overlapArea *
          100 +
          clampDistance
      };
    }
  );

  candidates.sort(
    (a, b) =>
      a.score -
      b.score
  );

  elements.card.style.left =
    `${candidates[0].x}px`;

  elements.card.style.top =
    `${candidates[0].y}px`;
}

function initialize() {
  for (const sound of sounds) {
    createPlanet(sound);
  }

  calculateLayout();

  elements.soundToggle.addEventListener(
    "click",
    async () => {
      if (state.audioEnabled) {
        disableSound();
      } else {
        await enableSound();
      }
    }
  );

  window.addEventListener(
    "resize",
    calculateLayout,
    { passive: true }
  );

  const resizeObserver =
    new ResizeObserver(
      calculateLayout
    );

  resizeObserver.observe(
    elements.stage
  );

  requestAnimationFrame(
    animate
  );

  window.__orbitPortfolio = {
    getState() {
      return {
        audioEnabled:
          state.audioEnabled,

        activeSoundId:
          state.activeSoundId,

        planets: [
          ...state.planets.values()
        ].map(
          (planet) => ({
            id:
              planet.sound.id,
            x:
              planet.x,
            y:
              planet.y,
            paused:
              planet.paused,
            progress:
              planet.progress
          })
        )
      };
    },

    activate:
      activateSound,

    clear:
      clearActiveSound
  };
}

initialize();