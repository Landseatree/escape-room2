/* ============================================================
   謎解き脱出ブース - メインスクリプト
   ============================================================ */

// ---- 設定 ----
const FOLDERS = ["no1", "no2", "no3", "no4", "no5"];
const TIME_LIMIT = { 1: 90, 2: 75, 3: 60 }; // 秒
const RESULT_SCREEN_DURATION = 5000; // ms
const WRONG_OVERLAY_DURATION = 2000; // ms

// ---- 画面要素 ----
const screens = {
  waiting: document.getElementById("screen-waiting"),
  question: document.getElementById("screen-question"),
  correct: document.getElementById("screen-correct"),
  fail: document.getElementById("screen-fail"),
};

const timerBadge = document.querySelector(".timer-badge");
const timerDisplay = document.getElementById("timer-display");
const questionImage = document.getElementById("question-image");
const answerText = document.getElementById("answer-text");
const keypadEl = document.getElementById("keypad");
const wrongOverlay = document.getElementById("wrong-overlay");

// ---- 状態 ----
let currentAnswer = "";
let correctAnswer = "";
let timeRemaining = 0;
let timerIntervalId = null;

// ============================================================
// 画面遷移
// ============================================================
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ============================================================
// 画面1：待機画面 → 人数選択
// ============================================================
document.querySelectorAll(".player-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const players = parseInt(btn.dataset.players, 10);
    startQuestion(players);
  });
});

// ============================================================
// 画面2：問題画面の開始
// ============================================================
async function startQuestion(players) {
  const folder = FOLDERS[Math.floor(Math.random() * FOLDERS.length)];

  // 問題画像と答えを取得
  try {
    const [imgOk, answerRes] = await Promise.all([
      preloadImage(`${folder}/question.jpg`),
      fetch(`${folder}/answer.txt`),
    ]);
    correctAnswer = (await answerRes.text()).trim();
    questionImage.src = `${folder}/question.jpg?_=${Date.now()}`;
  } catch (err) {
    console.error("問題データの読み込みに失敗しました:", err);
    correctAnswer = "";
    questionImage.src = "";
  }

  currentAnswer = "";
  updateAnswerDisplay();
  buildKeypad();

  timeRemaining = TIME_LIMIT[players];
  updateTimerDisplay();
  timerBadge.classList.remove("warning");

  showScreen("question");

  clearInterval(timerIntervalId);
  timerIntervalId = setInterval(() => {
    timeRemaining -= 1;
    updateTimerDisplay();
    if (timeRemaining <= 10) timerBadge.classList.add("warning");
    if (timeRemaining <= 0) {
      clearInterval(timerIntervalId);
      goToFail();
    }
  }, 1000);
}

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
}

function updateTimerDisplay() {
  const m = Math.max(0, Math.floor(timeRemaining / 60));
  const s = Math.max(0, timeRemaining % 60);
  timerDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ============================================================
// キーパッド生成（ひらがな 5列 ＋ 削除 ＋ 確定）
// ============================================================
const GOJUON_ROWS = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "", "ゆ", "", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "", "を", "", "ん"],
];

function buildKeypad() {
  keypadEl.innerHTML = "";

  GOJUON_ROWS.forEach(row => {
    row.forEach(char => {
      const key = document.createElement("button");
      if (char === "") {
        key.className = "key key-empty";
        key.disabled = true;
      } else {
        key.className = "key";
        key.textContent = char;
        key.addEventListener("click", () => {
          currentAnswer += char;
          updateAnswerDisplay();
        });
      }
      keypadEl.appendChild(key);
    });
  });

  const deleteKey = document.createElement("button");
  deleteKey.className = "key key-delete";
  deleteKey.textContent = "1文字削除";
  deleteKey.addEventListener("click", () => {
    currentAnswer = currentAnswer.slice(0, -1);
    updateAnswerDisplay();
  });
  keypadEl.appendChild(deleteKey);

  const confirmKey = document.createElement("button");
  confirmKey.className = "key key-confirm";
  confirmKey.textContent = "確定";
  confirmKey.addEventListener("click", checkAnswer);
  keypadEl.appendChild(confirmKey);
}

function updateAnswerDisplay() {
  answerText.textContent = currentAnswer;
}

// ============================================================
// 確定キー：正誤判定
// ============================================================
function checkAnswer() {
  if (currentAnswer === correctAnswer) {
    clearInterval(timerIntervalId);
    goToCorrect();
  } else {
    showWrongOverlay();
  }
}

function showWrongOverlay() {
  wrongOverlay.classList.add("show");
  setTimeout(() => {
    wrongOverlay.classList.remove("show");
    currentAnswer = "";
    updateAnswerDisplay();
  }, WRONG_OVERLAY_DURATION);
}

// ============================================================
// 画面3：正解画面
// ============================================================
function goToCorrect() {
  showScreen("correct");
  setTimeout(() => showScreen("waiting"), RESULT_SCREEN_DURATION);
}

// ============================================================
// 画面4：脱落画面
// ============================================================
function goToFail() {
  showScreen("fail");
  setTimeout(() => showScreen("waiting"), RESULT_SCREEN_DURATION);
}

// ============================================================
// 初期表示
// ============================================================
showScreen("waiting");
