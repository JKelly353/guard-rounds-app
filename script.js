const API_URL = "https://script.google.com/macros/s/AKfycbzTc9gD2td1IR1JGPGe0imXL-YZTA0PkRDbv_M5xlQlUyZcKsaihByHWBTtspqcPdqe4w/exec";

function logLocation(location, group) {
  fetch(API_URL, {
    method: "POST",
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
