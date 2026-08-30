(() => {
  const root = document.documentElement;
  function apply() {
    root.dataset.theme =
      localStorage.getItem("khorasan-theme") ||
      (localStorage.getItem("darkMode") === "true" ? "dark" : "light");
    root.dataset.accent = localStorage.getItem("khorasan-accent") || "blue";
  }
  apply();
  window.setTheme = (value) => {
    localStorage.setItem("khorasan-theme", value);
    apply();
  };
  window.setAccent = (value) => {
    localStorage.setItem("khorasan-accent", value);
    apply();
  };
  window.addEventListener("storage", apply);
})();
