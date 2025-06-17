const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];
let hand = [];
let selectedIndices = [];

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

let pokerStats = {};
let score = 20;
let bet = 1;
let jackpot = 0;

// Firestore reference na společný jackpot
const jackpotDocRef = db.collection('game').doc('jackpot');

// Sledování jackpotu realtime
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

function updateUI() {
  scoreDisplay.textContent = score;
  betDisplay.textContent = bet;
  jackpotDisplay.textContent = jackpot;
  result.textContent = '';
  changeDisplay.textContent = '';
}

// Přepínání viditelnosti tlačítek podle přihlášení
auth.onAuthStateChanged(user => {
  if (user) {
    logoutBtn.style.display = 'inline-block';
    loginBtn.style.display = 'none';

    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        score = data.score ?? 20;
        bet = data.bet ?? 1;
        pokerStats = data.stats ?? {};
        updateUI();
      } else {
        score = 20; bet = 1; pokerStats = {};
        updateUI();
      }
    }).catch(() => {
      loadFromLocalStorage();
    });

    loadLeaderboard();

  } else {
    logoutBtn.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    loadFromLocalStorage();

    leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Pro zobrazení žebříčku se musíš přihlásit.</td></tr>';
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
    db.collection('users').doc(user.uid).set({
      score,
      bet,
      stats: pokerStats
    });
  } else {
    localStorage.setItem("pokerScore", score);
    localStorage.setItem("pokerBet", bet);
    localStorage.setItem("pokerStats", JSON.stringify(pokerStats));
  }
}

logoutBtn.onclick = () => {
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

        const tdPos = document.createElement('td');
        tdPos.textContent = position++;

        const tdNick = document.createElement('td');
        tdNick.textContent = nickname;

        const tdScore = document.createElement('td');
        tdScore.textContent = score;

        tr.appendChild(tdPos);
        tr.appendChild(tdNick);
        tr.appendChild(tdScore);

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

// --- HERNÍ LOGIKA ---

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
  const originHand = localStorage.getItem('pokerOriginHand');
  if (originHand) {
    hand = JSON.parse(originHand);
    createDeck();
    deck = deck.filter(card => !hand.some(h => h.suit === card.suit && h.value === card.value));
  } else {
    createDeck();
    shuffleDeck();
    hand = deck.splice(0, 5);
    localStorage.setItem('pokerOriginHand', JSON.stringify(hand));
  }

  selectedIndices = [];
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
    cardEl.onclick = () => toggleCard(index);
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

async function replaceCards() {
  for (let i = 0; i < hand.length; i++) {
    if (!selectedIndices.includes(i)) {
      hand[i] = deck.pop();
    }
  }

  localStorage.removeItem('pokerOriginHand');
  displayCards();
  replaceBtn.disabled = true;
  drawBtn.disabled = false;

  const evaluation = evaluateHand(hand);
  const payout = calculatePayout(evaluation);

  // Přidání 10% z výhry do společného jackpotu, pokud je výhra kladná
  if (payout > 0) {
    const contribution = Math.floor(payout * 0.10);
    if (contribution > 0) {
      await addToJackpot(contribution);
    }
  }

  let finalPayout = payout;

  if (evaluation === "Poker (Čtveřice)") {
    const jackpotPayout = await payoutJackpot();
    finalPayout += jackpotPayout;
    changeDisplay.textContent += ` + JACKPOT ${jackpotPayout}! 🎉`;
  }

  score += finalPayout;

  pokerStats[evaluation] = (pokerStats[evaluation] || 0) + 1;

  saveData();

  if (score >= 3000) bet = 50;
  else if (score >= 2000) bet = 25;
  else if (score >= 1000) bet = 10;
  else if (score >= 500) bet = 5;
  else bet = 1;

  scoreDisplay.textContent = score;
  betDisplay.textContent = bet;
  jackpotDisplay.textContent = jackpot;

  const sign = finalPayout >= 0 ? "+" : "";
  result.textContent = `${evaluation}! (${sign}${finalPayout})`;
  changeDisplay.textContent = '';

  loadLeaderboard();
}

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
    "Pár": 2,
    "Dva páry": 4,
    "Trojice": 6,
    "Straight": 10,
    "Flush": 15,
    "Full House": 20,
    "Poker (Čtveřice)": 50,
    "Straight Flush": 100,
    "Royal Flush": 500,
    "Žádná kombinace": -1
  };
  let multiplier = payoutTable[evaluation] ?? 0;
  return Math.round(multiplier * bet);
}

drawBtn.onclick = dealCards;
replaceBtn.onclick = replaceCards;

replaceBtn.disabled = true;
