const pokerStats = JSON.parse(localStorage.getItem("pokerStats")) || {};
const score = parseInt(localStorage.getItem("pokerScore")) || 0;
const bet = parseInt(localStorage.getItem("pokerBet")) || 1;

const statsBody = document.getElementById("statsBody");
const rankDiv = document.getElementById("rank");
const scoreDisplay = document.getElementById("scoreDisplay");
const betDisplay = document.getElementById("betDisplay");

function getRank(score) {
  if (score >= 3000) return { name: "Diamantový hráč", className: "diamond" };
  if (score >= 2000) return { name: "Platinový hráč", className: "platinum" };
  if (score >= 1000) return { name: "Zlatý hráč", className: "gold" };
  if (score >= 500) return { name: "Stříbrný hráč", className: "silver" };
  if (score >= 20) return { name: "Bronzový hráč", className: "bronze" };
  return { name: "Začátečník", className: "" };
}

function fillStats() {
  statsBody.innerHTML = "";
  for (const [combo, count] of Object.entries(pokerStats)) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${combo}</td><td>${count}</td>`;
    statsBody.appendChild(tr);
  }
}

function updateProfile() {
  fillStats();
  const rank = getRank(score);
  rankDiv.textContent = rank.name;
  rankDiv.className = "rank " + rank.className;
  scoreDisplay.textContent = score;
  betDisplay.textContent = bet;
}

updateProfile();
