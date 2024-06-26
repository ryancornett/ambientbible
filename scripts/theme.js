export default function Theme(container) {
    let lightTheme = false;
    const switcher = document.querySelector('.switcher');
    switcher.classList.add("theme-switcher");
    switcher.src = lightTheme == false ? "assets/icons/sun.webp" : "assets/icons/moon.webp";
    switcher.addEventListener('click', function () {
        switcher.src = !lightTheme ? "assets/icons/moon.webp" : "assets/icons/sun.webp";
        lightTheme = !lightTheme
        container.classList.toggle("light");
    });
}