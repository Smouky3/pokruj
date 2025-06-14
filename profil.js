const firebaseConfig = {
  apiKey: "AIzaSyCZQvkYcZ3SJKjgxZ0stzdS9y-h3QP4Zzs",
  authDomain: "pokruj-b111c.firebaseapp.com",
  projectId: "pokruj-b111c",
  storageBucket: "pokruj-b111c.appspot.com",
  messagingSenderId: "221823135309",
  appId: "1:221823135309:web:f0dd15201d9488be5f3604",
  measurementId: "G-NNB0QJ1TT9"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

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

function fillStats(stats) {
  statsBody.innerHTML = "";
  for (const [combo, count] of Object.entries(stats)) {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    const tdCount = document.createElement("td");

    tdName.textContent = combo;
    tdCount.textContent = count;

    tr.appendChild(tdName);
    tr.appendChild(tdCount);
    statsBody.appendChild(tr);
  }
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    alert("Musíš být přihlášený, abys viděl profil.");
    window.location.href = "login.html";
    return;
  }

  const userDoc = await db.collection("users").doc(user.uid).get();

  if (!userDoc.exists) {
    alert("Profil nenalezen, hrajte hru a data se uloží.");
    scoreDisplay.textContent = 20;
    betDisplay.textContent = 1;
    fillStats({});
    rankDiv.textContent = "Začátečník";
    return;
  }

  const data = userDoc.data();

  const score = data.score || 20;
  const bet = data.bet || 1;
  const stats = data.stats || {};

  scoreDisplay.textContent = score;
  betDisplay.textContent = bet;
  fillStats(stats);

  const rank = getRank(score);
  rankDiv.textContent = rank.name;
  rankDiv.className = "rank " + rank.className;
});
