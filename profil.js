const statsBody = document.getElementById('statsBody');

auth.onAuthStateChanged(user => {
  if (user) {
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          const stats = data.stats || {};

          statsBody.innerHTML = ''; // vyprázdnit tabulku

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

          allCombos.forEach(combo => {
            const count = stats[combo] || 0;
            const displayName = combo === "Žádná kombinace" ? "Nevýherní kombinace" : combo;

            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${displayName}</td><td>${count}</td>`;
            statsBody.appendChild(tr);
          });
        } else {
          statsBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Žádná data k zobrazení.</td></tr>';
        }
      })
      .catch(err => {
        statsBody.innerHTML = `<tr><td colspan="2" style="color:red; text-align:center;">Chyba při načítání statistik: ${err.message}</td></tr>`;
        console.error("Chyba při načítání statistik:", err);
      });
  } else {
    statsBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Pro zobrazení statistik se musíš přihlásit.</td></tr>';
  }
});
