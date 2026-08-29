const DEMO_PROFILES = [
  { name: "Ava", age: 29, city: "London", likes: "hiking,jazz,travel,coffee", bio: "Loves weekend trips and live music.", photo_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80" },
  { name: "Noah", age: 31, city: "London", likes: "coffee,running,movies,travel", bio: "Early riser and marathon fan.", photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80" },
  { name: "Mia", age: 27, city: "Manchester", likes: "yoga,books,travel,cooking", bio: "Bookstore dates are my favorite.", photo_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" },
  { name: "Ethan", age: 30, city: "London", likes: "hiking,gaming,coffee,photography", bio: "Always planning the next photo walk.", photo_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80" },
  { name: "Sophia", age: 28, city: "Bristol", likes: "music,cooking,travel,art", bio: "Creative soul with a foodie side.", photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80" },
  { name: "Liam", age: 32, city: "Leeds", likes: "football,movies,coffee,travel", bio: "Casual and easy-going.", photo_url: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=800&q=80" },
  { name: "Isla", age: 26, city: "London", likes: "hiking,coffee,yoga,art", bio: "Museum days and long walks.", photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80" },
  { name: "Lucas", age: 29, city: "Manchester", likes: "gaming,tech,travel,coffee", bio: "Builder by day, gamer by night.", photo_url: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80" },
  { name: "Amelia", age: 31, city: "London", likes: "jazz,books,cooking,coffee", bio: "Good conversation over espresso.", photo_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80" },
  { name: "Oliver", age: 28, city: "Bristol", likes: "hiking,travel,movies,music", bio: "Open to new experiences.", photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80" }
];

const state = {
  baseProfiles: normalizeProfiles(DEMO_PROFILES),
  publicSubmissions: [],
  topK: 5,
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
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function renderTable(table, rows) {
  if (!rows.length) {
    table.innerHTML = "<tr><td>No data yet.</td></tr>";
    return;
  }
  const headers = ["name", "age", "city", "likes", "bio", "photo_url"];
  const head = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const body = rows
    .map((r) => `<tr>${headers.map((h) => `<td>${h === "likes" ? r.likes.join(", ") : (r[h] ?? "")}</td>`).join("")}</tr>`)
    .join("");
  table.innerHTML = head + body;
}

function syncSelectors() {
  const names = allProfiles().map((p) => p.name).sort();
  const adminSelect = document.getElementById("adminProfileSelect");
  adminSelect.innerHTML = names.map((n) => `<option>${n}</option>`).join("");

  const publicNames = state.publicSubmissions.map((p) => p.name).sort();
  const publicSelect = document.getElementById("publicProfileSelect");
  publicSelect.innerHTML = publicNames.length ? publicNames.map((n) => `<option>${n}</option>`).join("") : "<option>No submissions yet</option>";
}

function getSelectedAdminProfile() {
  const typed = document.getElementById("adminTypedName").value.trim().toLowerCase();
  const selected = document.getElementById("adminProfileSelect").value;
  const profiles = allProfiles();
  if (typed) {
    const found = profiles.find((p) => p.name.toLowerCase() === typed);
    if (found) return found;
  }
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
  selectedCard.innerHTML = `
    <h3>${selected.name}</h3>
    <p>Age: ${selected.age ?? "-"} | City: ${selected.city || "-"}</p>
    <p>Bio: ${selected.bio || "No bio"}</p>
    <p>Likes: ${selected.likes.join(", ") || "-"}</p>
  `;

  const matches = topMatches(selected, profiles, state.topK);
  document.getElementById("adminMatchesTitle").textContent = `Top ${state.topK} Matches`;
  document.getElementById("adminMatches").innerHTML = matches
    .map((m, i) => `
      <div class="match-item">
        <strong>#${i + 1} ${m.profile.name}</strong><br>
        Age: ${m.profile.age ?? "-"} | City: ${m.profile.city || "-"}<br>
        Bio: ${m.profile.bio || "-"}<br>
        Score: ${m.score.toFixed(3)}<br>
        Common likes: ${m.common.join(", ") || "None"}
      </div>
    `)
    .join("");
}

function renderPublic() {
  const publicSelect = document.getElementById("publicProfileSelect");
  const selectedName = publicSelect.value;
  const selected = state.publicSubmissions.find((p) => p.name === selectedName);
  document.getElementById("publicMatchesTitle").textContent = `Top ${state.topK} Public Matches`;

  if (!selected) {
    document.getElementById("publicMatches").innerHTML = "<p class='muted'>Submit a profile to see matches.</p>";
    return;
  }

  const matches = topMatches(selected, allProfiles(), state.topK);
  document.getElementById("publicMatches").innerHTML = matches
    .map((m, i) => {
      const photo = m.profile.photo_url || "https://placehold.co/320x220?text=No+Photo";
      return `
      <div class="public-item">
        <img src="${photo}" alt="${m.profile.name}" />
        <p><strong>#${i + 1} ${m.profile.name}</strong></p>
      </div>
    `;
    })
    .join("");
}

function bindEvents() {
  document.querySelectorAll("input[name='viewMode']").forEach((radio) => {
    radio.addEventListener("change", () => {
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

  document.getElementById("adminTypedName").addEventListener("input", renderAdmin);
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
renderAdmin();
renderPublic();
