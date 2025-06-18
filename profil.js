const statsBody = document.getElementById('statsBody');
const summaryStatsBody = document.getElementById('summaryStatsBody');

auth.onAuthStateChanged(user => {
  if (user) {
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          const stats = data.stats || {};
          const dailyStats = data.dailyStats || {};

          // Zobrazení přezdívky
          const nicknameDisplay = document.getElementById("nicknameDisplay");
          if (nicknameDisplay) {
            nicknameDisplay.textContent = data.nickname || '';
          }

          const today = new Date().toISOString().split('T')[0];
          const todayStats = dailyStats[today] || {};

          statsBody.innerHTML = '';
          summaryStatsBody.innerHTML = '';

          const allCombos = [
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

          let totalGames = 0, totalWins = 0, totalLosses = 0;
          let todayGames = 0, todayWins = 0, todayLosses = 0;

          allCombos.forEach(combo => {
            const isLoss = combo === "Žádná kombinace";
            const total = stats[combo] || 0;
            const todayCount = todayStats[combo] || 0;

            totalGames += total;
            todayGames += todayCount;

            if (isLoss) {
              totalLosses += total;
              todayLosses += todayCount;
            } else {
              totalWins += total;
              todayWins += todayCount;
            }
          });

          const addSummaryRow = (label, todayValue, totalValue) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${label}</td><td>${todayValue}</td><td>${totalValue}</td>`;
            summaryStatsBody.appendChild(tr);
          };

          const totalSuccessRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
          const todaySuccessRate = todayGames > 0 ? Math.round((todayWins / todayGames) * 100) : 0;

          addSummaryRow("Her", todayGames, totalGames);
          addSummaryRow("Výhry", todayWins, totalWins);
          addSummaryRow("Prohry", todayLosses, totalLosses);
          addSummaryRow("Úspěšnost", `${todaySuccessRate}%`, `${totalSuccessRate}%`);

          allCombos.forEach(combo => {
            if (combo === "Žádná kombinace") return;

            const totalCount = stats[combo] || 0;
            const todayCount = todayStats[combo] || 0;

            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${combo}</td><td>${todayCount}</td><td>${totalCount}</td>`;
            statsBody.appendChild(tr);
          });

        } else {
          statsBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Žádná data k zobrazení.</td></tr>';
          summaryStatsBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Žádná data k zobrazení.</td></tr>';
        }
      })
      .catch(err => {
        statsBody.innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Chyba při načítání statistik: ${err.message}</td></tr>`;
        summaryStatsBody.innerHTML = `<tr><td colspan="3" style="color:red; text-align:center;">Chyba při načítání souhrnu: ${err.message}</td></tr>`;
        console.error("Chyba při načítání statistik:", err);
      });

  } else {
    statsBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Pro zobrazení statistik se musíš přihlásit.</td></tr>';
    summaryStatsBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Pro zobrazení souhrnu se musíš přihlásit.</td></tr>';
  }
});
