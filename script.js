let bibleData = {};
let currentBook = "";
let currentChapter = "1";

// Try to integrate with Telegram theme
(function initTelegram(){
  try {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();
      const scheme = Telegram.WebApp.colorScheme;
      if (scheme === 'dark') document.body.classList.add('dark');
      if (scheme === 'light') document.body.classList.remove('dark');
      Telegram.WebApp.onEvent('themeChanged', () => {
        const sc = Telegram.WebApp.colorScheme;
        document.body.classList.toggle('dark', sc === 'dark');
      });
    }
  } catch (e) {
    console.warn('Telegram WebApp not available:', e);
  }
})();

// Theme toggle with localStorage fallback
const THEME_KEY = 'bible-app-theme';
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') document.body.classList.add('dark');
  if (saved === 'light') document.body.classList.remove('dark');
})();

document.getElementById('toggleTheme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
});

// Load JSON
fetch("bible.json")
  .then(res => res.json())
  .then(data => {
    bibleData = data;
    loadBooks();
    // Try deep-link params: ?book=Бытие&ch=1
    const params = new URLSearchParams(location.search);
    const b = params.get('book');
    const ch = params.get('ch');
    if (b && bibleData[b]) {
      currentBook = b;
      loadChapters();
      if (ch && bibleData[b][ch]) {
        currentChapter = String(ch);
        document.getElementById('chapterSelect').value = currentChapter;
        displayChapter();
      }
    }
  })
  .catch(err => {
    const t = document.getElementById('text');
    t.innerHTML = '<p>Не удалось загрузить bible.json. Проверьте путь и формат файла.</p>';
    console.error(err);
  });

function loadBooks() {
  const bookSelect = document.getElementById("bookSelect");
  bookSelect.innerHTML = "";
  const books = Object.keys(bibleData);
  if (books.length === 0) return;
  books.forEach(book => {
    const opt = document.createElement("option");
    opt.value = book;
    opt.textContent = book;
    bookSelect.appendChild(opt);
  });
  currentBook = books[0];
  bookSelect.value = currentBook;
  loadChapters();
}

function loadChapters() {
  const chapterSelect = document.getElementById("chapterSelect");
  chapterSelect.innerHTML = "";
  const chapters = Object.keys(bibleData[currentBook] || {});
  chapters.sort((a, b) => Number(a) - Number(b)); // Теперь числовая сортировка работает
  chapters.forEach(ch => {
    const opt = document.createElement("option");
    opt.value = ch;
    opt.textContent = "Глава " + ch;
    chapterSelect.appendChild(opt);
  });
  currentChapter = chapters[0] || "1";
  chapterSelect.value = currentChapter;
  displayChapter();
}

function displayChapter() {
  const textDiv = document.getElementById("text");
  textDiv.innerHTML = "";
  const verses = (bibleData[currentBook] || {})[currentChapter] || [];
  verses.forEach((v, i) => {
    const p = document.createElement("p");
    p.className = "verse";
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = (i + 1) + ".";
    const span = document.createElement("span");
    span.textContent = " " + v;
    p.appendChild(num);
    p.appendChild(span);
    textDiv.appendChild(p);
  });

  // Scroll to top
  textDiv.scrollTop = 0;

  // Update nav buttons disabled state
  const chapters = Object.keys(bibleData[currentBook] || {}).sort((a, b) => Number(a) - Number(b));
  const idx = chapters.indexOf(String(currentChapter));
  document.getElementById("prevChapter").disabled = (idx <= 0);
  document.getElementById("nextChapter").disabled = (idx === -1 || idx >= chapters.length - 1);
}

document.getElementById("bookSelect").addEventListener("change", e => {
  currentBook = e.target.value;
  loadChapters();
});

document.getElementById("chapterSelect").addEventListener("change", e => {
  currentChapter = e.target.value;
  displayChapter();
});

document.getElementById("prevChapter").addEventListener("click", () => {
  const chapters = Object.keys(bibleData[currentBook] || {}).sort((a, b) => Number(a) - Number(b));
  const idx = chapters.indexOf(String(currentChapter));
  if (idx > 0) {
    currentChapter = chapters[idx - 1];
    document.getElementById("chapterSelect").value = currentChapter;
    displayChapter();
  }
});

document.getElementById("nextChapter").addEventListener("click", () => {
  const chapters = Object.keys(bibleData[currentBook] || {}).sort((a, b) => Number(a) - Number(b));
  const idx = chapters.indexOf(String(currentChapter));
  if (idx !== -1 && idx < chapters.length - 1) {
    currentChapter = chapters[idx + 1];
    document.getElementById("chapterSelect").value = currentChapter;
    displayChapter();
  }
});
