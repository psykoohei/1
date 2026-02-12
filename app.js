const modeName = document.getElementById('modeName');
const timeLeft = document.getElementById('timeLeft');
const promptTitle = document.getElementById('promptTitle');
const promptBody = document.getElementById('promptBody');
const choices = document.getElementById('choices');
const quickInput = document.getElementById('quickInput');
const startBtn = document.getElementById('startBtn');
const submitBtn = document.getElementById('submitBtn');
const stopBtn = document.getElementById('stopBtn');
const starBtn = document.getElementById('starBtn');
const laterBox = document.getElementById('laterBox');
const queueMode = document.getElementById('queueMode');
const faceUp = document.getElementById('faceUp');
const resultText = document.getElementById('resultText');

const bank = {
  seed: ['病院', '締切', '駅', '雨', 'カフェ', '体育館', '図書館', '救急車'],
  bridges: [
    { from: '雪', to: 'スマホ', sample: ['手袋', 'バッテリー', '濡れる'] },
    { from: '朝', to: '会議', sample: ['コーヒー', '資料', '遅刻'] },
    { from: '信号', to: 'エレベーター', sample: ['待機', '停止', 'ボタン'] }
  ],
  taboo: [
    { topic: 'カフェ', taboo: ['コーヒー', 'ラテ', 'スタバ'], sample: ['席取り', 'Wi‑Fi', 'ケーキ'] },
    { topic: '病院', taboo: ['医者', '薬', '注射'], sample: ['受付', '消毒', '診察券'] },
    { topic: '駅', taboo: ['電車', '改札', 'ホーム'], sample: ['発車ベル', '券売機', 'ベンチ'] }
  ],
  category: [
    { theme: '赤いもの', sample: ['りんご', '郵便ポスト', '消防車'] },
    { theme: '医療っぽい単語', sample: ['カルテ', '診断', '聴診器'] },
    { theme: '駅で見るもの', sample: ['時刻表', 'コインロッカー', '案内板'] }
  ],
  speed: [
    { topic: '締切', options: ['安心', '焦り', '海', '散歩'], answer: 1 },
    { topic: '待合', options: ['静寂', '爆走', '夕焼け', 'お祭り'], answer: 0 },
    { topic: '消毒', options: ['清潔', '豪雨', '宇宙', '恋愛'], answer: 0 }
  ]
};

const allModes = [
  { key: 'three', label: '3連想ブースト', sec: 7, input: true },
  { key: 'bridge', label: 'ブリッジ連想', sec: 10, input: true },
  { key: 'taboo', label: 'タブー連想', sec: 15, input: true },
  { key: 'category', label: 'カテゴリ連射', sec: 15, input: true },
  { key: 'speed', label: '選択式スピード連想', sec: 8, input: false }
];

let countdown = null;
let faceUpTimer = null;
let remaining = 0;
let currentMode = null;
let currentQuestion = null;
let selectedChoices = [];
let answerSubmitted = false;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function setIdle(message = '自動では次に進みません。列が動いたら中断してください。') {
  currentMode = null;
  currentQuestion = null;
  selectedChoices = [];
  answerSubmitted = false;
  modeName.textContent = '未開始';
  timeLeft.textContent = '--';
  promptTitle.textContent = '「もう1本」でスタート';
  promptBody.textContent = message;
  choices.innerHTML = '';
  quickInput.value = '';
  quickInput.classList.add('hidden');
  submitBtn.classList.add('hidden');
}

function startFaceUpReminder() {
  clearInterval(faceUpTimer);
  if (!faceUp.checked) return;
  faceUpTimer = setInterval(() => {
    if (navigator.vibrate) navigator.vibrate(120);
    alert('顔上げ：列の進みを確認してください');
  }, 30000);
}

function addChoice(text, toggle = true) {
  const btn = document.createElement('button');
  btn.className = 'choice';
  btn.textContent = text;
  if (toggle) {
    btn.onclick = () => {
      btn.classList.toggle('active');
      if (btn.classList.contains('active')) {
        selectedChoices.push(text);
      } else {
        selectedChoices = selectedChoices.filter((v) => v !== text);
      }
    };
  }
  choices.appendChild(btn);
  return btn;
}

function renderMode(mode) {
  choices.innerHTML = '';
  selectedChoices = [];
  answerSubmitted = false;
  submitBtn.classList.remove('hidden');
  quickInput.classList.toggle('hidden', !mode.input);

  if (mode.key === 'three') {
    currentQuestion = { seed: pick(bank.seed), sample: ['受付', '消毒', '待合'] };
    promptTitle.textContent = `お題: ${currentQuestion.seed}`;
    promptBody.textContent = '7秒で3語。候補をタップ＋1語入力でもOK。';
    ['場所', 'モノ', '人', '動作'].forEach((c) => addChoice(c));
  }

  if (mode.key === 'bridge') {
    currentQuestion = pick(bank.bridges);
    promptTitle.textContent = `${currentQuestion.from} → ${currentQuestion.to}`;
    promptBody.textContent = '1語でつなげてください。';
    ['手袋', '待機', '移動', '接続'].forEach((c) => addChoice(c));
  }

  if (mode.key === 'taboo') {
    currentQuestion = pick(bank.taboo);
    promptTitle.textContent = `お題: ${currentQuestion.topic}`;
    promptBody.textContent = `禁止語: ${currentQuestion.taboo.join(' / ')}`;
    ['店内', '席', '音', '空気感'].forEach((c) => addChoice(c));
  }

  if (mode.key === 'category') {
    currentQuestion = pick(bank.category);
    promptTitle.textContent = `カテゴリ: ${currentQuestion.theme}`;
    promptBody.textContent = '15秒だけ、思いつく語を連射。';
    ['りんご', '案内板', 'カルテ', '救急車'].forEach((c) => addChoice(c));
  }

  if (mode.key === 'speed') {
    quickInput.classList.add('hidden');
    currentQuestion = pick(bank.speed);
    promptTitle.textContent = `お題: ${currentQuestion.topic}`;
    promptBody.textContent = '一番近い連想を瞬時に選択。';
    currentQuestion.options.forEach((opt, i) => {
      const btn = addChoice(opt, false);
      btn.onclick = () => {
        selectedChoices = [opt];
        submitAnswer(i);
      };
    });
  }
}

function submitAnswer(speedIndex = null) {
  if (!currentMode || answerSubmitted) return;
  answerSubmitted = true;

  if (currentMode.key === 'speed') {
    const answer = currentQuestion.options[currentQuestion.answer];
    const chosen = speedIndex === null ? '未選択' : currentQuestion.options[speedIndex];
    const ok = speedIndex === currentQuestion.answer;
    resultText.textContent = `回答: ${chosen} / 正解: ${answer}（${ok ? '正解' : '不正解'}）`;
    forceStop('回答を表示しました。次は「もう1本」で開始。');
    return;
  }

  const freeWord = quickInput.value.trim();
  const userWords = [...selectedChoices, ...(freeWord ? [freeWord] : [])];
  const sample = currentQuestion.sample?.join('・') || '（サンプルなし）';
  resultText.textContent = `あなた: ${userWords.length ? userWords.join('・') : '未入力'} / 例: ${sample}`;
  forceStop('回答を表示しました。次は「もう1本」で開始。');
}

function beginRound() {
  clearInterval(countdown);
  const pool = queueMode.checked ? allModes.filter((m) => !m.input) : allModes;
  currentMode = pick(pool);
  remaining = currentMode.sec;
  modeName.textContent = currentMode.label;
  startFaceUpReminder();
  renderMode(currentMode);
  tick();
  countdown = setInterval(tick, 1000);
}

function tick() {
  timeLeft.textContent = `${remaining}秒`;
  if (remaining <= 0) {
    if (currentMode?.key === 'speed' && !answerSubmitted) {
      const answer = currentQuestion.options[currentQuestion.answer];
      resultText.textContent = `時間切れ。正解は「${answer}」`;
    } else if (!answerSubmitted) {
      const sample = currentQuestion?.sample?.join('・') || '（例なし）';
      resultText.textContent = `時間切れ。例: ${sample}`;
    }
    forceStop('完了。回答を確認してここで終了。');
    return;
  }
  remaining -= 1;
}

function forceStop(message = '中断しました。') {
  clearInterval(countdown);
  setIdle(message);
}

startBtn.onclick = beginRound;
submitBtn.onclick = () => submitAnswer();
stopBtn.onclick = () => forceStop('中断しました。回答は保存されません。');
starBtn.onclick = () => {
  const memo = `${new Date().toLocaleTimeString()} - ${promptTitle.textContent}`;
  const li = document.createElement('li');
  li.textContent = memo;
  laterBox.prepend(li);
};

queueMode.onchange = () => {
  if (queueMode.checked) {
    forceStop('列モードON：入力型を封印しました。');
  }
};

setIdle();
