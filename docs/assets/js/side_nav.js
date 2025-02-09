function openNav() {
    document.getElementById("mySidenav").style.width = "300px";
    toggleOverlay();
  }
  
  /* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
  function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    toggleOverlay();
  } 

  function toggleOverlay() {
    var overlay = document.getElementById("overlay");
    var body = document.body;

    if (overlay.style.display === "none" || overlay.style.display === "") {
        overlay.style.display = "block"; // Show overlay
        body.style.overflow = "hidden";  // Disable background scrolling
    } else {
        overlay.style.display = "none"; // Hide overlay
        body.style.overflow = "auto";   // Re-enable background scrolling
    }
}

function toggleSubMenu() {
  var submenu = document.getElementById("photography-submenu");
  var arrow = document.querySelector(".dropdown-btn .arrow");

  if (submenu.classList.contains("show")) {
      submenu.classList.remove("show");
      arrow.classList.remove("rotate");
      arrow.innerHTML = "▶"; // Point right
  } else {
      submenu.classList.add("show");
      arrow.classList.add("rotate");
      arrow.innerHTML = "▶"; // Point down
  }
}