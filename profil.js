const statsBody = document.getElementById("statsBody");
const rankDiv = document.getElementById("rank");
const scoreDisplay = document.getElementById("scoreDisplay");
const betDisplay = document.getElementById("betDisplay");
const logoutBtn = document.getElementById('logoutBtn');
const nicknameDisplay = document.getElementById("nicknameDisplay");
const leaderboardBody = document.getElementById('leaderboardBody');

const allCombinations = [
  "Žádná kombinace",
  "Pár",
  "Dva páry",
  "Trojice",
  "Straight",
  "Flush",
  "Full House",
  "Poker (Čtveřice)",
  "Straight Flush",
  "Royal Flush"
];

let pokerStats = {};
let score = 0;
let bet = 1;

logoutBtn.onclick = () => {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
};

auth.onAuthStateChanged(user => {
  if (user) {
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const data = doc.data();
        pokerStats = data.stats ?? {};
        score = data.score ?? 0;
        bet = data.bet ?? 1;
        const nickname = data.nickname ?? "Neznámý hráč";
        nicknameDisplay.textContent = nickname;
        updateProfile();
      } else {
        pokerStats = {};
        score = 0;
        bet = 1;
        nicknameDisplay.textContent = "Neznámý hráč";
        updateProfile();
      }
    }).catch(() => {
      loadFromLocalStorage();
    });

    loadLeaderboard();

  } else {
    loadFromLocalStorage();
    leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Pro zobrazení žebříčku se musíš přihlásit.</td></tr>';
  }
});

function loadFromLocalStorage() {
  pokerStats = JSON.parse(localStorage.getItem("pokerStats")) || {};
  score = parseInt(localStorage.getItem("pokerScore")) || 0;
  bet = parseInt(localStorage.getItem("pokerBet")) || 1;
  nicknameDisplay.textContent = "Neznámý hráč";
  updateProfile();
}

function getRank(score) {
  if (score >= 3000) return { name: "Diamantový hráč", className: "diamond" };
  if (score >= 2000) return { name: "Platinový hráč", className: "platinum" };
  if (score >= 1000) return { name: "Zlatý hráč", className: "gold" };
  if (score >= 500) return { name: "Stříbrný hráč", className: "silver" };
  if (score >= 20) return { name: "Bronzový hráč", className: "bronze" };
  return { name: "Začátečník", className: "" };
}

function fillStats(stats) {
  statsBody.innerHTML = "";
  allCombinations.forEach(combo => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    const tdCount = document.createElement("td");
    tdName.textContent = combo;
    tdCount.textContent = stats[combo] || 0;
    tr.appendChild(tdName);
    tr.appendChild(tdCount);
    statsBody.appendChild(tr);
  });
}

function updateProfile() {
  fillStats(pokerStats);

  const rank = getRank(score);
  rankDiv.textContent = rank.name;
  rankDiv.className = "rank " + rank.className;

  scoreDisplay.textContent = score;
  betDisplay.textContent = bet;
}

function loadLeaderboard() {
  leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Načítám data...</td></tr>';

  db.collection('users')
    .orderBy('score', 'desc')
    .limit(10)
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

      if (snapshot.empty) {
        leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Žádní hráči k zobrazení.</td></tr>';
      }
    })
    .catch(error => {
      leaderboardBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: red;">Chyba při načítání: ${error.message}</td></tr>`;
    });
}
