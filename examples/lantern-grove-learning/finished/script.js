const detailsButton = document.querySelector("#details-button");
const details = document.querySelector("#details");
const formButton = document.querySelector("#form-button");
const contactForm = document.querySelector("#contact-form");
const formMessage = document.querySelector("#form-message");
const year = document.querySelector("#year");

if (detailsButton && details) {
    detailsButton.addEventListener("click", function () {
        const willOpen = details.hidden;
        details.hidden = !willOpen;
        detailsButton.setAttribute("aria-expanded", String(willOpen));
        detailsButton.textContent = willOpen
            ? "Hide learning support details"
            : "Show learning support details";
    });
}

if (formButton && contactForm) {
    formButton.addEventListener("click", function () {
        const willOpen = contactForm.hidden;
        contactForm.hidden = !willOpen;
        formButton.setAttribute("aria-expanded", String(willOpen));
        formButton.textContent = willOpen
            ? "Hide contact form"
            : "Show contact form";
    });
}

if (contactForm && formMessage) {
    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();
        formMessage.textContent =
            "Demonstration request entered locally. Nothing was sent or permanently saved.";
    });
}

if (year) {
    year.textContent = new Date().getFullYear();
}
