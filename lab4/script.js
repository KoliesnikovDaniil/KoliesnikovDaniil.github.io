import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "AIzaSyCgzQL55E-C8jCppIPzqY9MA1Dk8QlF6W8",

    authDomain: "lab4-457b2.firebaseapp.com",

    projectId: "lab4-457b2",

    storageBucket: "lab4-457b2.firebasestorage.app",

    messagingSenderId: "633840554048",

    appId: "1:633840554048:web:53d2f374495b31cb328fa5",

    measurementId: "G-YX9L44ZC17"

};

// Ініціалізація Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// HTML-елементи
const authStatus = document.getElementById("authStatus");
const currentUserText = document.getElementById("currentUser");
const logoutBtn = document.getElementById("logoutBtn");

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const registerMessage = document.getElementById("registerMessage");
const loginMessage = document.getElementById("loginMessage");

const initiativesGrid = document.getElementById("initiativesGrid");
const initiativeSelect = document.getElementById("initiativeSelect");

const ratingForm = document.getElementById("ratingForm");
const ratingMessage = document.getElementById("ratingMessage");
const ratingsList = document.getElementById("ratingsList");

let currentUser = null;
let initiatives = [];

// Повідомлення
function setMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
}

// Завантаження ініціатив з Firestore
async function loadInitiatives() {
    initiativesGrid.innerHTML = "";
    initiativeSelect.innerHTML = "";
    initiatives = [];

    try {
        const querySnapshot = await getDocs(collection(db, "initiatives"));

        querySnapshot.forEach((doc) => {
            initiatives.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (initiatives.length === 0) {
            initiativesGrid.innerHTML = `
        <p class="muted">
          У колекції initiatives поки немає документів.
          Додайте ініціативи у Firestore Database.
        </p>
      `;
            return;
        }

        renderInitiatives();
    } catch (error) {
        console.error(error);
        initiativesGrid.innerHTML = `
      <p class="message error">
        Помилка завантаження ініціатив: ${error.message}
      </p>
    `;
    }
}

// Виведення ініціатив на сторінку
function renderInitiatives() {
    initiativesGrid.innerHTML = "";
    initiativeSelect.innerHTML = "";

    initiatives.forEach((initiative) => {
        const title = initiative.title || "Без назви";
        const date = initiative.date || "Дата не вказана";
        const place = initiative.place || "Місце не вказано";
        const type = initiative.type || "Тип не вказано";
        const description = initiative.description || "Опис відсутній";
        const volunteers = initiative.volunteers ?? initiative.volunteersNeeded ?? "—";

        const card = document.createElement("article");
        card.className = "initiative-card";

        card.innerHTML = `
      <span class="badge">${type}</span>
      <h3>${title}</h3>
      <div class="meta">
        <span>📅 ${date}</span>
        <span>📍 ${place}</span>
        <span>🙋 Потрібно волонтерів: ${volunteers}</span>
      </div>
      <p>${description}</p>
    `;

        initiativesGrid.appendChild(card);

        const option = document.createElement("option");
        option.value = initiative.id;
        option.textContent = title;
        initiativeSelect.appendChild(option);
    });
}

// Реєстрація користувача
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!email || password.length < 6) {
        setMessage(registerMessage, "Введіть email і пароль не менше 6 символів.", "error");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        setMessage(
            registerMessage,
            `Реєстрація успішна: ${userCredential.user.email}`,
            "success"
        );

        registerForm.reset();
    } catch (error) {
        console.error(error);
        setMessage(registerMessage, `Помилка реєстрації: ${error.message}`, "error");
    }
});

// Вхід користувача
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        setMessage(
            loginMessage,
            `Вхід виконано: ${userCredential.user.email}`,
            "success"
        );

        loginForm.reset();
    } catch (error) {
        console.error(error);
        setMessage(loginMessage, `Помилка входу: ${error.message}`, "error");
    }
});

// Вихід користувача
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error(error);
    }
});

// Відстеження стану автентифікації
onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (user) {
        authStatus.textContent = "Користувач увійшов";
        currentUserText.textContent = `Email: ${user.email}. Тепер можна залишати оцінки.`;
        logoutBtn.classList.remove("hidden");
    } else {
        authStatus.textContent = "Користувач не увійшов";
        currentUserText.textContent = "Оцінювання доступне після входу.";
        logoutBtn.classList.add("hidden");
    }
});

// Збереження оцінки у Firestore
ratingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
        setMessage(ratingMessage, "Щоб залишити оцінку, потрібно увійти в систему.", "error");
        return;
    }

    const initiativeId = initiativeSelect.value;
    const rating = Number(document.getElementById("ratingSelect").value);
    const comment = document.getElementById("ratingComment").value.trim();

    const initiative = initiatives.find((item) => item.id === initiativeId);

    try {
        await addDoc(collection(db, "ratings"), {
            initiativeId,
            initiativeTitle: initiative ? initiative.title : "Невідома ініціатива",
            userEmail: currentUser.email,
            rating,
            comment,
            createdAt: serverTimestamp()
        });

        setMessage(ratingMessage, "Оцінку успішно збережено у Firestore.", "success");

        ratingForm.reset();
        loadRatings();
    } catch (error) {
        console.error(error);
        setMessage(ratingMessage, `Помилка збереження оцінки: ${error.message}`, "error");
    }
});

// Завантаження оцінок з Firestore
async function loadRatings() {
    ratingsList.innerHTML = "";

    try {
        const querySnapshot = await getDocs(collection(db, "ratings"));

        if (querySnapshot.empty) {
            ratingsList.innerHTML = `<p class="muted">Поки що оцінок немає.</p>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const item = doc.data();

            const div = document.createElement("div");
            div.className = "rating-item";

            const starsCount = Number(item.rating) || 0;

            div.innerHTML = `
        <strong>${item.initiativeTitle || "Ініціатива"}</strong>
        <p class="stars">${"★".repeat(starsCount)}${"☆".repeat(5 - starsCount)}</p>
        <p>${item.comment || "Без коментаря"}</p>
        <small class="muted">Користувач: ${item.userEmail || "невідомо"}</small>
      `;

            ratingsList.appendChild(div);
        });
    } catch (error) {
        console.error(error);
        ratingsList.innerHTML = `
      <p class="message error">
        Помилка завантаження оцінок: ${error.message}
      </p>
    `;
    }
}

// Початкове завантаження
loadInitiatives();
loadRatings();