function smoothScroll(targetId) {
    var target = document.getElementById(targetId);
    if (target) {
      var targetPosition = target.offsetTop - 170; // Get the target element's position with an additional 100px offset from the top
      var startPosition = window.pageYOffset; // Get current position
      var distance = targetPosition - startPosition;
      var duration = 1000; // Set the duration of the scroll in milliseconds
      let start = null;

      // Function to perform the scrolling animation
      function animation(currentTime) {
        if (start === null) {
          start = currentTime;
        }
        var timeElapsed = currentTime - start;
        var run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      }

      // Easing function for smooth scrolling
      function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      }

      requestAnimationFrame(animation);
    }
}

function scrollToTop() {
  const startPosition = window.pageYOffset;
  const distance = -startPosition;
  const duration = 1000;
  let start = null;

  function animation(currentTime) {
    if (start === null) {
      start = currentTime;
    }
    const timeElapsed = currentTime - start;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  // Easing function for smooth scrolling
  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
}

var modal = document.getElementById("myModal");
var img = document.getElementById("img01");
var modalImg = document.getElementById("img01");

document.getElementsByClassName("close")[0].onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function openBiggerImage(photoSrc) {
    modal.style.display = "block";
    modalImg.src = photoSrc;
}