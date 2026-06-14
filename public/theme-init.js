/* POWERHOUSE360 — no-flash theme init.
   Runs before paint (next/script beforeInteractive): set <html data-theme>
   from the stored choice, default dark (the brand's primary register). */
(function () {
  try {
    var t = localStorage.getItem("ph360-theme");
    if (t !== "light" && t !== "dark") t = "dark";
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
