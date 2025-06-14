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
  hand = deck.splice(0, 5);
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
      hand[i] = deck.pop();
    }
  }

  displayCards();
  replaceBtn.disabled = true;
  drawBtn.disabled = false;

  const evaluation = evaluateHand(hand);
  const jackpotContribution = Math.floor(bet * 0.01);
  jackpot += jackpotContribution;

  let payout = calculatePayout(evaluation);

  if (evaluation === "Žádná kombinace") {
    payout = -bet;
  } else if (evaluation === "Poker (Čtveřice)") {
    payout += jackpot;
    changeDisplay.textContent += ` + JACKPOT ${jackpot}! 🎉`;
    jackpot = 0;
  }

  score += payout;

  pokerStats[evaluation] = (pokerStats[evaluation] || 0) + 1;
  localStorage.setItem("pokerStats", JSON.stringify(pokerStats));
  localStorage.setItem("pokerScore", score);
  localStorage.setItem("pokerJackpot", jackpot);

  if (score >= 3000) bet = 50;
  else if (score >= 2000) bet = 25;
  else if (score >= 1000) bet = 10;
  else if (score >= 500) bet = 5;
  else bet = 1;
  localStorage.setItem("pokerBet", bet);

  scoreDisplay.textContent
