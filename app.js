const modeName = document.getElementById('modeName');
const timeLeft = document.getElementById('timeLeft');
const promptTitle = document.getElementById('promptTitle');
const promptBody = document.getElementById('promptBody');
const choices = document.getElementById('choices');
const quickInput = document.getElementById('quickInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const starBtn = document.getElementById('starBtn');
const laterBox = document.getElementById('laterBox');
const queueMode = document.getElementById('queueMode');
const faceUp = document.getElementById('faceUp');

const bank = {
  seed: ['病院', '締切', '駅', '雨', 'カフェ', '体育館', '図書館', '救急車'],
  bridges: [['雪', 'スマホ'], ['朝', '会議'], ['駅', '静けさ'], ['信号', 'エレベーター']],
  taboo: [
    { topic: 'カフェ', taboo: ['コーヒー', 'ラテ', 'スタバ'] },
    { topic: '病院', taboo: ['医者', '薬', '注射'] },
    { topic: '駅', taboo: ['電車', '改札', 'ホーム'] }
  ],
  category: ['赤いもの', '医療っぽい単語', '駅で見るもの', '焦りを感じる場面'],
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

let current = null;
let countdown = null;
let faceUpTimer = null;
let remaining = 0;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function setIdle(message = '自動では次に進みません。列が動いたら中断してください。') {
  current = null;
  modeName.textContent = '未開始';
  timeLeft.textContent = '--';
  promptTitle.textContent = '「もう1本」でスタート';
  promptBody.textContent = message;
  choices.innerHTML = '';
  quickInput.value = '';
  quickInput.classList.add('hidden');
}

function startFaceUpReminder() {
  clearInterval(faceUpTimer);
  if (!faceUp.checked) return;
  faceUpTimer = setInterval(() => {
    if (navigator.vibrate) navigator.vibrate(100);
    alert('顔上げ：列の進みを確認してください');
  }, 30000);
}

function renderMode(mode) {
  choices.innerHTML = '';
  quickInput.classList.toggle('hidden', !mode.input);

  if (mode.key === 'three') {
    const word = pick(bank.seed);
    promptTitle.textContent = `お題: ${word}`;
    promptBody.textContent = '7秒で3語。候補をタップ＋1語入力でもOK。';
    ['場所', 'モノ', '人', '動作'].forEach((c) => addChoice(c));
  }
  if (mode.key === 'bridge') {
    const [a, b] = pick(bank.bridges);
    promptTitle.textContent = `${a} → ${b}`;
    promptBody.textContent = '1語でつなげてください。';
  }
  if (mode.key === 'taboo') {
    const t = pick(bank.taboo);
    promptTitle.textContent = `お題: ${t.topic}`;
    promptBody.textContent = `禁止語: ${t.taboo.join(' / ')}`;
  }
  if (mode.key === 'category') {
    promptTitle.textContent = `カテゴリ: ${pick(bank.category)}`;
    promptBody.textContent = '15秒だけ、思いつく語を連射。';
  }
  if (mode.key === 'speed') {
    const q = pick(bank.speed);
    promptTitle.textContent = `お題: ${q.topic}`;
    promptBody.textContent = '一番近い連想を瞬時に選択。';
    q.options.forEach((opt, i) => {
      const btn = addChoice(opt);
      btn.onclick = () => {
        promptBody.textContent = i === q.answer ? 'OK、次は押さない限り始まりません。' : '不正解でもここで終了。';
        forceStop();
      };
    });
  }
}

function addChoice(text) {
  const btn = document.createElement('button');
  btn.className = 'choice';
  btn.textContent = text;
  choices.appendChild(btn);
  return btn;
}

function beginRound() {
  clearInterval(countdown);
  const pool = queueMode.checked ? allModes.filter((m) => !m.input) : allModes;
  current = pick(pool);
  remaining = current.sec;
  modeName.textContent = current.label;
  startFaceUpReminder();
  renderMode(current);
  tick();
  countdown = setInterval(tick, 1000);
}

function tick() {
  timeLeft.textContent = `${remaining}秒`;
  if (remaining <= 0) {
    forceStop('完了。余韻は残さずここで終わり。');
    return;
  }
  remaining -= 1;
}

function forceStop(message = '中断しました。結果は表示しません。') {
  clearInterval(countdown);
  setIdle(message);
}

startBtn.onclick = beginRound;
stopBtn.onclick = () => forceStop();
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
