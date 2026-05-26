const initiatives = [
  {
    id: 1,
    title: 'Екоакція у міському парку',
    date: '2026-06-14',
    place: 'Київ, парк Перемоги',
    volunteersNeeded: 12,
    description: 'Прибирання території парку, сортування сміття та висадка молодих дерев.'
  },
  {
    id: 2,
    title: 'Допомога літнім людям',
    date: '2026-07-02',
    place: 'Київ, Солом’янський район',
    volunteersNeeded: 8,
    description: 'Доставка продуктів, ліків та базова побутова допомога людям похилого віку.'
  },
  {
    id: 3,
    title: 'Збір речей для родин',
    date: '2026-08-10',
    place: 'Волонтерський центр VolunteerHub',
    volunteersNeeded: 15,
    description: 'Сортування одягу, пакування наборів і підготовка речей до передачі родинам.'
  },
  {
    id: 4,
    title: 'Підтримка притулку для тварин',
    date: '2026-09-05',
    place: 'Бровари, притулок “Друг”',
    volunteersNeeded: 10,
    description: 'Допомога з вигулом тварин, прибиранням вольєрів та збором корму.'
  },
  {
    id: 5,
    title: 'Минуле навчання волонтерів',
    date: '2024-03-12',
    place: 'Онлайн',
    volunteersNeeded: 0,
    description: 'Ця ініціатива завершена і не повинна відображатися у списку актуальних.'
  }
];

const joinedInitiatives = [];
const initiativeList = document.querySelector('#initiativeList');
const myInitiatives = document.querySelector('#myInitiatives');
const today = new Date();
today.setHours(0, 0, 0, 0);

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function renderInitiatives() {
  initiativeList.innerHTML = '';
  let index = 0;

  while (index < initiatives.length) {
    const initiative = initiatives[index];
    const initiativeDate = new Date(initiative.date);
    const isActual = initiativeDate >= today;

    if (isActual) {
      const card = document.createElement('article');
      card.className = 'initiative-card';
      card.dataset.id = initiative.id;

      const isJoined = joinedInitiatives.some(item => item.id === initiative.id);
      const volunteerText = initiative.volunteersNeeded > 0
        ? `Потрібно волонтерів: ${initiative.volunteersNeeded}`
        : 'Команду вже зібрано';

      card.innerHTML = `
        <span class="badge">Актуальна ініціатива</span>
        <h3>${initiative.title}</h3>
        <div class="initiative-meta">
          <span>📅 ${formatDate(initiative.date)}</span>
          <span>📍 ${initiative.place}</span>
          <span class="volunteer-count">👥 ${volunteerText}</span>
        </div>
        <p>${initiative.description}</p>
        <button class="join-button ${isJoined ? 'joined' : ''}" type="button" ${isJoined ? 'disabled' : ''}>
          ${isJoined ? 'Ви приєдналися' : 'Приєднатися'}
        </button>
      `;

      initiativeList.appendChild(card);
    }

    index++;
  }

  addCardEventHandlers();
}

function addCardEventHandlers() {
  const cards = document.querySelectorAll('.initiative-card');
  const buttons = document.querySelectorAll('.join-button');

  for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener('mouseenter', () => {
      cards[i].classList.add('hovered');
    });

    cards[i].addEventListener('mouseleave', () => {
      cards[i].classList.remove('hovered');
    });
  }

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', () => {
      const card = buttons[i].closest('.initiative-card');
      const initiativeId = Number(card.dataset.id);
      joinInitiative(initiativeId, buttons[i]);
    });
  }
}

function joinInitiative(id, button) {
  const initiative = initiatives.find(item => item.id === id);

  if (!initiative) {
    return;
  }

  const alreadyJoined = joinedInitiatives.some(item => item.id === id);

  if (alreadyJoined) {
    button.textContent = 'Ви вже приєдналися';
    return;
  }

  if (initiative.volunteersNeeded > 0) {
    initiative.volunteersNeeded--;
  }

  joinedInitiatives.push({ ...initiative });
  button.textContent = 'Ви приєдналися';
  button.classList.add('joined');
  button.disabled = true;

  renderInitiatives();
  renderMyInitiatives();
}

function renderMyInitiatives() {
  if (joinedInitiatives.length === 0) {
    myInitiatives.className = 'my-list empty-state';
    myInitiatives.textContent = 'Ви ще не приєдналися до жодної ініціативи.';
    return;
  }

  myInitiatives.className = 'my-list';
  myInitiatives.innerHTML = '';

  for (let i = 0; i < joinedInitiatives.length; i++) {
    const item = joinedInitiatives[i];
    const block = document.createElement('article');
    block.className = 'my-item';
    block.innerHTML = `
      <h3>${item.title}</h3>
      <p><strong>Дата:</strong> ${formatDate(item.date)}</p>
      <p><strong>Місце:</strong> ${item.place}</p>
    `;
    myInitiatives.appendChild(block);
  }
}

const toggleInfoButton = document.querySelector('#toggleInfoButton');
const extraInfo = document.querySelector('#extraInfo');

toggleInfoButton.addEventListener('click', () => {
  if (extraInfo.classList.contains('hidden')) {
    extraInfo.classList.remove('hidden');
    toggleInfoButton.textContent = 'Приховати деталі платформи';
  } else {
    extraInfo.classList.add('hidden');
    toggleInfoButton.textContent = 'Показати деталі платформи';
  }
});

const navLinks = document.querySelectorAll('.nav-link');
const navHint = document.querySelector('#navHint');

for (let i = 0; i < navLinks.length; i++) {
  navLinks[i].addEventListener('mouseenter', () => {
    navHint.textContent = navLinks[i].dataset.description;
    navLinks[i].classList.add('active-link');
  });

  navLinks[i].addEventListener('mouseleave', () => {
    navHint.textContent = 'Наведіть курсор на пункт меню, щоб побачити його опис.';
    navLinks[i].classList.remove('active-link');
  });
}

const missionButton = document.querySelector('#missionButton');
const missionText = document.querySelector('#missionText');
const missions = [
  'Наша місія — розвивати культуру взаємодопомоги та підтримувати корисні соціальні проєкти.',
  'Ми прагнемо зробити волонтерство доступним для кожної людини незалежно від досвіду.',
  'VolunteerHub допомагає швидко знаходити ініціативи, де потрібна реальна підтримка.'
];
let missionIndex = 0;

missionButton.addEventListener('click', () => {
  missionIndex++;

  if (missionIndex >= missions.length) {
    missionIndex = 0;
  }

  missionText.textContent = missions[missionIndex];
});

const themeButton = document.querySelector('#themeButton');
themeButton.addEventListener('click', () => {
  document.body.classList.toggle('alt-background');
});

const activityItems = document.querySelectorAll('#activityList li');
activityItems.forEach((item, index) => {
  if (index % 2 === 0) {
    item.style.fontWeight = '700';
  } else {
    item.style.color = '#248a55';
  }
});

const ideaForm = document.querySelector('#ideaForm');
const formMessage = document.querySelector('#formMessage');
const ideaList = document.querySelector('#ideaList');

ideaForm.addEventListener('submit', event => {
  event.preventDefault();

  const name = document.querySelector('#userName').value.trim();
  const email = document.querySelector('#userEmail').value.trim();
  const idea = document.querySelector('#ideaText').value.trim();

  if (name === '' || email === '' || idea === '') {
    formMessage.textContent = 'Будь ласка, заповніть усі поля форми.';
    formMessage.className = 'form-message error';
    return;
  }

  if (!email.includes('@')) {
    formMessage.textContent = 'Введіть коректну електронну пошту.';
    formMessage.className = 'form-message error';
    return;
  }

  const ideaItem = document.createElement('article');
  ideaItem.className = 'idea-item';
  ideaItem.innerHTML = `
    <h3>Пропозиція від ${name}</h3>
    <p><strong>Email:</strong> ${email}</p>
    <p>${idea}</p>
  `;

  ideaList.appendChild(ideaItem);
  formMessage.textContent = 'Пропозицію успішно додано на сторінку.';
  formMessage.className = 'form-message success';
  ideaForm.reset();
});

renderInitiatives();
renderMyInitiatives();
