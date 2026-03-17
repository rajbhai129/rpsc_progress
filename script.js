/* =========================
  RPSC Sanskrit Syllabus Tracker
  - Vanilla HTML/CSS/JS
  - Saves progress in localStorage
  - Weighted overall progress
========================= */

// ---- 1) Syllabus data (given) ----
const syllabus = {
  paper1: {
    name: "पेपर 1 (सामान्य ज्ञान)",
    totalMarks: 200,
    subjects: [
      {
        name: "राजस्थान इतिहास",
        weight: 17,
        topics: ["प्राचीन राजस्थान", "मध्यकालीन राजस्थान", "आधुनिक राजस्थान", "स्वतंत्रता आंदोलन", "महत्वपूर्ण व्यक्तित्व"],
      },
      {
        name: "राजस्थान भूगोल",
        weight: 14,
        topics: ["नदियाँ", "जलवायु", "मिट्टी", "खनिज", "कृषि"],
      },
      {
        name: "राजस्थान संस्कृति",
        weight: 9,
        topics: ["लोक नृत्य", "मेले एवं त्यौहार", "वेशभूषा", "हस्तशिल्प", "लोक संगीत"],
      },
      {
        name: "भारतीय राजव्यवस्था",
        weight: 9,
        topics: ["संविधान", "मौलिक अधिकार", "संसद", "राष्ट्रपति एवं प्रधानमंत्री", "न्यायपालिका"],
      },
      {
        name: "समसामयिक घटनाएँ",
        weight: 11,
        topics: ["राजस्थान करंट अफेयर्स", "राष्ट्रीय करंट अफेयर्स", "सरकारी योजनाएँ"],
      },
      {
        name: "शिक्षा मनोविज्ञान",
        weight: 21,
        topics: ["अधिगम के सिद्धांत", "बुद्धि", "प्रेरणा", "बाल विकास", "शिक्षण विधियाँ"],
      },
    ],
  },
  paper2: {
    name: "पेपर 2 (संस्कृत)",
    totalMarks: 300,
    subjects: [
      {
        name: "व्याकरण",
        weight: 50,
        topics: [
          { name: "संधि", level: "basic", subtopics: ["स्वर संधि", "व्यंजन संधि", "विसर्ग संधि"] },
          { name: "समास", level: "basic", subtopics: ["तत्पुरुष", "बहुव्रीहि", "द्वंद्व", "कर्मधारय"] },
          { name: "शब्द रूप", level: "basic", subtopics: ["राम", "हरि", "गुरु", "नदी", "फल"] },
          { name: "धातु रूप", level: "basic", subtopics: ["भू", "गम्", "पठ्", "लट् लकार", "लङ् लकार", "लोट् लकार"] },
          { name: "कारक एवं विभक्ति", level: "advanced", subtopics: ["कर्ता", "कर्म", "करण", "संप्रदान", "अपादान", "अधिकरण"] },
        ],
      },
      {
        name: "साहित्य",
        weight: 25,
        topics: [
          { name: "लेखक", level: "basic", subtopics: ["कालिदास", "भास", "भवभूति", "माघ"] },
          { name: "प्रमुख कृतियाँ", level: "advanced", subtopics: ["अभिज्ञानशाकुंतलम्", "मेघदूतम्", "रघुवंशम्"] },
        ],
      },
      {
        name: "शिक्षण विधि",
        weight: 15,
        topics: ["व्याकरण अनुवाद विधि", "प्रत्यक्ष विधि", "पाठ योजना", "शिक्षण सहायक सामग्री", "मूल्यांकन"],
      },
      {
        name: "भाषा विकास",
        weight: 10,
        topics: ["संस्कृत भाषा की उत्पत्ति", "भाषा का विकास", "संस्कृत का महत्व"],
      },
    ],
  },
};

// ---- 2) Local storage helpers ----
const STORAGE_KEY = "rpsc_sanskrit_syllabus_tracker_v1";

function loadCheckedSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.checkedKeys)) return new Set();
    return new Set(data.checkedKeys);
  } catch {
    return new Set();
  }
}

function saveCheckedSet(checkedSet) {
  const payload = {
    checkedKeys: Array.from(checkedSet),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

// ---- 3) Utility: create stable unique keys (for persistence) ----
function makeKey(parts) {
  // Keep keys stable and readable; join with "::"
  return parts.join("::");
}

// ---- 4) Flatten topics into "leaf" items (each leaf = 1 checkbox) ----
function buildSubjectLeafItems(paperId, subjectIndex, subject) {
  const leafItems = [];
  const view = []; // used for rendering (supports groups)

  subject.topics.forEach((topic, topicIndex) => {
    // Case A: simple string topic => one checkbox
    if (typeof topic === "string") {
      const key = makeKey([paperId, subjectIndex, "t", topicIndex, topic]);
      leafItems.push({ key, label: topic });
      view.push({ type: "leaf", key, label: topic });
      return;
    }

    // Case B: object topic with subtopics => render a group + checkboxes for each subtopic
    if (topic && typeof topic === "object" && Array.isArray(topic.subtopics)) {
      const groupId = makeKey([paperId, subjectIndex, "g", topicIndex, topic.name]);
      const group = {
        type: "group",
        id: groupId,
        name: topic.name,
        level: topic.level || "",
        items: [],
      };

      topic.subtopics.forEach((sub, subIndex) => {
        const key = makeKey([paperId, subjectIndex, "g", topicIndex, topic.name, "s", subIndex, sub]);
        leafItems.push({ key, label: `${topic.name} • ${sub}` });
        group.items.push({ type: "leaf", key, label: sub, subLabel: topic.name });
      });

      view.push(group);
    }
  });

  return { leafItems, view };
}

// ---- 5) Render UI (papers -> subjects -> topics) ----
const appEl = document.getElementById("app");
const overallMetaEl = document.getElementById("overall-meta");
const overallPercentEl = document.getElementById("overall-percent");
const overallBarEl = document.getElementById("overall-bar");
const overallBarWrapEl = document.querySelector(".overall .bar");
const resetBtn = document.getElementById("btn-reset");

// Keep everything in a single in-memory index for fast progress updates
const state = {
  checked: loadCheckedSet(),
  subjects: [], // [{ id, name, weight, leafKeys[] }]
  totalWeight: 0,
};

function renderApp() {
  // Build & render all papers
  appEl.innerHTML = "";
  state.subjects = [];
  state.totalWeight = 0;

  const paperEntries = Object.entries(syllabus);
  paperEntries.forEach(([paperId, paper]) => {
    const paperEl = document.createElement("section");
    paperEl.className = "paper";
    paperEl.innerHTML = `
      <div class="paper__header">
        <h2 class="paper__title">${paper.name}</h2>
        <div class="paper__marks">Marks: ${paper.totalMarks}</div>
      </div>
    `;

    paper.subjects.forEach((subject, subjectIndex) => {
      const subjectId = makeKey([paperId, "sub", subjectIndex, subject.name]);
      const { leafItems, view } = buildSubjectLeafItems(paperId, subjectIndex, subject);
      const leafKeys = leafItems.map((x) => x.key);

      state.subjects.push({
        id: subjectId,
        name: subject.name,
        weight: Number(subject.weight) || 0,
        leafKeys,
      });
      state.totalWeight += Number(subject.weight) || 0;

      const subjectEl = document.createElement("article");
      subjectEl.className = "subject";
      subjectEl.dataset.subjectId = subjectId;

      // Header button (accordion)
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "subject__btn";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", `${subjectId}__panel`);
      btn.innerHTML = `
        <div class="subject__top">
          <div class="subject__name">${subject.name}</div>
          <div class="actions">
            <span class="pill">Weight: ${subject.weight}</span>
            <span class="chev" aria-hidden="true"></span>
          </div>
        </div>
        <div class="subject__meta">
          <div class="muted" data-subject-meta="${subjectId}">0% • 0/${leafKeys.length} topics</div>
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="bar__fill" data-subject-bar="${subjectId}" style="width: 0%"></div>
          </div>
        </div>
      `;

      // Panel
      const panel = document.createElement("div");
      panel.className = "subject__panel";
      panel.id = `${subjectId}__panel`;

      // Topics list
      const topicsWrap = document.createElement("div");
      topicsWrap.className = "topics";

      view.forEach((node) => {
        if (node.type === "leaf") {
          topicsWrap.appendChild(renderLeaf(node.key, node.label));
          return;
        }
        if (node.type === "group") {
          topicsWrap.appendChild(renderGroup(node));
        }
      });

      panel.appendChild(topicsWrap);
      subjectEl.appendChild(btn);
      subjectEl.appendChild(panel);
      paperEl.appendChild(subjectEl);
    });

    appEl.appendChild(paperEl);
  });

  // After rendering, apply checked state to checkboxes
  syncCheckboxesFromState();
  updateAllProgressUI();
}

function renderLeaf(key, label, subLabel = "") {
  const row = document.createElement("label");
  row.className = "topic";
  row.innerHTML = `
    <input type="checkbox" data-key="${escapeHtmlAttr(key)}" />
    <div>
      <div class="topic__label">${escapeHtml(label)}</div>
      ${subLabel ? `<div class="topic__sub">${escapeHtml(subLabel)}</div>` : ""}
    </div>
  `;
  return row;
}

function renderGroup(groupNode) {
  const box = document.createElement("div");
  box.className = "group";

  const badge = groupNode.level ? `<span class="badge">${escapeHtml(groupNode.level)}</span>` : "";
  box.innerHTML = `
    <div class="group__head">
      <div class="group__name">${escapeHtml(groupNode.name)}</div>
      ${badge}
    </div>
    <div class="group__list"></div>
  `;

  const list = box.querySelector(".group__list");
  groupNode.items.forEach((leaf) => {
    list.appendChild(renderLeaf(leaf.key, leaf.label, leaf.subLabel));
  });
  return box;
}

// ---- 6) Progress calculations (weighted) ----
function countCompleted(keys) {
  let completed = 0;
  keys.forEach((k) => {
    if (state.checked.has(k)) completed += 1;
  });
  return completed;
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function subjectCompletionRatio(subject) {
  const total = subject.leafKeys.length;
  if (total === 0) return 0;
  const done = countCompleted(subject.leafKeys);
  return clamp01(done / total);
}

function weightedSubjectProgress(subject) {
  // Requirement:
  // subjectProgress = (completedTopics / totalTopics) * subjectWeight
  return subjectCompletionRatio(subject) * subject.weight;
}

function overallProgressRatio() {
  // Requirement:
  // totalProgress = sum of all subjectProgress
  // To show a proper percentage, we normalize by total weight.
  const totalWeight = state.totalWeight || 0;
  if (totalWeight <= 0) return 0;

  const sumWeighted = state.subjects.reduce((acc, s) => acc + weightedSubjectProgress(s), 0);
  return clamp01(sumWeighted / totalWeight);
}

function overallCounts() {
  const allKeys = state.subjects.flatMap((s) => s.leafKeys);
  const total = allKeys.length;
  const done = countCompleted(allKeys);
  return { done, total };
}

// ---- 7) Update UI (bars + percentages) ----
function updateAllProgressUI() {
  // Subject progress
  state.subjects.forEach((subject) => {
    const ratio = subjectCompletionRatio(subject);
    const percent = Math.round(ratio * 100);

    const done = countCompleted(subject.leafKeys);
    const total = subject.leafKeys.length;

    const meta = document.querySelector(`[data-subject-meta="${cssEscape(subject.id)}"]`);
    const bar = document.querySelector(`[data-subject-bar="${cssEscape(subject.id)}"]`);
    const barWrap = bar ? bar.closest(".bar") : null;

    if (meta) meta.textContent = `${percent}% • ${done}/${total} topics`;
    if (bar) bar.style.width = `${percent}%`;
    if (barWrap) barWrap.setAttribute("aria-valuenow", String(percent));
  });

  // Overall progress
  const ratio = overallProgressRatio();
  const percent = Math.round(ratio * 100);
  const counts = overallCounts();

  overallMetaEl.textContent = `${percent}% • ${counts.done}/${counts.total} topics`;
  overallPercentEl.textContent = `${percent}%`;
  overallBarEl.style.width = `${percent}%`;
  if (overallBarWrapEl) overallBarWrapEl.setAttribute("aria-valuenow", String(percent));
}

function syncCheckboxesFromState() {
  document.querySelectorAll('input[type="checkbox"][data-key]').forEach((cb) => {
    const key = cb.dataset.key;
    cb.checked = state.checked.has(key);
  });
}

// ---- 8) Accordion behavior ----
function toggleSubject(subjectEl) {
  const isOpen = subjectEl.classList.contains("is-open");
  const btn = subjectEl.querySelector(".subject__btn");
  const panel = subjectEl.querySelector(".subject__panel");

  if (!btn || !panel) return;

  if (isOpen) {
    subjectEl.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    panel.style.maxHeight = "0px";
    return;
  }

  subjectEl.classList.add("is-open");
  btn.setAttribute("aria-expanded", "true");
  // Set maxHeight for smooth animation (from 0 -> scrollHeight)
  panel.style.maxHeight = `${panel.scrollHeight}px`;
}

function refreshOpenPanelHeights() {
  // When content size changes (e.g., fonts, checkbox toggles), update maxHeight so it doesn't clip
  document.querySelectorAll(".subject.is-open .subject__panel").forEach((panel) => {
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  });
}

// ---- 9) Event listeners ----
document.addEventListener("click", (e) => {
  // Accordion header click
  const headerBtn = e.target.closest(".subject__btn");
  if (headerBtn) {
    const subjectEl = headerBtn.closest(".subject");
    if (subjectEl) toggleSubject(subjectEl);
    return;
  }
});

document.addEventListener("change", (e) => {
  // Checkbox change
  const cb = e.target;
  if (!(cb instanceof HTMLInputElement)) return;
  if (cb.type !== "checkbox") return;
  const key = cb.dataset.key;
  if (!key) return;

  if (cb.checked) state.checked.add(key);
  else state.checked.delete(key);

  saveCheckedSet(state.checked);
  updateAllProgressUI();
  refreshOpenPanelHeights();
});

resetBtn.addEventListener("click", () => {
  const ok = confirm("Reset all progress? यह सभी checked topics हटाएगा।");
  if (!ok) return;
  state.checked = new Set();
  saveCheckedSet(state.checked);
  syncCheckboxesFromState();
  updateAllProgressUI();
  refreshOpenPanelHeights();
});

// ---- 10) Add to Home Screen (best-effort) ----
// Notes:
// - On Android Chrome (and some browsers), "beforeinstallprompt" lets us show an Install button.
// - On iOS Safari, there is no prompt; we show simple instructions instead.
const installCard = document.getElementById("install-card");
const installHelp = document.getElementById("install-help");
const installBtn = document.getElementById("btn-install");

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  deferredPrompt = e;
  showInstallCard("Install this app for quick access.");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  try {
    await deferredPrompt.userChoice;
  } finally {
    deferredPrompt = null;
    hideInstallCard();
  }
});

function isIOS() {
  // iPadOS can report as Mac, so also check touch points
  const ua = navigator.userAgent || "";
  const isApple = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isApple;
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function showInstallCard(text) {
  if (!installCard) return;
  installHelp.textContent = text;
  installCard.hidden = false;
}

function hideInstallCard() {
  if (!installCard) return;
  installCard.hidden = true;
}

function setupInstallUX() {
  if (isInStandaloneMode()) {
    hideInstallCard();
    return;
  }

  // iOS: show instructions
  if (isIOS()) {
    showInstallCard('iPhone/iPad: Share → "Add to Home Screen"');
    installBtn.textContent = "OK";
    installBtn.addEventListener(
      "click",
      () => {
        hideInstallCard();
      },
      { once: true },
    );
  }
}

// ---- 11) Small helpers (safe rendering) ----
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeHtmlAttr(str) {
  // Same as HTML escape (good enough for data-* attributes)
  return escapeHtml(str);
}

function cssEscape(str) {
  // For querySelector attribute values (simple escape)
  return String(str).replaceAll('"', '\\"');
}

// ---- Init ----
renderApp();
setupInstallUX();

// Update open panel heights on resize (mobile rotation, etc.)
window.addEventListener("resize", () => {
  refreshOpenPanelHeights();
});

