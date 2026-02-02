document.addEventListener("DOMContentLoaded", () => {
    const navbarContainer = document.getElementById("navbar");

    if (!navbarContainer) return;

    fetch("/frontend/components/navbar.html")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load navbar");
            }
            return response.text();
        })
        .then(data => {
            navbarContainer.innerHTML = data;

            setActiveNavLink();
        })
        .catch(error => {
            console.error("Navbar load error:", error);
        });
});

function setActiveNavLink() {
    const currentPath = window.location.pathname;

    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        }
    });
}
