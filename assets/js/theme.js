    localStorage.setItem("khorasan-theme", value);
    apply();
  };
  window.setAccent = (value) => {
    localStorage.setItem("khorasan-accent", value);
    apply();
  };
  window.addEventListener("storage", apply);
})();
