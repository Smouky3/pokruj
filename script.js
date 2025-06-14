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

let pokerStats = JSON.parse(localStorage.getItem("pokerStats")) || {
  "Žádná kombinace": 0,
  "Pár": 0,
  "Dva páry": 0,
  "Trojice": 0,
  "Straight": 0,
  "Flush": 0,
  "Full House": 0,
  "Poker (Čtveřice)": 0,
  "Straight Flush": 0,
  "Royal Flush": 0
};

let score = parseInt(localStorage.getItem("pokerScore")) || 20;
let bet = parseInt(localStorage.getItem("pokerBet")) || 1;
let jackpot = parseInt(localStorage.getItem("pokerJackpot")) || 0;

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
  createDeck();
  shuffleDeck();
  hand = deck.splice(0, 5); // Vezmeme 5 karet z horní části balíčku
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

function replaceCards() {
  for (let i = 0; i < hand.length; i++) {
    if (!selectedIndices.includes(i)) {
      hand[i] = deck.pop(); // Vezmeme novou kartu z balíčku
    }
  }

  displayCards();
  replaceBtn.disabled = true;
  drawBtn.disabled = false;

  const evaluation = evaluateHand(hand);

  // Přidání 1% sázky do jackpotu
  const jackpotContribution = Math.floor(bet * 0.01);
  jackpot += jackpotContribution;

  let payout = calculatePayout(evaluation);

  // Výhra jackpotu
  if (evaluation === "Poker (Čtveřice)") {
    payout += jackpot;
    changeDisplay.textContent += ` + JACKPOT ${jackpot}! 🎉`;
    jackpot = 0;
  }

  score += payout;

  pokerStats[evaluation] = (pokerStats[evaluation] || 0) + 1;
  localStorage.setItem("pokerStats", JSON.stringify(pokerStats));
  localStorage.setItem("pokerScore", score);
  localStorage.setItem("pokerJackpot", jackpot);

  // Úprava sázky podle skóre
  if (score >= 3000) bet = 50;
  else if (score >= 2000) bet = 25;
  else if (score >= 1000) bet = 10;
  else if (score >= 500) bet = 5;
  else bet = 1;
  localStorage.setItem("pokerBet", bet);

  scoreDisplay.textContent = score;
  betDisplay.textContent = bet;
  jackpotDisplay.textContent = jackpot;

  const sign = payout >= 0 ? "+" : "";
  result.textContent = `${evaluation}! (${sign}${payout})`;
  changeDisplay.textContent = `Změna skóre: ${sign}${payout}`;
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
  let payout = Math.round(multiplier * bet);

  if (payout < payoutTable[evaluation]) {
    payout = payoutTable[evaluation];
  }

  return payout;
}

drawBtn.onclick = dealCards;
replaceBtn.onclick = replaceCards;

replaceBtn.disabled = true;
scoreDisplay.textContent = score;
betDisplay.textContent = bet;
jackpotDisplay.textContent = jackpot;
result.textContent = '';
changeDisplay.textContent = '';

