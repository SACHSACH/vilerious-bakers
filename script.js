const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  siteNav.classList.toggle("is-open", !isExpanded);
});

siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    siteNav.classList.remove("is-open");
  }
});

const reviews = [
  {
    text: "A lovely cake is more than dessert. It’s a little centrepiece for a moment you want to remember.",
    author: "Vilerious Bakers",
  },
  {
    text: "Made with care, finished by hand, and created around the people and stories you love.",
    author: "Vilerious Bakers",
  },
  {
    text: "From the first idea to the last slice, we bring a little joy to every celebration.",
    author: "Vilerious Bakers",
  },
];

let currentReview = 0;
const quoteText = document.querySelector("#quote-text");
const quoteAuthor = document.querySelector("#quote-author");
const quoteCount = document.querySelector("#quote-count");

function showReview(direction) {
  currentReview = (currentReview + direction + reviews.length) % reviews.length;
  const review = reviews[currentReview];
  quoteText.textContent = review.text;
  quoteAuthor.innerHTML = `${review.author} <span>· Our promise</span>`;
  quoteCount.innerHTML = `${String(currentReview + 1).padStart(2, "0")} <i>/</i> ${String(reviews.length).padStart(2, "0")}`;
}

document.querySelector("#quote-prev").addEventListener("click", () => showReview(-1));
document.querySelector("#quote-next").addEventListener("click", () => showReview(1));
document.querySelector("#year").textContent = new Date().getFullYear();
