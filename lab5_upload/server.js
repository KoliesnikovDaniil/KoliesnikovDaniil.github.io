// Лабораторна робота №5, варіант 9
// Серверна частина платформи волонтерських ініціатив
// Node.js + Express + Firebase Firestore + JWT

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "lab5_demo_secret_change_me";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// -----------------------------
// Firebase Admin SDK
// -----------------------------
let db = null;
let useMemoryDatabase = false;

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    console.log("Firebase Firestore підключено через serviceAccountKey.json");
  } else {
    useMemoryDatabase = true;
    console.warn("serviceAccountKey.json не знайдено. Увімкнено демонстраційну in-memory базу.");
  }
} catch (error) {
  useMemoryDatabase = true;
  console.warn("Помилка підключення Firebase. Увімкнено демонстраційну in-memory базу:", error.message);
}

// -----------------------------
// Demo storage, якщо Firebase-ключ не додано
// -----------------------------
const memory = {
  users: [],
  ratings: [
    {
      id: "r1",
      initiativeId: "park-cleanup",
      initiativeTitle: "Прибирання міського парку",
      rating: 5,
      comment: "Корисна екологічна ініціатива.",
      userEmail: "demo@example.com",
      createdAt: new Date().toISOString()
    },
    {
      id: "r2",
      initiativeId: "park-cleanup",
      initiativeTitle: "Прибирання міського парку",
      rating: 4,
      comment: "Добра організація заходу.",
      userEmail: "volunteer@example.com",
      createdAt: new Date().toISOString()
    },
    {
      id: "r3",
      initiativeId: "animal-shelter",
      initiativeTitle: "Допомога притулку для тварин",
      rating: 5,
      comment: "Дуже важливий проєкт.",
      userEmail: "helper@example.com",
      createdAt: new Date().toISOString()
    }
  ]
};

// -----------------------------
// Дані ініціатив для клієнтської частини
// -----------------------------
const initiatives = [
  {
    id: "park-cleanup",
    title: "Прибирання міського парку",
    date: "2026-06-15",
    place: "Київ",
    type: "Екологія",
    description: "Волонтерська акція з прибирання території парку та сортування сміття.",
    volunteers: 12
  },
  {
    id: "animal-shelter",
    title: "Допомога притулку для тварин",
    date: "2026-06-22",
    place: "Львів",
    type: "Допомога тваринам",
    description: "Збір корму, прибирання вольєрів і допомога з вигулом собак.",
    volunteers: 8
  },
  {
    id: "elderly-support",
    title: "Підтримка літніх людей",
    date: "2026-07-01",
    place: "Одеса",
    type: "Соціальна підтримка",
    description: "Допомога літнім людям із покупками, побутовими справами та спілкуванням.",
    volunteers: 10
  }
];

function getInitiativeTitle(initiativeId) {
  const initiative = initiatives.find((item) => item.id === initiativeId);
  return initiative ? initiative.title : initiativeId;
}

function calculateAverage(ratings) {
  if (!ratings.length) {
    return 0;
  }

  const sum = ratings.reduce((total, item) => total + Number(item.rating || 0), 0);
  return Number((sum / ratings.length).toFixed(2));
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Необхідна авторизація" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Недійсний або прострочений токен" });
  }
}

// -----------------------------
// Базовий тестовий маршрут
// -----------------------------
app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from the VolunteerHub backend!" });
});

// -----------------------------
// Ініціативи
// -----------------------------
app.get("/api/initiatives", (req, res) => {
  res.json(initiatives);
});

// -----------------------------
// Реєстрація, логін, профіль
// -----------------------------
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ message: "Введіть email і пароль не менше 6 символів" });
    }

    if (useMemoryDatabase) {
      const existingUser = memory.users.find((user) => user.email === email);
      if (existingUser) {
        return res.status(409).json({ message: "Користувач з таким email вже існує" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = {
        id: `user-${Date.now()}`,
        email,
        passwordHash,
        createdAt: new Date().toISOString()
      };

      memory.users.push(user);
      return res.status(201).json({ message: "Користувача зареєстровано", token: generateToken(user) });
    }

    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (!snapshot.empty) {
      return res.status(409).json({ message: "Користувач з таким email вже існує" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRef = await db.collection("users").add({
      email,
      passwordHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const user = { id: userRef.id, email };
    res.status(201).json({ message: "Користувача зареєстровано", token: generateToken(user) });
  } catch (error) {
    res.status(500).json({ message: "Помилка реєстрації", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Введіть email і пароль" });
    }

    let user = null;

    if (useMemoryDatabase) {
      user = memory.users.find((item) => item.email === email);
    } else {
      const snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        user = { id: doc.id, ...doc.data() };
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Неправильний email або пароль" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Неправильний email або пароль" });
    }

    res.json({ message: "Вхід виконано", token: generateToken(user), user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Помилка входу", error: error.message });
  }
});

app.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Дані профілю отримано", user: req.user });
});

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Доступ до захищеного маршруту дозволено", user: req.user });
});

// -----------------------------
// GET: отримати всі оцінки конкретної ініціативи + середнє значення
// -----------------------------
app.get("/api/initiatives/:initiativeId/ratings", async (req, res) => {
  try {
    const { initiativeId } = req.params;
    let ratings = [];

    if (useMemoryDatabase) {
      ratings = memory.ratings.filter((rating) => rating.initiativeId === initiativeId);
    } else {
      const snapshot = await db
        .collection("ratings")
        .where("initiativeId", "==", initiativeId)
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        ratings.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        });
      });
    }

    const averageRating = calculateAverage(ratings);

    res.json({
      initiativeId,
      initiativeTitle: getInitiativeTitle(initiativeId),
      averageRating,
      totalRatings: ratings.length,
      ratings
    });
  } catch (error) {
    res.status(500).json({ message: "Помилка отримання оцінок", error: error.message });
  }
});

// -----------------------------
// POST: додати нову оцінку ініціативи
// -----------------------------
app.post("/api/initiatives/:initiativeId/ratings", verifyToken, async (req, res) => {
  try {
    const { initiativeId } = req.params;
    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Оцінка повинна бути цілим числом від 1 до 5" });
    }

    const newRating = {
      initiativeId,
      initiativeTitle: getInitiativeTitle(initiativeId),
      rating: numericRating,
      comment: comment ? String(comment).trim() : "",
      userEmail: req.user.email,
      createdAt: new Date().toISOString()
    };

    if (useMemoryDatabase) {
      newRating.id = `rating-${Date.now()}`;
      memory.ratings.push(newRating);
    } else {
      const docRef = await db.collection("ratings").add({
        ...newRating,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      newRating.id = docRef.id;
    }

    // Після додавання одразу повертаємо оновлену середню оцінку
    let updatedRatings = [];
    if (useMemoryDatabase) {
      updatedRatings = memory.ratings.filter((item) => item.initiativeId === initiativeId);
    } else {
      const snapshot = await db.collection("ratings").where("initiativeId", "==", initiativeId).get();
      snapshot.forEach((doc) => updatedRatings.push({ id: doc.id, ...doc.data() }));
    }

    res.status(201).json({
      message: "Оцінку додано",
      rating: newRating,
      averageRating: calculateAverage(updatedRatings),
      totalRatings: updatedRatings.length
    });
  } catch (error) {
    res.status(500).json({ message: "Помилка додавання оцінки", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`VolunteerHub server is running on http://localhost:${PORT}`);
});
