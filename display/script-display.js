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

    if (!parsed.scoring) parsed.scoring = defaultData().scoring;

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
    if (!parsed.logos.clubLogo) parsed.logos.clubLogo = "images/club-logo.png";

    if (!parsed.backgrounds) parsed.backgrounds = defaultData().backgrounds;
    else {
      if (!Array.isArray(parsed.backgrounds.images)) parsed.backgrounds.images = [];
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

/* LADDER */

function computeLadder(data) {
  const stats = {};
  data.teams.forEach(t => {
    stats[t] = {
      team: t,
      gp: 0,
      w: 0,
      d: 0,
      l: 0,
      sf: 0,
      sa: 0,
      sd: 0,
      pct: 0,
      pts: 0
    };
  });

  data.results.forEach(r => {
    const t1 = stats[r.team1];
    const t2 = stats[r.team2];
    if (!t1 || !t2) return;

    t1.gp++;
    t2.gp++;
    t1.sf += r.shots1;
    t1.sa += r.shots2;
    t2.sf += r.shots2;
    t2.sa += r.shots1;

    if (r.result === "team1") {
      t1.w++;
      t2.l++;
      t1.pts += data.scoring.win;
      t2.pts += data.scoring.loss;
    } else if (r.result === "team2") {
      t2.w++;
      t1.l++;
      t2.pts += data.scoring.win;
      t1.pts += data.scoring.loss;
    } else if (r.result === "draw") {
      t1.d++;
      t2.d++;
      t1.pts += data.scoring.draw;
      t2.pts += data.scoring.draw;
    }
  });

  Object.values(stats).forEach(s => {
    s.sd = s.sf - s.sa;
    if (s.sa > 0) {
      s.pct = (s.sf / s.sa) * 100;
    } else if (s.sf > 0) {
      s.pct = 999;
    } else {
      s.pct = 0;
    }
  });

  const ladder = Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sd !== a.sd) return b.sd - a.sd;
    if (b.sf !== a.sf) return b.sf - a.sf;
    if (data.scoring.usePctTiebreaker && b.pct !== a.pct) {
      return b.pct - a.pct;
    }
    return a.team.localeCompare(b.team);
  });

  return ladder;
}

function renderLadder(data) {
  const ladder = computeLadder(data);
  const tbody = document.querySelector("#ladderTable tbody");
  tbody.innerHTML = "";

  ladder.forEach((row, index) => {
    const tr = document.createElement("tr");
    const cells = [
      index + 1,
      row.team,
      row.gp,
      row.w,
      row.d,
      row.l,
      row.sf,
      row.sa,
      row.sd,
      row.pct ? row.pct.toFixed(1) : "-",
      row.pts
    ];
    cells.forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

/* RESULTS */

function renderResults(data) {
  const container = document.getElementById("resultsList");
  container.innerHTML = "";

  const sorted = [...data.results].sort((a, b) => b.round - a.round || b.timestamp - a.timestamp);

  sorted.forEach(r => {
    const div = document.createElement("div");
    div.className = "result-item";

    const teamsSpan = document.createElement("span");
    teamsSpan.className = "result-teams";
    teamsSpan.textContent = `${r.team1} vs ${r.team2}`;

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "result-score";
    const sheetText = r.sheet ? ` • ${r.sheet}` : "";
    scoreSpan.textContent = `R${r.round}${sheetText}: ${r.shots1} - ${r.shots2}`;

    div.appendChild(teamsSpan);
    div.appendChild(scoreSpan);
    container.appendChild(div);
  });
}

/* LOGOS + SPONSOR CAROUSEL */

let sponsorCarouselState = {
  sponsors: [],
  startIndex: 0,
  visibleCount: 0,
  timer: null
};

function renderLogos(data) {
  const clubLogo = document.getElementById("clubLogo");
  if (clubLogo && data.logos.clubLogo) {
    clubLogo.src = `http://localhost:3000/${data.logos.clubLogo}`;
  }

  const sponsorsBar = document.getElementById("sponsorsBar");
  sponsorsBar.innerHTML = "";

  const enabledSponsors = (data.logos.sponsors || []).filter(s => s.enabled);
  sponsorCarouselState.sponsors = enabledSponsors;
  sponsorCarouselState.startIndex = 0;

  if (enabledSponsors.length === 0) return;

  computeVisibleSponsors();
  renderSponsorStrip();
  startSponsorCarousel();
}

function computeVisibleSponsors() {
  const bar = document.getElementById("sponsorsBar");
  const barWidth = bar.clientWidth || window.innerWidth;
  const approxLogoWidth = 160;
  const total = sponsorCarouselState.sponsors.length;
  let visible = Math.floor(barWidth / approxLogoWidth);
  if (visible < 1) visible = 1;
  if (visible > total) visible = total;
  sponsorCarouselState.visibleCount = visible;
}

function renderSponsorStrip() {
  const bar = document.getElementById("sponsorsBar");
  bar.innerHTML = "";

  const { sponsors, startIndex, visibleCount } = sponsorCarouselState;
  if (!sponsors.length) return;

  for (let i = 0; i < visibleCount; i++) {
    const idx = (startIndex + i) % sponsors.length;
    const s = sponsors[idx];

    const img = document.createElement("img");
    img.src = `http://localhost:3000/${s.path}`;
    img.className = "sponsor-logo";
    img.alt = "Sponsor";

    bar.appendChild(img);
  }

  const centreIndex = Math.floor(visibleCount / 2);
  const logos = bar.querySelectorAll(".sponsor-logo");
  if (logos[centreIndex]) {
    logos[centreIndex].classList.add("active");
  }
}

function startSponsorCarousel() {
  if (sponsorCarouselState.timer) {
    clearInterval(sponsorCarouselState.timer);
    sponsorCarouselState.timer = null;
  }

  if (sponsorCarouselState.sponsors.length <= 1) {
    renderSponsorStrip();
    return;
  }

  sponsorCarouselState.timer = setInterval(() => {
    sponsorCarouselState.startIndex =
      (sponsorCarouselState.startIndex + 1) % sponsorCarouselState.sponsors.length;
    renderSponsorStrip();
  }, 5000);
}

/* BACKGROUNDS */

let bgTimer = null;

function applyBackgroundOverlay(value) {
  const overlay = document.getElementById("backgroundOverlay");
  if (overlay) {
    overlay.style.background = `rgba(0,0,0,${value})`;
  }
}

function setBackgroundImage(path) {
  const bg = document.getElementById("backgroundImage");
  if (bg) {
    bg.style.backgroundImage = path ? `url("${path}")` : "none";
  }
}

function startBackgroundRotation(data) {
  if (bgTimer) {
    clearInterval(bgTimer);
    bgTimer = null;
  }

  const allImages = data.backgrounds.images || [];
  const enabledImages = allImages.filter(img => img.enabled);
  const mode = data.backgrounds.mode || "single";
  const interval = (data.backgrounds.intervalSeconds || 30) * 1000;
  applyBackgroundOverlay(data.backgrounds.overlay ?? 0.4);

  if (enabledImages.length === 0) {
    setBackgroundImage("");
    return;
  }

  let currentIndex = data.backgrounds.currentIndex || 0;
  if (currentIndex >= enabledImages.length) currentIndex = 0;

  function updateSingle() {
    const img = enabledImages[0];
    setBackgroundImage(`http://localhost:3000/${img.path}`);
  }

  function updateSequential() {
    if (currentIndex >= enabledImages.length) currentIndex = 0;
    const img = enabledImages[currentIndex];
    setBackgroundImage(`http://localhost:3000/${img.path}`);
    currentIndex++;
    data.backgrounds.currentIndex = currentIndex;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function updateRandom() {
    const rand = Math.floor(Math.random() * enabledImages.length);
    const img = enabledImages[rand];
    setBackgroundImage(`http://localhost:3000/${img.path}`);
  }

  if (mode === "single") {
    updateSingle();
    return;
  }

  if (mode === "sequential") {
    updateSequential();
    bgTimer = setInterval(updateSequential, interval);
    return;
  }

  if (mode === "random") {
    updateRandom();
    bgTimer = setInterval(updateRandom, interval);
    return;
  }
}

/* MAIN REFRESH */

function refreshDisplay() {
  const data = loadData();
  renderLadder(data);
  renderResults(data);
  renderLogos(data);
  startBackgroundRotation(data);
}

window.addEventListener("resize", () => {
  if (!sponsorCarouselState.sponsors.length) return;
  computeVisibleSponsors();
  renderSponsorStrip();
});

document.addEventListener("DOMContentLoaded", () => {
  refreshDisplay();
  setInterval(refreshDisplay, 15000);
});
