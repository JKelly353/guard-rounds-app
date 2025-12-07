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
  });
});






