import { useEffect, useRef, useState } from "react";
import "./App.css";

const LOGIN_ID = "test@tdp";
const LOGIN_PASSWORD = "12345678";

const ITEMS = [
  { id: 1, emoji: "🍎", name: "Apple", color: "Red", category: "Fruit" },
  { id: 2, emoji: "🍌", name: "Banana", color: "Yellow", category: "Fruit" },
  { id: 3, emoji: "🍊", name: "Orange", color: "Orange", category: "Fruit" },
  { id: 4, emoji: "🟪", name: "Square", color: "Pink", category: "Shape" },
  { id: 5, emoji: "🔷", name: "Triangle", color: "Blue", category: "Shape" },
  { id: 6, emoji: "🟤", name: "Circle", color: "Brown", category: "Shape" },
  { id: 7, emoji: "🐃", name: "Buffalo", color: "Black", category: "Animal" },
  { id: 8, emoji: "🐈", name: "Cat", color: "White", category: "Animal" },
  { id: 9, emoji: "🦜", name: "Parrot", color: "Green", category: "Animal" },
];

const MODES = [
  ["find-object", "🎯", "Find Object", "Find the correct object"],
  ["find-color", "🎨", "Find Color", "Find the correct color"],
  ["memory", "🧠", "Memory Mode", "Remember the sequence"],
  ["speed", "⚡", "Speed Mode", "React as quickly as possible"],
  ["timed", "⏱️", "90-second Mode", "Play for 90 seconds"],
  ["boss", "👾", "Boss Mode", "Hard memory challenge"],
  ["random", "🎲", "Random Challenge", "Color / Animal / Shape / Fruit"],
];

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [mode, setMode] = useState("find-object");
  const [target, setTarget] = useState(null);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);

  const [time, setTime] = useState(90);
  const [running, setRunning] = useState(false);

  const [message, setMessage] = useState(
    "Choose a mode and press Start"
  );

  const [memorySequence, setMemorySequence] = useState([]);
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [memoryShowing, setMemoryShowing] = useState(false);

  const [randomType, setRandomType] = useState("");
  const [reactionTime, setReactionTime] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const memoryTimerRef = useRef(null);

  /* =========================
     VOICE SYSTEM
  ========================= */

  const speak = (text) => {
    if (!("speechSynthesis" in window)) {
      console.log("Speech synthesis not supported");
      return;
    }

    window.speechSynthesis.cancel();

    const speakNow = () => {
      const voices = window.speechSynthesis.getVoices();

      const englishVoices = voices.filter(
        (voice) =>
          voice.lang &&
          voice.lang.toLowerCase().startsWith("en")
      );

      const preferredVoice = englishVoices.find((voice) => {
        const name = voice.name.toLowerCase();

        return (
          name.includes("samantha") ||
          name.includes("karen") ||
          name.includes("victoria") ||
          name.includes("zira") ||
          name.includes("susan") ||
          name.includes("moira") ||
          name.includes("fiona") ||
          name.includes("ava") ||
          name.includes("allison") ||
          name.includes("female")
        );
      });

      const voice =
        preferredVoice || englishVoices[0] || voices[0];

      const utterance = new SpeechSynthesisUtterance(text);

      if (voice) {
        utterance.voice = voice;
      }

      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      utterance.onstart = () => {
        console.log("🔊 Speaking:", text);
      };

      utterance.onend = () => {
        console.log("Voice finished");
      };

      utterance.onerror = (event) => {
        console.log("Speech error:", event);
      };

      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      speakNow();
    } else {
      const handleVoicesChanged = () => {
        speakNow();
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );
      };

      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoicesChanged
      );
    }
  };

  /* =========================
     LOAD VOICES
  ========================= */

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      clearInterval(timerRef.current);
      clearInterval(memoryTimerRef.current);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* =========================
     LOGIN
  ========================= */

  const handleLogin = (e) => {
    e.preventDefault();

    if (
      loginId === LOGIN_ID &&
      password === LOGIN_PASSWORD
    ) {
      setLoggedIn(true);
      setLoginError("");

      setTimeout(() => {
        speak("Welcome to Cognibox");
      }, 300);
    } else {
      setLoginError(
        "Incorrect login ID or password"
      );
    }
  };

  /* =========================
     RANDOM CHALLENGE
  ========================= */

  const createRandomChallenge = () => {
    const types = [
      "Color",
      "Animal",
      "Shape",
      "Fruit",
    ];

    const selectedType =
      types[Math.floor(Math.random() * types.length)];

    let selectedItem;

    if (selectedType === "Color") {
      selectedItem =
        ITEMS[Math.floor(Math.random() * ITEMS.length)];
    } else {
      const matchingItems = ITEMS.filter(
        (item) => item.category === selectedType
      );

      selectedItem =
        matchingItems[
          Math.floor(Math.random() * matchingItems.length)
        ];
    }

    setRandomType(selectedType);
    setTarget(selectedItem);

    let question;

    if (selectedType === "Color") {
      question = `Find the ${selectedItem.color} color`;
    } else {
      question = `Find a ${selectedType.toLowerCase()}`;
    }

    setMessage(question);

    setTimeout(() => {
      speak(question);
    }, 100);
  };

  /* =========================
     NORMAL TARGET
  ========================= */

  const createTarget = (selectedMode) => {
    const item =
      ITEMS[Math.floor(Math.random() * ITEMS.length)];

    setTarget(item);

    let question = "";

    if (selectedMode === "find-object") {
      question = `Find the ${item.name}`;
    }

    if (selectedMode === "find-color") {
      question = `Find the ${item.color} color`;
    }

    if (selectedMode === "speed") {
      question = `Find the ${item.name}`;
      startTimeRef.current = performance.now();
    }

    if (selectedMode === "timed") {
      question = `Find the ${item.name}`;
    }

    setMessage(question);

    setTimeout(() => {
      speak(question);
    }, 100);
  };

  /* =========================
     MEMORY
  ========================= */

  const createMemorySequence = (boss = false) => {
    clearInterval(memoryTimerRef.current);

    const length = boss ? 6 : 3;

    const sequence = Array.from(
      { length },
      () =>
        ITEMS[
          Math.floor(Math.random() * ITEMS.length)
        ]
    );

    setMemorySequence(sequence);
    setMemoryIndex(0);
    setMemoryShowing(true);
    setTarget(null);

    const intro = boss
      ? "Boss sequence. Remember carefully."
      : "Watch the sequence carefully.";

    setMessage(intro);
    speak(intro);

    let index = 0;

    memoryTimerRef.current = setInterval(() => {
      if (index < sequence.length) {
        const currentItem = sequence[index];

        setTarget(currentItem);

        speak(currentItem.name);

        index++;
      } else {
        clearInterval(memoryTimerRef.current);

        setTarget(null);
        setMemoryShowing(false);

        setMessage("Now repeat the sequence");
        speak("Now repeat the sequence");
      }
    }, boss ? 1100 : 1200);
  };

  /* =========================
     START GAME
  ========================= */

  const startGame = (selectedMode = mode) => {
    clearInterval(timerRef.current);
    clearInterval(memoryTimerRef.current);

    setMode(selectedMode);
    setRunning(true);

    setScore(0);
    setCombo(0);
    setLevel(1);
    setTime(90);
    setReactionTime(null);

    setMemorySequence([]);
    setMemoryIndex(0);
    setMemoryShowing(false);

    if (selectedMode === "memory") {
      createMemorySequence(false);
    } else if (selectedMode === "boss") {
      createMemorySequence(true);
    } else if (selectedMode === "random") {
      createRandomChallenge();
    } else {
      createTarget(selectedMode);
    }
  };

  /* =========================
     TIMER
  ========================= */

  useEffect(() => {
    if (!running || mode !== "timed") {
      return;
    }

    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTime((previous) => {
        if (previous <= 1) {
          clearInterval(timerRef.current);

          setRunning(false);
          setMessage("⏰ Time Over!");

          speak("Time over");

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [running, mode]);

  /* =========================
     MEMORY CLICK
  ========================= */

  const handleMemoryClick = (item) => {
    if (!running || memoryShowing) return;

    const expected =
      memorySequence[memoryIndex];

    if (!expected) return;

    if (item.id === expected.id) {
      const newCombo = combo + 1;
      const points = 100 + combo * 20;

      setScore((previous) => previous + points);
      setCombo(newCombo);

      setMessage(
        `✅ Correct! +${points} points`
      );

      speak("Correct");

      if (
        memoryIndex + 1 >=
        memorySequence.length
      ) {
        setLevel((previous) =>
          Math.min(10, previous + 1)
        );

        setMessage(
          "🎉 Excellent! Sequence completed!"
        );

        speak("Excellent. Sequence completed.");

        setTimeout(() => {
          if (running) {
            createMemorySequence(
              mode === "boss"
            );
          }
        }, 1000);
      } else {
        setMemoryIndex(
          (previous) => previous + 1
        );
      }
    } else {
      setCombo(0);

      setScore((previous) =>
        Math.max(0, previous - 25)
      );

      setMemoryIndex(0);

      setMessage("❌ Wrong! Try again");

      speak("Wrong. Try again.");

      setTimeout(() => {
        if (running) {
          createMemorySequence(
            mode === "boss"
          );
        }
      }, 900);
    }
  };

  /* =========================
     NORMAL CLICK
  ========================= */

  const handleNormalClick = (item) => {
    if (!running || memoryShowing || !target) {
      return;
    }

    let correct = false;

    if (mode === "find-object") {
      correct = item.id === target.id;
    }

    if (mode === "find-color") {
      correct = item.color === target.color;
    }

    if (mode === "speed") {
      correct = item.id === target.id;
    }

    if (mode === "timed") {
      correct = item.id === target.id;
    }

    /* RANDOM */

    if (mode === "random") {
      if (randomType === "Color") {
        correct =
          item.color === target.color;
      }

      if (
        randomType === "Animal" ||
        randomType === "Shape" ||
        randomType === "Fruit"
      ) {
        correct =
          item.category === randomType;
      }
    }

    if (correct) {
      const points = 100 + combo * 20;
      const newCombo = combo + 1;

      setScore((previous) => {
        const newScore = previous + points;

        setLevel(
          Math.min(
            10,
            Math.floor(newScore / 500) + 1
          )
        );

        return newScore;
      });

      setCombo(newCombo);

      if (mode === "speed") {
        const reaction =
          performance.now() -
          startTimeRef.current;

        setReactionTime(reaction);
      }

      setMessage(
        `✅ Correct! +${points} points`
      );

      speak("Correct");

      if (newCombo >= 3) {
        setTimeout(() => {
          speak(`${newCombo} combo`);
        }, 200);
      }

      setTimeout(() => {
        if (!running) return;

        if (mode === "random") {
          createRandomChallenge();
        } else {
          createTarget(mode);
        }
      }, 700);
    } else {
      setCombo(0);

      setScore((previous) =>
        Math.max(0, previous - 25)
      );

      setMessage("❌ Wrong! Try again");

      speak("Wrong. Try again.");
    }
  };

  /* =========================
     TILE CLICK
  ========================= */

  const handleTileClick = (item) => {
    if (
      mode === "memory" ||
      mode === "boss"
    ) {
      handleMemoryClick(item);
    } else {
      handleNormalClick(item);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = () => {
    clearInterval(timerRef.current);
    clearInterval(memoryTimerRef.current);

    setRunning(false);
    setLoggedIn(false);

    setLoginId("");
    setPassword("");
    setLoginError("");

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  /* =========================
     LOGIN PAGE
  ========================= */

  if (!loggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            🧠
          </div>

          <h1>Cognibox</h1>

          <p className="login-subtitle">
            Interactive Cognitive Training Box
          </p>

          <form onSubmit={handleLogin}>
            <label>Login ID</label>

            <input
              type="text"
              value={loginId}
              onChange={(e) =>
                setLoginId(e.target.value)
              }
              placeholder="Enter login ID"
              autoComplete="username"
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
            />

            {loginError && (
              <div className="login-error">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =========================
     MAIN APP
  ========================= */

  const currentMode = MODES.find(
    (item) => item[0] === mode
  );

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>🧠 Cognibox</h1>

          <p>
            Interactive Cognitive Training Box
          </p>
        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <main>
        {/* STATS */}

        <section className="stats">
          <div className="stat-card">
            <span>📊</span>

            <div>
              <small>Score</small>
              <strong>{score}</strong>
            </div>
          </div>

          <div className="stat-card">
            <span>🔥</span>

            <div>
              <small>Combo</small>
              <strong>{combo}</strong>
            </div>
          </div>

          <div className="stat-card">
            <span>🏆</span>

            <div>
              <small>Level</small>
              <strong>{level}</strong>
            </div>
          </div>

          {mode === "timed" && (
            <div className="stat-card">
              <span>⏱️</span>

              <div>
                <small>Time</small>
                <strong>{time}s</strong>
              </div>
            </div>
          )}

          {mode === "speed" &&
            reactionTime !== null && (
              <div className="stat-card">
                <span>⚡</span>

                <div>
                  <small>Reaction</small>

                  <strong>
                    {(
                      reactionTime / 1000
                    ).toFixed(2)}
                    s
                  </strong>
                </div>
              </div>
            )}
        </section>

        {/* MODES */}

        <section className="mode-section">
          <h2>Choose Training Mode</h2>

          <div className="mode-grid">
            {MODES.map((gameMode) => (
              <button
                key={gameMode[0]}
                className={`mode-card ${
                  mode === gameMode[0]
                    ? "selected-mode"
                    : ""
                }`}
                onClick={() => {
                  clearInterval(
                    timerRef.current
                  );

                  clearInterval(
                    memoryTimerRef.current
                  );

                  setMode(gameMode[0]);
                  setRunning(false);
                  setTarget(null);

                  setMessage(
                    "Press Start to begin"
                  );
                }}
              >
                <span className="mode-icon">
                  {gameMode[1]}
                </span>

                <strong>
                  {gameMode[2]}
                </strong>

                <small>
                  {gameMode[3]}
                </small>
              </button>
            ))}
          </div>
        </section>

        {/* GAME */}

        <section className="game-card">
          <div className="game-header">
            <div>
              <h2>
                {currentMode?.[2]}
              </h2>

              <p>{message}</p>
            </div>

            <div className="game-actions">
              <button
                className="voice-button"
                onClick={() =>
                  speak(message)
                }
              >
                🔊 Voice
              </button>

              <button
                className="start-button"
                onClick={() =>
                  startGame(mode)
                }
              >
                {running
                  ? "Restart"
                  : "Start"}
              </button>
            </div>
          </div>

          {/* RANDOM INFO */}

          {mode === "random" &&
            running && (
              <div className="random-info">
                <span>
                  🎲 Random Challenge
                </span>

                <strong>
                  {randomType}
                </strong>

                <small>
                  All 9 panels are glowing.
                  Find the correct answer.
                </small>
              </div>
            )}

          {/* TARGET */}

          {target &&
            !memoryShowing && (
              <div className="target-display">
                <span>Target</span>

                <strong>
                  {mode === "random"
                    ? randomType ===
                      "Color"
                      ? `Find ${target.color}`
                      : `Find ${randomType}`
                    : target.name}
                </strong>
              </div>
            )}

          {/* MEMORY */}

          {memoryShowing &&
            target && (
              <div className="memory-display">
                <span>
                  Remember
                </span>

                <div className="memory-object">
                  {target.emoji}
                </div>

                <strong>
                  {target.name}
                </strong>
              </div>
            )}

          {/* 3x3 GRID */}

          <div
            className={`tile-grid ${
              mode === "random" &&
              running
                ? "random-active-grid"
                : ""
            }`}
          >
            {ITEMS.map((item) => {
              const allGlow =
                mode === "random" &&
                running;

              const memoryHighlight =
                memoryShowing &&
                target?.id === item.id;

              return (
                <button
                  key={item.id}
                  className={`tile ${
                    allGlow
                      ? "all-glow"
                      : ""
                  } ${
                    memoryHighlight
                      ? "memory-highlight"
                      : ""
                  }`}
                  onClick={() =>
                    handleTileClick(item)
                  }
                >
                  <span className="tile-emoji">
                    {item.emoji}
                  </span>

                  <span className="tile-name">
                    {item.name}
                  </span>

                  <span className="tile-meta">
                    {item.color} •{" "}
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* RANDOM TYPES */}

          {mode === "random" && (
            <div className="random-description">
              <div>🎨 Color</div>
              <div>🐾 Animal</div>
              <div>🔷 Shape</div>
              <div>🍎 Fruit</div>
            </div>
          )}
        </section>
      </main>

      <footer>
        <p>
          Cognibox — Interactive Cognitive
          Training System
        </p>
      </footer>
    </div>
  );
}

export default App;