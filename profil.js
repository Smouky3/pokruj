// načtení elementů
const gamesPlayedDisplay = document.getElementById('gamesPlayed');
const scoreDisplay = document.getElementById('score');
const rankDisplay = document.getElementById('rank');
const winStatsTableBody = document.getElementById('winStatsTableBody');

let playerScore = parseInt(localStorage.getItem('playerScore')) || 20;
let gamesPlayed = parseInt(localStorage.getItem('gamesPlayed')) || 0;
let winStats = JSON.parse(localStorage.getItem('winStats')) || {
  "Royal Flush": 0,
  "Straight Flush": 0,
  "Čtveřice": 0,
  "Full House": 0,
  "Flush": 0,
  "Postupka": 0,
  "Trojek": 0,
  "Dvě dvojice": 0,
  "Dvojice": 0,
  "Žádná": 0
};

function getRank(score) {
  if (score >= 5000) return 'Diamantový';
  if (score >= 2000) return 'Zlatý';
  if (score >= 1000) return 'Stříbrný';
  if (score >= 500) return 'Bronzový';
  return 'Začátečník';
}

function updateProfile() {
  gamesPlayedDisplay.textContent = gamesPlayed;
  scoreDisplay.textContent = playerScore;
  rankDisplay.textContent = getRank(playerScore);

  // vyprázdnit tabulku
  winStatsTableBody.innerHTML = '';

  for (const [combination, count] of Object.entries(winStats)) {
    const row = document.createElement('tr');

    const combCell = document.createElement('td');
    combCell.textContent = combination;
    row.appendChild(combCell);

    const countCell = document.createElement('td');
    countCell.textContent = count;
    row.appendChild(countCell);

    winStatsTableBody.appendChild(row);
  }
}

document.addEventListener('DOMContentLoaded', updateProfile);
