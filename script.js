const API_URL = "https://script.google.com/macros/s/AKfycbyHzmP9UtgASao6xPVQAykH0ukiKWLeiujauGCQwz3xMNmPm-pM5yLH4MKKlfKH80Aalw/exec";

function logLocation(location, group) {
  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",       // ← REQUIRED FOR GOOGLE APPS SCRIPT
    body: JSON.stringify({ location, group }),
    headers: { "Content-Type": "application/json" }
  });

  alert(`Logged: ${location}`);
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});


