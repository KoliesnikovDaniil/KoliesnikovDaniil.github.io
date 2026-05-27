const API_BASE = "";

let authToken = localStorage.getItem("volunteerhub_token") || "";
let initiatives = [];

const initiativesGrid = document.getElementById("initiativesGrid");
const ratingInitiative = document.getElementById("ratingInitiative");
const averageInitiative = document.getElementById("averageInitiative");
const serverMessage = document.getElementById("serverMessage");
const profileBox = document.getElementById("profileBox");
const logoutBtn = document.getElementById("logoutBtn");

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `status-text ${type}`;
}

async function apiFetch(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Помилка запиту");
  }

  return data;
}

function updateAuthUI() {
  if (authToken) {
    profileBox.textContent = "Користувач авторизований. Можна додавати оцінки.";
    logoutBtn.classList.remove("hidden");
  } else {
    profileBox.textContent = "Користувач не авторизований.";
    logoutBtn.classList.add("hidden");
  }
}

async function loadInitiatives() {
  try {
    initiatives = await apiFetch("/api/initiatives");
    initiativesGrid.innerHTML = "";
    ratingInitiative.innerHTML = "";
    averageInitiative.innerHTML = "";

    initiatives.forEach((initiative) => {
      const card = document.createElement("article");
      card.className = "initiative-card";
      card.innerHTML = `
        <span class="badge">${initiative.type}</span>
        <h3>${initiative.title}</h3>
        <div class="meta">
          <span>📅 ${initiative.date}</span>
          <span>📍 ${initiative.place}</span>
          <span>🙋 Потрібно волонтерів: ${initiative.volunteers}</span>
        </div>
        <p>${initiative.description}</p>
        <button class="secondary-btn" data-average="${initiative.id}">Показати середню оцінку</button>
      `;
      initiativesGrid.appendChild(card);

      const optionA = document.createElement("option");
      optionA.value = initiative.id;
      optionA.textContent = initiative.title;
      ratingInitiative.appendChild(optionA);

      const optionB = document.createElement("option");
      optionB.value = initiative.id;
      optionB.textContent = initiative.title;
      averageInitiative.appendChild(optionB);
    });

    document.querySelectorAll("[data-average]").forEach((button) => {
      button.addEventListener("click", () => {
        averageInitiative.value = button.dataset.average;
        loadAverageRating();
        document.getElementById("ratings").scrollIntoView({ behavior: "smooth" });
      });
    });
  } catch (error) {
    initiativesGrid.innerHTML = `<p class="status-text error">${error.message}</p>`;
  }
}

async function loadAverageRating() {
  const initiativeId = averageInitiative.value;
  const averageBox = document.getElementById("averageBox");

  try {
    const data = await apiFetch(`/api/initiatives/${initiativeId}/ratings`);
    averageBox.innerHTML = `
      <p class="muted">${data.initiativeTitle}</p>
      <p class="average-number">${data.averageRating}</p>
      <p>Кількість оцінок: <strong>${data.totalRatings}</strong></p>
      <div class="routes">
        ${data.ratings.map((item) => `
          <div>
            <strong>${"★".repeat(Number(item.rating))}${"☆".repeat(5 - Number(item.rating))}</strong>
            <p>${item.comment || "Без коментаря"}</p>
            <small class="muted">${item.userEmail || "анонімно"}</small>
          </div>
        `).join("")}
      </div>
    `;
  } catch (error) {
    averageBox.innerHTML = `<p class="status-text error">${error.message}</p>`;
  }
}

document.getElementById("checkServerBtn").addEventListener("click", async () => {
  try {
    const data = await apiFetch("/api/message");
    setMessage(serverMessage, data.message, "success");
  } catch (error) {
    setMessage(serverMessage, error.message, "error");
  }
});

document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const registerMessage = document.getElementById("registerMessage");
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  try {
    const data = await apiFetch("/register", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    authToken = data.token;
    localStorage.setItem("volunteerhub_token", authToken);
    updateAuthUI();
    setMessage(registerMessage, data.message, "success");
    event.target.reset();
  } catch (error) {
    setMessage(registerMessage, error.message, "error");
  }
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const loginMessage = document.getElementById("loginMessage");
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const data = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    authToken = data.token;
    localStorage.setItem("volunteerhub_token", authToken);
    updateAuthUI();
    setMessage(loginMessage, data.message, "success");
    event.target.reset();
  } catch (error) {
    setMessage(loginMessage, error.message, "error");
  }
});

logoutBtn.addEventListener("click", () => {
  authToken = "";
  localStorage.removeItem("volunteerhub_token");
  updateAuthUI();
  document.getElementById("loginMessage").textContent = "";
});

document.getElementById("ratingForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const ratingMessage = document.getElementById("ratingMessage");
  const initiativeId = ratingInitiative.value;
  const rating = Number(document.getElementById("ratingValue").value);
  const comment = document.getElementById("ratingComment").value.trim();

  try {
    const data = await apiFetch(`/api/initiatives/${initiativeId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating, comment })
    });

    setMessage(
      ratingMessage,
      `Оцінку додано. Нова середня оцінка: ${data.averageRating}`,
      "success"
    );
    averageInitiative.value = initiativeId;
    await loadAverageRating();
    event.target.reset();
  } catch (error) {
    setMessage(ratingMessage, error.message, "error");
  }
});

document.getElementById("loadAverageBtn").addEventListener("click", loadAverageRating);

updateAuthUI();
loadInitiatives();
