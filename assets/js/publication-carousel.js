(function () {
  "use strict";

  document.querySelectorAll("[data-publication-carousel]").forEach(function (carousel) {
    var track = carousel.querySelector(".publication-cards");
    var cards = Array.from(track.querySelectorAll(".publication-card"));
    var controls = carousel.querySelector(".publication-controls");
    var previous = controls.querySelector('[data-direction="-1"]');
    var next = controls.querySelector('[data-direction="1"]');
    var position = controls.querySelector(".publication-position");
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (cards.length < 2) return;
    controls.hidden = false;

    function update() {
      var maxScroll = track.scrollWidth - track.clientWidth;
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= maxScroll - 2;
      var viewport = track.getBoundingClientRect();
      var visible = cards.map(function (card, index) {
        var bounds = card.getBoundingClientRect();
        var overlap = Math.min(bounds.right, viewport.right) - Math.max(bounds.left, viewport.left);
        return overlap >= bounds.width / 2 ? index + 1 : null;
      }).filter(Boolean);
      if (visible.length) {
        var first = visible[0];
        var last = visible[visible.length - 1];
        position.textContent = (first === last ? first : first + "–" + last) + " of " + cards.length;
      }
    }

    function scrollTo(left) {
      track.scrollTo({ left: left, behavior: reducedMotion.matches ? "auto" : "smooth" });
    }

    function move(direction) {
      var current = track.scrollLeft;
      var offsets = cards.map(function (card) { return card.offsetLeft; });
      var target = direction > 0
        ? offsets.find(function (offset) { return offset > current + 3; })
        : offsets.reverse().find(function (offset) { return offset < current - 3; });
      scrollTo(target === undefined ? (direction > 0 ? track.scrollWidth : 0) : target);
    }

    previous.addEventListener("click", function () { move(-1); });
    next.addEventListener("click", function () { move(1); });
    track.addEventListener("keydown", function (event) {
      if (event.target !== track) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        scrollTo(event.key === "Home" ? 0 : track.scrollWidth);
      }
    });

    var pending = false;
    track.addEventListener("scroll", function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () { update(); pending = false; });
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  });
}());
