const STORAGE_KEY = "cometBayScoreboardData";

function defaultData() {
  return {
    teams: [],
    results: [],
    scoring: {
      win: 3,
      draw: 1,
      loss: 0,
      usePctTiebreaker: false,
      autoWinner: true
    },
    logos: {
      clubLogo: "images/club-logo.png",
      sponsors: [] // { path, enabled }
    },
    backgrounds: {
      mode: "single",
      intervalSeconds: 30,
      overlay: 0.4,
      images: [],   // { path, enabled }
      currentIndex: 0
    }
  };
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData();
  try {
    const parsed = JSON.parse(raw);

    if (!parsed.scoring) {
      parsed.scoring = defaultData().scoring;
    }
    if (!parsed.logos) parsed.logos = {};
    if (!Array.isArray(parsed.logos.sponsors)) {
      if (Array.isArray(parsed.logos.sponsors)) {
        parsed.logos.sponsors = parsed.logos.sponsors.map(p => ({ path: p, enabled: true }));
      } else {
        parsed.logos.sponsors = [];
      }
    } else if (parsed.logos.sponsors.length && typeof parsed.logos.sponsors[0] === "string") {
      parsed.logos.sponsors = parsed.logos.sponsors.map(p => ({ path: p, enabled: true }));
    }
    if (!parsed.logos.clubLogo) {
      parsed.logos.clubLogo = "images/club-logo.png";
    }

    if (!parsed.backgrounds) {
      parsed.backgrounds = defaultData().backgrounds;
    } else {
      if (!Array.isArray(parsed.backgrounds.images)) {
        parsed.backgrounds.images = [];
      }
      if (typeof parsed.backgrounds.mode !== "string") parsed.backgrounds.mode = "single";
      if (typeof parsed.backgrounds.intervalSeconds !== "number") parsed.backgrounds.intervalSeconds = 30;
      if (typeof parsed.backgrounds.overlay !== "number") parsed.backgrounds.overlay = 0.4;
      if (typeof parsed.backgrounds.currentIndex !== "number") parsed.backgrounds.currentIndex = 0;
    }

    return parsed;
  } catch {
    return defaultData();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = loadData();

/* PANEL SWITCHING */

function showPanel(id) {
  document.querySelectorAll(".admin-section").forEach(sec => {
    sec.classList.add("hidden");
  });
  const panel = document.getElementById(id);
  if (panel) panel.classList.remove("hidden");
}

function initPanelButtons() {
  document.getElementById("btnResults").addEventListener("click", () => showPanel("panelResults"));
  document.getElementById("btnTeams").addEventListener("click", () => showPanel("panelTeams"));
  document.getElementById("btnScoring").addEventListener("click", () => showPanel("panelScoring"));
  document.getElementById("btnLogos").addEventListener("click", () => showPanel("panelLogos"));
  document.getElementById("btnBackgrounds").addEventListener("click", () => showPanel("panelBackgrounds"));

  document.getElementById("btnResetEvent").addEventListener("click", () => {
    if (!confirm(
      "This will CLEAR ALL TEAMS and ALL RESULTS.\n\n" +
      "Logos, backgrounds, and settings will NOT be touched.\n\n" +
      "Are you sure you want to reset the event?"
    )) {
      return;
    }

    data.teams = [];
    data.results = [];
    saveData(data);

    renderTeams();
    populateTeamDropdowns();
    renderAdminResults();

    alert("Event reset.\nTeams and results cleared.\nYou may now enter new teams for the next event.");
  });
}

/* TEAMS */

function renderTeams() {
  const container = document.getElementById("teamsList");
  container.innerHTML = "";
  data.teams.forEach((name, index) => {
    const row = document.createElement("div");
    row.className = "team-row";
    const span = document.createElement("span");
    span.textContent = `${index + 1}. ${name}`;
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.addEventListener("click", () => {
      if (!confirm(`Remove "${name}"?`)) return;
      data.teams.splice(index, 1);
      saveData(data);
      renderTeams();
      populateTeamDropdowns();
    });
    row.appendChild(span);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

function initTeams() {
  const form = document.getElementById("addTeamForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("newTeamName");
    const name = input.value.trim();
    if (!name) return;
    data.teams.push(name);
    input.value = "";
    saveData(data);
    renderTeams();
    populateTeamDropdowns();
  });
}

/* RESULTS */

function populateTeamDropdowns() {
  const t1 = document.getElementById("team1Select");
  const t2 = document.getElementById("team2Select");
  [t1, t2].forEach(sel => {
    sel.innerHTML = "";
    data.teams.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
  });
}

function renderAdminResults() {
  const container = document.getElementById("adminResultsList");
  container.innerHTML = "";
  const sorted = [...data.results].sort((a, b) => b.round - a.round || b.timestamp - a.timestamp);
  sorted.forEach(r => {
    const div = document.createElement("div");
    div.className = "admin-result-item";
    const sheetText = r.sheet ? ` • ${r.sheet}` : "";
    div.textContent = `R${r.round}${sheetText}: ${r.team1} ${r.shots1} - ${r.shots2} ${r.team2}`;
    container.appendChild(div);
  });
}

function initResults() {
  const form = document.getElementById("resultForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const round = parseInt(document.getElementById("roundInput").value, 10) || 1;
    const sheet = document.getElementById("sheetInput").value.trim() || "";
    const team1 = document.getElementById("team1Select").value;
    const team2 = document.getElementById("team2Select").value;
    const shots1 = parseInt(document.getElementById("shots1Input").value, 10) || 0;
    const shots2 = parseInt(document.getElementById("shots2Input").value, 10) || 0;
    const winnerMode = document.getElementById("winnerSelect").value;

    if (!team1 || !team2 || team1 === team2) {
      alert("Please select two different teams.");
      return;
    }

    let result = "draw";
    if (winnerMode === "team1") {
      result = "team1";
    } else if (winnerMode === "team2") {
      result = "team2";
    } else if (winnerMode === "draw") {
      result = "draw";
    } else if (winnerMode === "auto" && data.scoring.autoWinner) {
      if (shots1 > shots2) result = "team1";
      else if (shots2 > shots1) result = "team2";
      else result = "draw";
    }

    data.results.push({
      round,
      sheet,
      team1,
      team2,
      shots1,
      shots2,
      result,
      timestamp: Date.now()
    });

    saveData(data);
    renderAdminResults();
    alert("Result saved. The TV display will update automatically.");
  });
}

/* SCORING */

function initScoring() {
  document.getElementById("pointsWin").value = data.scoring.win;
  document.getElementById("pointsDraw").value = data.scoring.draw;
  document.getElementById("pointsLoss").value = data.scoring.loss;
  document.getElementById("usePctTiebreak").checked = data.scoring.usePctTiebreaker;
  document.getElementById("autoWinner").checked = data.scoring.autoWinner;

  const form = document.getElementById("scoringForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    data.scoring.win = parseInt(document.getElementById("pointsWin").value, 10) || 0;
    data.scoring.draw = parseInt(document.getElementById("pointsDraw").value, 10) || 0;
    data.scoring.loss = parseInt(document.getElementById("pointsLoss").value, 10) || 0;
    data.scoring.usePctTiebreaker = document.getElementById("usePctTiebreak").checked;
    data.scoring.autoWinner = document.getElementById("autoWinner").checked;
    saveData(data);
    alert("Scoring settings saved.");
  });
}

/* SPONSORS */

function renderSponsors() {
  const container = document.getElementById("sponsorList");
  container.innerHTML = "";

  data.logos.sponsors.forEach((s, index) => {
    const row = document.createElement("div");
    row.className = "sponsor-row-simple";

    const thumb = document.createElement("img");
    thumb.className = "sponsor-thumb";
    thumb.src = `http://localhost:3000/${s.path}`;
    thumb.alt = "Sponsor logo";
    thumb.onerror = () => {
      thumb.style.opacity = "0.4";
    };

    const info = document.createElement("div");
    info.className = "sponsor-info";
    info.textContent = s.path;

    const controls = document.createElement("div");
    controls.className = "sponsor-controls";

    const label = document.createElement("label");
    label.className = "checkbox-label";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!s.enabled;
    cb.addEventListener("change", () => {
      s.enabled = cb.checked;
      saveData(data);
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode("Show on display"));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      if (!confirm(`Remove sponsor logo: ${s.path}?`)) return;
      data.logos.sponsors.splice(index, 1);
      saveData(data);
      renderSponsors();
    });

    controls.appendChild(label);
    controls.appendChild(removeBtn);

    row.appendChild(thumb);
    row.appendChild(info);
    row.appendChild(controls);
    container.appendChild(row);
  });
}

function initSponsors() {
  renderSponsors();

  const form = document.getElementById("addSponsorForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("newSponsorPath");
    const path = input.value.trim();
    if (!path) return;

    data.logos.sponsors.push({ path, enabled: true });
    saveData(data);
    input.value = "";
    renderSponsors();
    alert("Sponsor added. Display will update automatically.");
  });
}

/* LOGO */

function initLogos() {
  document.getElementById("clubLogoPath").value = data.logos.clubLogo || "images/club-logo.png";

  const form = document.getElementById("logosForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    data.logos.clubLogo = document.getElementById("clubLogoPath").value.trim();
    saveData(data);
    alert("Club logo updated.");
  });

  initSponsors();
}

/* BACKGROUNDS */

function renderBackgroundsGrid() {
  const grid = document.getElementById("backgroundsGrid");
  grid.innerHTML = "";

  data.backgrounds.images.forEach((bg, index) => {
    const div = document.createElement("div");
    div.className = "bg-item";

    const img = document.createElement("img");
    img.className = "bg-thumb";
    img.src = `http://localhost:3000/${bg.path}`;
    img.alt = "Background";
    img.onerror = () => {
      img.style.opacity = "0.3";
    };

    const label = document.createElement("label");
    label.className = "checkbox-label";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!bg.enabled;
    cb.addEventListener("change", () => {
      bg.enabled = cb.checked;
      saveData(data);
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode("Use in rotation"));

    const pathDiv = document.createElement("div");
    pathDiv.textContent = bg.path;
    pathDiv.style.fontSize = "0.75rem";
    pathDiv.style.opacity = "0.8";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.style.marginTop = "4px";
    removeBtn.addEventListener("click", () => {
      if (!confirm(`Remove background: ${bg.path}?`)) return;
      data.backgrounds.images.splice(index, 1);
      saveData(data);
      renderBackgroundsGrid();
    });

    div.appendChild(img);
    div.appendChild(label);
    div.appendChild(pathDiv);
    div.appendChild(removeBtn);
    grid.appendChild(div);
  });
}

function initBackgrounds() {
  document.getElementById("backgroundMode").value = data.backgrounds.mode || "single";
  document.getElementById("backgroundInterval").value = data.backgrounds.intervalSeconds || 30;
  document.getElementById("overlayStrength").value = data.backgrounds.overlay ?? 0.4;

  renderBackgroundsGrid();

  const form = document.getElementById("backgroundSettingsForm");
  form.addEventListener("submit", e => {
    e.preventDefault();
    data.backgrounds.mode = document.getElementById("backgroundMode").value;
    data.backgrounds.intervalSeconds = parseInt(document.getElementById("backgroundInterval").value, 10) || 30;
    data.backgrounds.overlay = parseFloat(document.getElementById("overlayStrength").value) || 0.4;
    saveData(data);
    alert("Background settings saved. The TV display will update automatically.");
  });

  const addForm = document.getElementById("addBackgroundForm");
  addForm.addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("newBackgroundPath");
    const path = input.value.trim();
    if (!path) return;
    data.backgrounds.images.push({ path, enabled: true });
    saveData(data);
    input.value = "";
    renderBackgroundsGrid();
    alert("Background added. Display will use it if enabled.");
  });
}

/* INIT */

document.addEventListener("DOMContentLoaded", () => {
  initPanelButtons();
  renderTeams();
  initTeams();
  populateTeamDropdowns();
  initResults();
  renderAdminResults();
  initScoring();
  initLogos();
  initBackgrounds();
  showPanel("panelResults");
});
