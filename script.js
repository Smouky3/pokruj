// ===================== ZÁKLADNÍ PROMĚNNÉ A PŘIPOJENÍ =====================

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];
let hand = [];
let selectedIndices = [];
let canSelectCards = true;

const cardsDiv = document.getElementById("cards");
const drawBtn = document.getElementById("drawBtn");
const replaceBtn = document.getElementById("replaceBtn");
const result = document.getElementById("result");
const scoreDisplay = document.getElementById("score");
const betDisplay = document.getElementById("bet");
const changeDisplay = document.getElementById("change");
const jackpotDisplay = document.getElementById("jackpotDisplay");
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');
const leaderboardBody = document.getElementById('leaderboardBody');

let betBonus = 0; // bonus k sázce
const betBonusLink = document.getElementById('betBonusLink');
const betBonusModal = document.getElementById('betBonusModal');
const revealCardBtn = document.getElementById('revealCardBtn');
const closeBetBonusBtn = document.getElementById('closeBetBonusBtn');
const coveredCard = document.getElementById('coveredCard');
const revealedCard = document.getElementById('revealedCard');
const betBonusInfo = document.getElementById('betBonusInfo');

let pokerStats = {};
let score = 20;
let bet = 1;
let jackpot = 0;

let chips = 0;
const chipsDisplay = document.getElementById('chips');

const jackpotDocRef = db.collection('game').doc('jackpot');

jackpotDocRef.onSnapshot(doc => {
  if (doc.exists) {
    jackpot = doc.data().amount || 0;
    jackpotDisplay.textContent = jackpot;
  } else {
    jackpotDocRef.set({ amount: 0 });
  }
});

async function addToJackpot(amountToAdd) {
  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(jackpotDocRef);
      if (!doc.exists) {
        transaction.set(jackpotDocRef, { amount: amountToAdd });
        jackpot = amountToAdd;
      } else {
        const currentAmount = doc.data().amount || 0;
        const newAmount = currentAmount + amountToAdd;
        transaction.update(jackpotDocRef, { amount: newAmount });
        jackpot = newAmount;
      }
    });
  } catch (e) {
    console.error("Chyba při přidávání do jackpotu:", e);
  }
}

async function payoutJackpot() {
  const payoutAmount = jackpot;
  jackpot = 0;
  jackpotDisplay.textContent = jackpot;
  try {
    await jackpotDocRef.set({ amount: 0 });
  } catch (e) {
    console.error("Chyba při resetování jackpotu:", e);
  }
  return payoutAmount;
}

// ===================== SÁZKY / SKÓRE MILESTONY =====================

function getNextMilestones(score, count = 3) {
  const milestones = [
    50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 3800,
    4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300
  ];
  const result = [];
  let idx = milestones.findIndex(m => score < m);
  if (idx === -1) {
    let base = 17300;
    let step = 2000;
    let startScore = score < base ? base : base + step * Math.floor((score - base) / step);
    for (let i = 0; i < count; i++) {
      let milestoneScore = startScore + step * i;
      result.push(milestoneScore);
    }
  } else {
    for (let i = 0; i < count; i++) {
      if (idx + i < milestones.length) {
        result.push(milestones[idx + i]);
      } else {
        let base = 17300;
        let step = 2000;
        let extraIdx = idx + i - milestones.length;
        result.push(base + step * extraIdx);
      }
    }
  }
  return result;
}

function getBet(score) {
  if (score < 50) return 1;
  if (score < 150) return 2;
  if (score < 300) return 3;
  if (score < 500) return 4;
  if (score < 800) return 5;
  if (score < 1200) return 6;
  if (score < 1700) return 7;
  if (score < 2300) return 8;
  if (score < 3000) return 9;
  if (score < 3800) return 10;
  if (score < 4700) return 11;
  if (score < 5700) return 12;
  if (score < 6800) return 13;
  if (score < 8000) return 14;
  if (score < 9300) return 15;
  if (score < 10700) return 16;
  if (score < 12200) return 17;
  if (score < 13800) return 18;
  if (score < 15500) return 19;
  if (score < 17300) return 20;
  return 20 + Math.floor((score - 17300) / 2000);
}

function updateUI() {
  scoreDisplay.textContent = score;
  betDisplay.textContent = bet + (betBonus > 0 ? ` (+${betBonus})` : '');
  jackpotDisplay.textContent = jackpot;
  changeDisplay.textContent = '';
  chipsDisplay.textContent = chips;

  const milestoneBody = document.getElementById('nextBetMilestoneBody');
  milestoneBody.innerHTML = '';

  const currentRow = document.createElement('tr');
  currentRow.innerHTML = `
    <td><strong>${score}</strong></td>
    <td><strong>${bet}</strong></td>
    <td>Aktuální skóre</td>
  `;
  milestoneBody.appendChild(currentRow);

  const nextMilestones = getNextMilestones(score, 2);

  nextMilestones.forEach(milestone => {
    const diff = milestone - score;
    const nextBetValue = getBet(milestone);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${milestone}</td>
      <td>${nextBetValue}</td>
      <td>${diff > 0 ? diff : 0}</td>
    `;
    milestoneBody.appendChild(tr);
  });
}

// ===================== AUTH / PROFIL / ŽEBŘÍČEK =====================

auth.onAuthStateChanged(user => {
  const onGamePage = window.location.pathname.includes('index.html');
  const userInfo = document.getElementById('userInfo');

  if (user) {
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (loginBtn) loginBtn.style.display = 'none';

    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        const nickname = data.nickname || '???';
        score = data.score ?? 20;
        bet = data.bet ?? 1;
        chips = data.chips ?? 0;
        betBonus = data.betBonus ?? 0;
        updateUI();
        pokerStats = data.stats ?? {};
        userInfo.style.display = 'inline-block';
        userInfo.textContent = `Přihlášen: ${nickname}`;
        updateUI();
      }
    }).catch(loadFromLocalStorage);

    if (typeof loadLeaderboard === "function") {
      loadLeaderboard();
    }

  } else {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userInfo) userInfo.textContent = '';

    if (onGamePage) {
      window.location.href = 'login.html';
    }
  }
});

function loadFromLocalStorage() {
  score = parseInt(localStorage.getItem("pokerScore")) || 20;
  bet = parseInt(localStorage.getItem("pokerBet")) || 1;
  pokerStats = JSON.parse(localStorage.getItem("pokerStats")) || {};
  updateUI();
}

function saveData() {
  const user = auth.currentUser;
  if (user) {
    db.collection('users').doc(user.uid).get().then(doc => {
      const existingData = doc.data() || {};
      const nickname = existingData.nickname || '???';

      const { dailyStats: newDailyStats = {}, ...pureStats } = pokerStats;
      const existingDailyStats = existingData.dailyStats || {};

      const today = new Date().toISOString().split('T')[0];

      const todayClient = newDailyStats[today] || {};
      const todayServer = existingDailyStats[today] || {};

      const mergedToday = { ...todayServer };
      for (let key in todayClient) {
        mergedToday[key] = (mergedToday[key] || 0) + todayClient[key];
      }

      const updatedDailyStats = {
        ...existingDailyStats,
        [today]: mergedToday
      };

      db.collection('users').doc(user.uid).set({
        nickname,
        score,
        bet,
        chips,
        betBonus,
        stats: pureStats,
        dailyStats: updatedDailyStats
      })
      .then(() => {
        delete pokerStats.dailyStats[today];
      });
    });
  } else {
    localStorage.setItem("pokerScore", score);
    localStorage.setItem("pokerBet", bet);
    localStorage.setItem("pokerStats", JSON.stringify(pokerStats));
  }
}

logoutBtn.onclick = () => {
  userInfo.textContent = '';
  userInfo.style.display = 'none';
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
};

function loadLeaderboard() {
  leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Načítám data...</td></tr>';

  db.collection('users')
    .orderBy('score', 'desc')
    .limit(20)
    .get()
    .then(snapshot => {
      leaderboardBody.innerHTML = '';
      let position = 1;
      snapshot.forEach(doc => {
        const data = doc.data();
        const nickname = data.nickname || '???';
        const score = data.score || 0;

        const tr = document.createElement('tr');
        tr.appendChild(Object.assign(document.createElement('td'), { textContent: position++ }));
        tr.appendChild(Object.assign(document.createElement('td'), { textContent: nickname }));
        tr.appendChild(Object.assign(document.createElement('td'), { textContent: score }));
        leaderboardBody.appendChild(tr);
      });

      if (leaderboardBody.children.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Žádní hráči k zobrazení.</td></tr>';
      }
    })
    .catch(error => {
      leaderboardBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: red;">Chyba při načítání: ${error.message}</td></tr>`;
    });
}

// ===================== KARTY =====================

function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealCards() {
  localStorage.removeItem('pokerOriginHand');
  createDeck();
  shuffleDeck();
  hand = deck.splice(0, 5);
  localStorage.setItem('pokerOriginHand', JSON.stringify(hand));
  selectedIndices = [];
  canSelectCards = true;
  displayCards();
  replaceBtn.disabled = false;
  drawBtn.disabled = true;
  result.textContent = '';
  changeDisplay.textContent = '';
}

function displayCards() {
  cardsDiv.innerHTML = '';
  hand.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    cardEl.textContent = `${card.value}${card.suit}`;
    if (selectedIndices.includes(index)) cardEl.classList.add("selected");
    cardEl.style.color = (card.suit === '♥' || card.suit === '♦') ? 'red' : 'black';
    cardEl.onclick = () => {
      if (canSelectCards) toggleCard(index);
    };
    cardsDiv.appendChild(cardEl);
  });
}

function toggleCard(index) {
  if (selectedIndices.includes(index)) {
    selectedIndices = selectedIndices.filter(i => i !== index);
  } else {
    selectedIndices.push(index);
  }
  displayCards();
}

// ===================== DENNÍ ÚKOLY =====================

const dailyTasks = [
  {
    key: 'gamesPlayed',
    label: '1000 her',
    goal: 1000,
    reward: () => 50 * bet
  },
  {
    key: 'pairs',
    label: '1000x pár',
    goal: 1000,
    reward: () => 50 * bet
  },
  {
    key: 'twoPairs',
    label: '300x dvě dvojice',
    goal: 300,
    reward: () => 50 * bet
  },
  {
    key: 'trips',
    label: '200x trojice',
    goal: 200,
    reward: () => 50 * bet
  },
  {
    key: 'winningStreak10',
    label: '20x výhra v radě',
    goal: 20,
    reward: () => 50 * bet
  }
];

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadDailyTasks() {
  const todayKey = getTodayKey();
  let tasks = JSON.parse(localStorage.getItem('dailyTasks_' + todayKey));
  if (!tasks) {
    tasks = {};
    dailyTasks.forEach(task => {
      tasks[task.key] = { value: 0, completed: false, rewardReceived: false };
    });
    localStorage.setItem('dailyTasks_' + todayKey, JSON.stringify(tasks));
  }
  return tasks;
}

function saveDailyTasks(tasks) {
  const todayKey = getTodayKey();
  localStorage.setItem('dailyTasks_' + todayKey, JSON.stringify(tasks));
}

function renderDailyTasks(tasks) {
  const box = document.getElementById('dailyTasksList');
  if (!box) return;
  box.innerHTML = '';
  dailyTasks.forEach(task => {
    const state = tasks[task.key];
    const percent = Math.min(100, Math.round((state.value / task.goal) * 100));
    const completed = state.completed;
    const progressBar =
      `<div class="daily-tasks-progress-bg">
        <div class="daily-tasks-progress-bar" style="width:${percent}%;"></div>
      </div>
      <div style="font-size:12px; color:${completed ? '#baff77' : '#ffd700'}; font-weight:600;">
        ${Math.min(state.value, task.goal)} / ${task.goal}
      </div>`;
    box.innerHTML += `
      <tr${completed ? ' class="daily-tasks-completed"' : ''}>
        <td style="text-align:left;">
          ${task.label}
        </td>
        <td>
          ${progressBar}
        </td>
        <td>
          ${completed ? `<span>✓ +${task.reward()}</span>` : `+${task.reward()}`}
        </td>
      </tr>
    `;
  });
}

let winningStreak = 0;

function updateDailyTasksAfterGame(evaluation) {
  const tasks = loadDailyTasks();

  // Úkoly podle definice v dailyTasks
  dailyTasks.forEach(task => {
    switch (task.key) {
      case 'gamesPlayed':
        tasks[task.key].value++;
        if (tasks[task.key].value >= task.goal) tasks[task.key].completed = true;
        break;
      case 'pairs':
        if (evaluation === "Pár") {
          tasks[task.key].value++;
          if (tasks[task.key].value >= task.goal) tasks[task.key].completed = true;
        }
        break;
      case 'twoPairs':
        if (evaluation === "Dva páry") {
          tasks[task.key].value++;
          if (tasks[task.key].value >= task.goal) tasks[task.key].completed = true;
        }
        break;
      case 'trips':
        if (evaluation === "Trojice") {
          tasks[task.key].value++;
          if (tasks[task.key].value >= task.goal) tasks[task.key].completed = true;
        }
        break;
      case 'winningStreak10':
        if (evaluation !== "Žádná kombinace") {
          winningStreak++;
        } else {
          winningStreak = 0;
        }
        if (winningStreak > tasks[task.key].value) {
          tasks[task.key].value = winningStreak;
        }
        if (tasks[task.key].value >= task.goal) tasks[task.key].completed = true;
        break;
      default: break;
    }
  });

  // Odměny
  dailyTasks.forEach(task => {
    if (tasks[task.key].completed && !tasks[task.key].rewardReceived) {
      score += task.reward();
      tasks[task.key].rewardReceived = true;
      changeDisplay.textContent = `+${task.reward()} za splnění úkolu!`;
      saveData();
    }
  });

  saveDailyTasks(tasks);
  renderDailyTasks(tasks);
}

document.addEventListener('DOMContentLoaded', () => {
  renderDailyTasks(loadDailyTasks());
});

// ===================== PRŮBĚH HRY =====================

async function replaceCards() {
  for (let i = 0; i < hand.length; i++) {
    if (!selectedIndices.includes(i)) {
      hand[i] = deck.pop();
    }
  }

  localStorage.removeItem('pokerOriginHand');
  canSelectCards = false;
  displayCards();
  replaceBtn.disabled = true;
  drawBtn.disabled = false;

  const evaluation = evaluateHand(hand);
  const payout = calculatePayout(evaluation);

  if (payout > 0) {
    const contribution = Math.floor(payout * 0.10);
    if (contribution > 0) {
      await addToJackpot(contribution);
    }
  }

  let finalPayout = payout;

  if (evaluation === "Straight Flush") {
    const jackpotPayout = await payoutJackpot();
    finalPayout += jackpotPayout;
    changeDisplay.textContent += ` + JACKPOT ${jackpotPayout}! 🎉`;
  }

  if (finalPayout < 0) finalPayout = 0;

  score += finalPayout;

  const today = new Date().toISOString().split('T')[0];
  pokerStats[evaluation] = (pokerStats[evaluation] || 0) + 1;
  pokerStats.dailyStats = pokerStats.dailyStats || {};
  const todayStats = pokerStats.dailyStats[today] || {};
  todayStats[evaluation] = (todayStats[evaluation] || 0) + 1;
  pokerStats.dailyStats[today] = todayStats;

  bet = getBet(score);
  if (!pokerStats.gamesPlayed) pokerStats.gamesPlayed = 0;
pokerStats.gamesPlayed++;
if (pokerStats.gamesPlayed % 100 === 0) {
  chips++;
  changeDisplay.textContent = "+1 žeton za 100 her!";
}
updateUI();
saveData();

  scoreDisplay.textContent = score;
  betDisplay.textContent = bet;
  jackpotDisplay.textContent = jackpot;

  const sign = finalPayout >= 0 ? "+" : "";
  const evaluationText = evaluation === "Žádná kombinace" ? "Prohra" : evaluation;
  result.textContent = `${evaluationText}! (${sign}${finalPayout})`;
  changeDisplay.textContent = '';

  updateUI();
  loadLeaderboard();

  // Vyhodnocení denních úkolů
  updateDailyTasksAfterGame(evaluation);
}

// ===================== HODNOCENÍ HERNÍ KOMBINACE A VÝPLATY =====================

function evaluateHand(hand) {
  const valueMap = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  let valuesNum = hand.map(card => valueMap[card.value]).sort((a, b) => a - b);
  let suits = hand.map(card => card.suit);
  let counts = {};
  valuesNum.forEach(v => counts[v] = (counts[v] || 0) + 1);
  let countValues = Object.values(counts).sort((a, b) => b - a);
  let isFlush = suits.every(s => s === suits[0]);
  let isStraight = valuesNum.every((v, i, a) => i === 0 || v === a[i - 1] + 1) ||
    (JSON.stringify(valuesNum) === JSON.stringify([2, 3, 4, 5, 14]));

  if (isStraight && isFlush && Math.max(...valuesNum) === 14) return "Royal Flush";
  if (isStraight && isFlush) return "Straight Flush";
  if (countValues[0] === 4) return "Poker (Čtveřice)";
  if (countValues[0] === 3 && countValues[1] === 2) return "Full House";
  if (isFlush) return "Flush";
  if (isStraight) return "Straight";
  if (countValues[0] === 3) return "Trojice";
  if (countValues[0] === 2 && countValues[1] === 2) return "Dva páry";
  if (countValues[0] === 2) return "Pár";
  return "Žádná kombinace";
}

function calculatePayout(evaluation) {
  const payoutTable = {
    "Žádná kombinace": -1,
    "Pár": 1.5,
    "Dva páry": 2,
    "Trojice": 4,
    "Straight": 7,
    "Flush": 12,
    "Full House": 17,
    "Poker (Čtveřice)": 25,
    "Straight Flush": 40,
    "Royal Flush": 70
  };
  let multiplier = payoutTable[evaluation] ?? 0;
  return Math.round(multiplier * (bet + betBonus));
}

// ===================== OVLÁDÁNÍ =====================

drawBtn.onclick = dealCards;
replaceBtn.onclick = replaceCards;
replaceBtn.disabled = true;

// ===================== CHAT + EMOJI =====================

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = chatInput.value.trim();
  const user = auth.currentUser;
  if (message && user) {
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        const nickname = doc.exists && doc.data().nickname ? doc.data().nickname : "Hráč";
        db.collection("chat").add({
          uid: user.uid,
          nickname: nickname,
          message: message,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        chatInput.value = '';
      });
  }
}

db.collection("chat")
  .orderBy("timestamp", "desc")
  .limit(50)
  .onSnapshot(snapshot => {
    chatMessages.innerHTML = '';
    const messages = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const time = data.timestamp?.toDate().toLocaleTimeString() || '';
      if (data.type === "system" && data.text) {
        messages.push(`
          <div style="color:#92ff92; font-style:italic;">
            <span style="color:#666; font-size:12px;">${time}</span>
            <span style="margin-left: 6px;">${data.text}</span>
          </div>
        `);
      } else {
        messages.push(`
          <div>
            <span style="color:#666; font-size:12px;">${time}</span>
            <strong style="margin-left: 6px;">${data.nickname || 'Hráč'}:</strong> ${data.message || ''}
          </div>
        `);
      }
    });
    chatMessages.innerHTML = messages.reverse().join('');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

const emojiToggle = document.getElementById("emojiToggle");
const emojiPicker = document.getElementById("emojiPicker");
emojiToggle.addEventListener("click", () => {
  emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
});
emojiPicker.addEventListener("click", (e) => {
  if (e.target.tagName === "SPAN") {
    chatInput.value += e.target.textContent;
    chatInput.focus();
  }
});
// Otevření/zavření minihry
betBonusLink.onclick = () => {
  betBonusModal.style.display = "flex";
  coveredCard.style.display = "flex";
  revealedCard.style.display = "none";
  betBonusInfo.textContent = "Za 5 žetonů odhalíš kartu a můžeš získat trvalý bonus k sázce!";
  revealCardBtn.disabled = false;
};
closeBetBonusBtn.onclick = () => {
  betBonusModal.style.display = "none";
};

// Kartová minihra
const bonusCardValues = [
  { value: "2", bonus: 0 },
  { value: "3", bonus: 0 },
  { value: "4", bonus: 0 },
  { value: "5", bonus: 0 },
  { value: "6", bonus: 1 },
  { value: "7", bonus: 1 },
  { value: "8", bonus: 1 },
  { value: "9", bonus: 1 },
  { value: "10", bonus: 1 },
  { value: "J", bonus: 2 },
  { value: "Q", bonus: 3 },
  { value: "K", bonus: 4 },
  { value: "A", bonus: 5 }
];
const bonusCardSuits = ["♠","♥","♦","♣"];

revealCardBtn.onclick = () => {
  if (chips < 5) {
    betBonusInfo.textContent = "Nemáš dost žetonů!";
    return;
  }
  chips -= 5;
  updateUI();
  saveData();

  // Náhodná karta
  const c = bonusCardValues[Math.floor(Math.random()*bonusCardValues.length)];
  const s = bonusCardSuits[Math.floor(Math.random()*bonusCardSuits.length)];
  const bonus = c.bonus;
  const cardTxt = `${c.value}${s}`;
  
  coveredCard.style.display = "none";
  revealedCard.style.display = "block";
  revealedCard.textContent = `${cardTxt} ➔ +${bonus} k sázce!`;

  // Navýšit trvale bonus
  betBonus += bonus;
  betBonusInfo.textContent = `Získáváš trvalý bonus: +${bonus} k sázce!`;

  // Uložení bonusu k uživateli
  const user = auth.currentUser;
  if (user) {
    db.collection('users').doc(user.uid).set({
      betBonus: betBonus
    }, { merge: true });
  } else {
    localStorage.setItem('betBonus', betBonus);
  }

  updateUI();
  revealCardBtn.disabled = true;
};
