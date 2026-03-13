document.addEventListener("DOMContentLoaded", () => {
    const themeBtn = document.getElementById("theme-toggle");
    
    // Check local storage for preference
    const savedTheme = localStorage.getItem("oa_theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        if(themeBtn) themeBtn.innerHTML = "☀️ Claro";
    }

    if(themeBtn) {
        themeBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-theme");
            if (document.body.classList.contains("dark-theme")) {
                localStorage.setItem("oa_theme", "dark");
                themeBtn.innerHTML = "☀️ Claro";
            } else {
                localStorage.setItem("oa_theme", "light");
                themeBtn.innerHTML = "🌙 Oscuro";
            }
        });
    }
});
