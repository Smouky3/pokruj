const firebaseConfig = {
  apiKey: "AIzaSyBNNf0kEABVjKYa7NzlGyhwUqCe9CCDKwA",
  authDomain: "pokruj-f7785.firebaseapp.com",
  projectId: "pokruj-f7785",
  storageBucket: "pokruj-f7785.appspot.com",
  messagingSenderId: "341436404573",
  appId: "1:341436404573:web:b2f9495eea0e328df90eb4",
  measurementId: "G-CV46BKJ882"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const nicknameInput = document.getElementById('nickname');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const switchToRegisterBtn = document.getElementById('switchToRegisterBtn');

const messageDiv = document.getElementById('message');
const formTitle = document.getElementById('formTitle');

// přepnutí do režimu registrace
switchToRegisterBtn.onclick = () => {
  nicknameInput.classList.remove('hidden');
  registerBtn.classList.remove('hidden');
  loginBtn.classList.add('hidden');
  switchToRegisterBtn.classList.add('hidden');
  formTitle.textContent = 'Registrace';
  messageDiv.textContent = '';
};

// registrace nového uživatele
registerBtn.onclick = () => {
  const nickname = nicknameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!nickname || !email || !password) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Vyplň přezdívku, email i heslo.';
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      return db.collection('users').doc(user.uid).set({
        nickname: nickname,
        score: 20,
        bet: 1,
        chips: 0,
        jackpot: 0,
        stats: {}
      }).then(() => {
        messageDiv.style.color = '#4caf50';
        messageDiv.textContent = 'Registrace úspěšná. Přesměrovávám do hry...';
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      });
    })
    .catch(e => {
      messageDiv.style.color = 'red';
      messageDiv.textContent = 'Chyba při registraci: ' + e.message;
    });
};

// přihlášení existujícího uživatele
loginBtn.onclick = () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Vyplň email i heslo.';
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      messageDiv.style.color = '#4caf50';
      messageDiv.textContent = 'Přihlášení úspěšné. Nyní budeš přesměrován...';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    })
    .catch(e => {
      messageDiv.style.color = 'red';
      messageDiv.textContent = 'Chyba při přihlášení: ' + e.message;
    });
};
