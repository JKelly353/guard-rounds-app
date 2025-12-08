// --------------- PIN LOGIN SYSTEM ---------------
const CORRECT_PIN = "4282";  // <<< CHANGE THIS TO YOUR PIN

function checkPIN() {
  const pin = document.getElementById("pin-input").value;

  if (pin === CORRECT_PIN) {
    localStorage.setItem("authenticated", "true");

    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "block";
  } else {
    alert("Incorrect PIN");
  }
}

// Auto-login if user already authenticated this session
window.onload = () => {
  if (localStorage.getItem("authenticated") === "true") {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "block";
  }
   updateLastScanTimes(); // load last scan times
};
// ------------------------------------------------
function updateLastScanTimes() {
  fetch(API_URL)
    .then(response => response.json())
    .then(rows => {
      // rows = [ [timestamp, location, group], ... ]

      const lastTimes = {};

      rows.slice(1).forEach(row => {  
        const timestamp = row[0];
        const location = row[1];

        // Only update if this location hasn't been seen yet, or if this timestamp is newer
        if (!lastTimes[location] || new Date(timestamp) > new Date(lastTimes[location])) {
          lastTimes[location] = timestamp;
        }
      });

      // Now update HTML
      for (const location in lastTimes) {
        const cleanID = location.replace(/\s+/g, '');
        const el = document.getElementById(`last-${cleanID}`);
        if (el) {
          const dateObj = new Date(lastTimes[location]);
          el.textContent = `Last scanned: ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
      }
    })
    .catch(err => console.error("Error fetching data:", err));
}

function loadAnalytics() {
  fetch(API_URL)
    .then(res => res.json())
    .then(rows => {
      rows = rows.slice(1); // remove header row

      const today = new Date().toDateString();
      let totalScansToday = 0;

      const locationCounts = {};
      const hourlyCounts = {};

      rows.forEach(([timestamp, location, group]) => {
        const time = new Date(timestamp);

        // Count today’s scans
        if (time.toDateString() === today) {
          totalScansToday++;

          // Count per location
          locationCounts[location] = (locationCounts[location] || 0) + 1;

          // Count per hour
          const hour = time.getHours();
          hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        }
      });

      // Build analytics HTML
      let html = "";

      html += `<div class="stat-item">Total scans today: <strong>${totalScansToday}</strong></div>`;

      html += `<div class="stat-item"><strong>Scans per location:</strong><br>`;
      for (let loc in locationCounts) {
        html += `${loc}: ${locationCounts[loc]}<br>`;
      }
      html += `</div>`;

      html += `<div class="stat-item"><strong>Scans by hour:</strong><br>`;
      for (let hr in hourlyCounts) {
        html += `${hr}:00 — ${hourlyCounts[hr]} scans<br>`;
      }
      html += `</div>`;

      document.getElementById("stats-container").innerHTML = html;
    });
}
function submitIncident() {
  const location = document.getElementById("incident-location").value;
  const note = document.getElementById("incident-text").value;

  if (note.trim() === "") {
    alert("Please enter a note before submitting.");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      location: location + " (Incident)",
      group: note
    }),
    headers: { "Content-Type": "application/json" }
  });

  document.getElementById("incident-confirm").textContent = "Incident submitted!";
  document.getElementById("incident-text").value = "";
}

const API_URL = "https://script.google.com/macros/s/AKfycbyCLXFC9PrJzM05Xpo-i2_qD-KR28TVXV31EU3AGELLR8Ve1I9W4C1l6T9retC1niBd7Q/exec";

function logLocation(location, group) {
  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",       // ← REQUIRED FOR GOOGLE APPS SCRIPT
    body: JSON.stringify({ location, group }),
    headers: { "Content-Type": "application/json" }
  });

  alert(`Logged: ${location}`);
  updateLastScanTimes();
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "analytics") {
  loadAnalytics();
}
  });
});
// ---------------- LICENSE PLATE SCANNER (UPGRADED) ----------------
async function scanPlate() {
  const fileInput = document.getElementById("plate-photo").files[0];
  if (!fileInput) {
    alert("Please take or select a photo first.");
    return;
  }

  const formData = new FormData();
  formData.append("upload", fileInput);

  document.getElementById("plate-result").innerText = "Scanning...";

  // OCR PLATE
  const response = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
    method: "POST",
    headers: {
      "Authorization": "Token 1ab5e422a49339041fbe461c51b93655c61da383"
    },
    body: formData
  });

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    document.getElementById("plate-result").innerText = "No plate detected.";
    return;
  }

  const plate = data.results[0].plate.toUpperCase();

  // LOOKUP VEHICLE INFO
  const vehicle = await lookupVehicle(plate);

  let vehicleText = "Vehicle info unavailable";
  if (vehicle) {
    vehicleText = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }

  // Display result on screen
  document.getElementById("plate-result").innerHTML = `
  <strong>LICENSE PLATE</strong><br>${plate}<br><br>
  <strong>VEHICLE</strong><br>${vehicleText}
`;


  // Log to Google Sheet
  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: `LICENSE_PLATE: ${plate}`,
      group: vehicleText
    })
  });

  // iPhone vibration for confirmation
  if (navigator.vibrate) navigator.vibrate(100);
}

// --------------------------------------------------------
async function lookupVehicle(plate) {
  const apiKey = "w8f019vJBvwKrq2bzUnZwQ==43hFs8DTzCVRgoEC"; // <-- Replace with your key

  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/vehicle?plate=${plate}`,
      {
        method: "GET",
        headers: { "X-Api-Key": apiKey }
      }
    );

    const data = await response.json();
    return data && data.length > 0 ? data[0] : null;

  } catch (error) {
    console.error("Vehicle lookup failed:", error);
    return null;
  }
}













