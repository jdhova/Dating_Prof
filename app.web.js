const DEMO_PROFILES = [
  { name: "Ava", gender: "female", age: 29, city: "London", likes: "hiking,jazz,travel,coffee", bio: "Loves weekend trips and live music.", photo_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80" },
  { name: "Noah", gender: "male", age: 31, city: "London", likes: "coffee,running,movies,travel", bio: "Early riser and marathon fan.", photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80" },
  { name: "Mia", gender: "female", age: 27, city: "Manchester", likes: "yoga,books,travel,cooking", bio: "Bookstore dates are my favorite.", photo_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" },
  { name: "Ethan", gender: "male", age: 30, city: "London", likes: "hiking,gaming,coffee,photography", bio: "Always planning the next photo walk.", photo_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80" },
  { name: "Sophia", gender: "female", age: 28, city: "Bristol", likes: "music,cooking,travel,art", bio: "Creative soul with a foodie side.", photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80" },
  { name: "Liam", gender: "male", age: 32, city: "Leeds", likes: "football,movies,coffee,travel", bio: "Casual and easy-going.", photo_url: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=800&q=80" },
  { name: "Isla", gender: "female", age: 26, city: "London", likes: "hiking,coffee,yoga,art", bio: "Museum days and long walks.", photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80" },
  { name: "Lucas", gender: "male", age: 29, city: "Manchester", likes: "gaming,tech,travel,coffee", bio: "Builder by day, gamer by night.", photo_url: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80" },
  { name: "Amelia", gender: "female", age: 31, city: "London", likes: "jazz,books,cooking,coffee", bio: "Good conversation over espresso.", photo_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80" },
  { name: "Oliver", gender: "male", age: 28, city: "Bristol", likes: "hiking,travel,movies,music", bio: "Open to new experiences.", photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80" }
];

const state = {
  baseProfiles: normalizeProfiles(DEMO_PROFILES),
  publicSubmissions: [],
  topK: 5,
  sessionRole: null,
};

const DEMO_ACCOUNTS = {
  admin_demo: { password: "admin123", role: "admin" },
  public_demo: { password: "public123", role: "public" },
};

function parseLikes(input) {
  return String(input || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeProfiles(rows) {
  return rows
    .map((r) => ({
      name: String(r.name || "").trim(),
      gender: normalizeGender(r.gender),
      age: Number.isFinite(Number(r.age)) ? Number(r.age) : null,
      city: String(r.city || "").trim(),
      likes: parseLikes(r.likes),
      bio: String(r.bio || "").trim(),
      photo_url: String(r.photo_url || "").trim(),
    }))
    .filter((p) => p.name);
}

function allProfiles() {
  return [...state.baseProfiles, ...state.publicSubmissions];
}

function normalizeGender(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "male" || raw === "m") return "male";
  if (raw === "female" || raw === "f") return "female";
  return "";
}

function oppositeGender(value) {
  if (value === "male") return "female";
  if (value === "female") return "male";
  return "";
}

function oppositeGenderPool(selected, profiles) {
  const target = oppositeGender(normalizeGender(selected.gender));
  if (!target) return [];
  return profiles.filter(
    (p) => p.name.toLowerCase() !== selected.name.toLowerCase() && normalizeGender(p.gender) === target
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function photoOrFallback(url) {
  return url || "https://placehold.co/320x220?text=No+Photo";
}

function ageScore(a, b, maxGap = 15) {
  if (a == null || b == null) return 0;
  const gap = Math.abs(a - b);
  return Math.max(0, 1 - gap / maxGap);
}

function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]);
  if (!union.size) return 0;
  let inter = 0;
  setA.forEach((x) => {
    if (setB.has(x)) inter += 1;
  });
  return inter / union.size;
}

function score(source, candidate) {
  const likes = jaccard(source.likes, candidate.likes);
  const city = source.city && candidate.city && source.city.toLowerCase() === candidate.city.toLowerCase() ? 1 : 0;
  const age = ageScore(source.age, candidate.age);
  return 0.8 * likes + 0.1 * city + 0.1 * age;
}

function topMatches(selected, profiles, limit) {
  return profiles
    .filter((p) => p.name.toLowerCase() !== selected.name.toLowerCase())
    .map((p) => ({
      profile: p,
      score: score(selected, p),
      common: selected.likes.filter((x) => p.likes.includes(x)),
    }))
    .sort((a, b) => {
      if (b.common.length !== a.common.length) {
        return b.common.length - a.common.length;
      }
      return b.score - a.score;
    })
    .slice(0, limit);
}

function renderTable(table, rows) {
  if (!rows.length) {
    table.innerHTML = "<tr><td>No data yet.</td></tr>";
    return;
  }
  const headers = ["name", "gender", "age", "city", "likes", "bio", "photo_url"];
  const head = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => `<tr>${headers.map((h) => {
      if (h === "likes") {
        return `<td>${escapeHtml(r.likes.join(", "))}</td>`;
      }
      if (h === "gender") {
        return `<td>${escapeHtml((r.gender || "-").toString())}</td>`;
      }
      if (h === "photo_url") {
        const photo = photoOrFallback(r.photo_url);
        return `<td><img class="photo-mini" src="${escapeHtml(photo)}" alt="${escapeHtml(r.name)}" /></td>`;
      }
      return `<td>${escapeHtml(r[h] ?? "")}</td>`;
    }).join("")}</tr>`)
    .join("");
  table.innerHTML = head + body;
}

function syncSelectors() {
  const names = allProfiles().map((p) => p.name).sort();
  const adminSelect = document.getElementById("adminProfileSelect");
  const prevAdminValue = adminSelect.value;
  adminSelect.innerHTML = names.map((n) => `<option>${n}</option>`).join("");
  if (prevAdminValue && names.includes(prevAdminValue)) {
    adminSelect.value = prevAdminValue;
  }

  const publicNames = state.publicSubmissions.map((p) => p.name).sort();
  const publicSelect = document.getElementById("publicProfileSelect");
  const prevPublicValue = publicSelect.value;
  publicSelect.innerHTML = publicNames.length ? publicNames.map((n) => `<option>${n}</option>`).join("") : "<option>No submissions yet</option>";
  if (prevPublicValue && publicNames.includes(prevPublicValue)) {
    publicSelect.value = prevPublicValue;
  }
}

function getSelectedAdminProfile() {
  const selected = document.getElementById("adminProfileSelect").value;
  const profiles = allProfiles();
  return profiles.find((p) => p.name === selected) || profiles[0];
}

function renderAdmin() {
  const profiles = allProfiles();
  document.getElementById("snapshotText").textContent = `Total profiles: ${profiles.length} | Base profiles: ${state.baseProfiles.length} | Public submissions: ${state.publicSubmissions.length}`;

  renderTable(document.getElementById("allProfilesTable"), profiles);
  renderTable(document.getElementById("publicProfilesTable"), state.publicSubmissions);
  syncSelectors();

  if (!profiles.length) return;
  const selected = getSelectedAdminProfile();
  const selectedCard = document.getElementById("selectedProfileCard");
  const selectedPhoto = photoOrFallback(selected.photo_url);
  selectedCard.innerHTML = `
    <h3>${escapeHtml(selected.name)}</h3>
    <p>Gender: ${escapeHtml(selected.gender || "-")} | Age: ${escapeHtml(selected.age ?? "-")} | City: ${escapeHtml(selected.city || "-")}</p>
    <p>Bio: ${escapeHtml(selected.bio || "No bio")}</p>
    <p>Likes: ${escapeHtml(selected.likes.join(", ") || "-")}</p>
    <img src="${escapeHtml(selectedPhoto)}" alt="${escapeHtml(selected.name)}" />
  `;

  const selectedGender = normalizeGender(selected.gender);
  const adminHint = document.getElementById("adminMatchHint");
  if (!selectedGender) {
    adminHint.textContent = "Set gender to male/female to compute matches.";
    document.getElementById("adminMatches").innerHTML = "<p class='muted'>No matches for this profile yet.</p>";
    return;
  }

  const candidates = oppositeGenderPool(selected, profiles);
  if (!candidates.length) {
    adminHint.textContent = `No ${oppositeGender(selectedGender)} profiles available for matching.`;
    document.getElementById("adminMatches").innerHTML = "<p class='muted'>No opposite-gender matches available.</p>";
    return;
  }

  const matches = topMatches(selected, candidates, state.topK);
  document.getElementById("adminMatchesTitle").textContent = `Top ${state.topK} Matches for ${selected.name}`;
  document.getElementById("adminMatchHint").textContent = "Opposite gender only. Ranked by common interests first, then overall compatibility.";
  document.getElementById("adminMatches").innerHTML = matches
    .map((m, i) => `
      <div class="match-item">
        <div class="match-head">
          <img src="${escapeHtml(photoOrFallback(m.profile.photo_url))}" alt="${escapeHtml(m.profile.name)}" />
          <div>
            <strong>#${i + 1} ${escapeHtml(m.profile.name)}</strong><br>
            Gender: ${escapeHtml(m.profile.gender || "-")} | Age: ${escapeHtml(m.profile.age ?? "-")} | City: ${escapeHtml(m.profile.city || "-")}<br>
            Bio: ${escapeHtml(m.profile.bio || "-")}<br>
            Score: ${m.score.toFixed(3)}<br>
            Common likes: ${escapeHtml(m.common.join(", ") || "None")}
          </div>
        </div>
      </div>
    `)
    .join("");
}

function renderPublic() {
  const publicSelect = document.getElementById("publicProfileSelect");
  const selectedName = publicSelect.value;
  const selected = state.publicSubmissions.find((p) => p.name === selectedName);
  document.getElementById("publicMatchesTitle").textContent = `Top ${state.topK} Public Matches${selected ? ` for ${selected.name}` : ""}`;

  if (!selected) {
    document.getElementById("publicMatches").innerHTML = "<p class='muted'>Submit a profile to see matches.</p>";
    return;
  }

  const selectedGender = normalizeGender(selected.gender);
  if (!selectedGender) {
    document.getElementById("publicMatches").innerHTML = "<p class='muted'>Set your gender to male/female to see matches.</p>";
    return;
  }

  const candidates = oppositeGenderPool(selected, allProfiles());
  if (!candidates.length) {
    document.getElementById("publicMatches").innerHTML = `<p class='muted'>No ${escapeHtml(oppositeGender(selectedGender))} profiles available yet.</p>`;
    return;
  }

  const matches = topMatches(selected, candidates, state.topK);
  document.getElementById("publicMatches").innerHTML = matches
    .map((m, i) => {
      const photo = m.profile.photo_url || "https://placehold.co/320x220?text=No+Photo";
      return `
      <div class="public-item">
        <img src="${escapeHtml(photo)}" alt="${escapeHtml(m.profile.name)}" />
        <p><strong>#${i + 1} ${escapeHtml(m.profile.name)}</strong></p>
      </div>
    `;
    })
    .join("");
}

function setViewMode(mode) {
  const isAdmin = mode === "admin";
  document.querySelector("input[name='viewMode'][value='admin']").checked = isAdmin;
  document.querySelector("input[name='viewMode'][value='public']").checked = !isAdmin;
  document.getElementById("adminView").classList.toggle("hidden", !isAdmin);
  document.getElementById("publicView").classList.toggle("hidden", isAdmin);
}

function applySessionRole() {
  const rolePanel = document.getElementById("roleSwitchPanel");
  const loginPanel = document.getElementById("loginPanel");
  const roleText = document.getElementById("activeRoleText");

  if (!state.sessionRole) {
    loginPanel.classList.remove("hidden");
    rolePanel.classList.add("hidden");
    document.getElementById("adminView").classList.add("hidden");
    document.getElementById("publicView").classList.add("hidden");
    return;
  }

  loginPanel.classList.add("hidden");
  rolePanel.classList.remove("hidden");
  roleText.textContent = `Signed in as ${state.sessionRole} demo`;

  if (state.sessionRole === "admin") {
    setViewMode("admin");
  } else {
    setViewMode("public");
  }

  renderAdmin();
  renderPublic();
}

function signIn(username, password) {
  const msg = document.getElementById("loginMsg");
  const user = DEMO_ACCOUNTS[username];
  if (!user || user.password !== password) {
    msg.textContent = "Invalid demo credentials.";
    return;
  }
  state.sessionRole = user.role;
  msg.textContent = "";
  applySessionRole();
}

function bindEvents() {
  document.getElementById("loginBtn").addEventListener("click", () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    signIn(username, password);
  });

  document.getElementById("loginAsAdmin").addEventListener("click", () => {
    signIn("admin_demo", "admin123");
  });

  document.getElementById("loginAsPublic").addEventListener("click", () => {
    signIn("public_demo", "public123");
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    state.sessionRole = null;
    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";
    document.getElementById("loginMsg").textContent = "";
    applySessionRole();
  });

  document.querySelectorAll("input[name='viewMode']").forEach((radio) => {
    radio.addEventListener("change", () => {
      if (state.sessionRole !== "admin") {
        setViewMode("public");
        return;
      }
      const isAdmin = radio.value === "admin" && radio.checked;
      document.getElementById("adminView").classList.toggle("hidden", !isAdmin);
      document.getElementById("publicView").classList.toggle("hidden", isAdmin);
      renderAdmin();
      renderPublic();
    });
  });

  document.getElementById("topK").addEventListener("input", (e) => {
    state.topK = Number(e.target.value);
    document.getElementById("topKLabel").textContent = String(state.topK);
    renderAdmin();
    renderPublic();
  });

  document.getElementById("adminProfileSelect").addEventListener("change", renderAdmin);
  document.getElementById("publicProfileSelect").addEventListener("change", renderPublic);

  document.getElementById("csvUpload").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = normalizeProfiles(results.data || []);
        if (!parsed.length) {
          alert("CSV upload has no valid profiles. Required columns: name, likes.");
          return;
        }
        state.baseProfiles = parsed;
        renderAdmin();
        renderPublic();
      },
    });
  });

  document.getElementById("publicForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = String(fd.get("name") || "").trim();
    const likes = parseLikes(fd.get("likes"));
    const msg = document.getElementById("publicFormMsg");

    if (!name) {
      msg.textContent = "Name is required.";
      return;
    }
    if (!likes.length) {
      msg.textContent = "Please provide at least one like.";
      return;
    }
    if (allProfiles().some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      msg.textContent = "Name already exists. Use another name.";
      return;
    }

    state.publicSubmissions.push({
      name,
      gender: normalizeGender(fd.get("gender")),
      age: Number(fd.get("age")) || null,
      city: String(fd.get("city") || "").trim(),
      likes,
      bio: String(fd.get("bio") || "").trim(),
      photo_url: String(fd.get("photo_url") || "").trim(),
    });

    msg.textContent = "Profile submitted.";
    e.target.reset();
    syncSelectors();
    document.getElementById("publicProfileSelect").value = name;
    renderAdmin();
    renderPublic();
  });
}

bindEvents();
applySessionRole();
