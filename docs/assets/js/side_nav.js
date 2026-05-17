function openNav() {
  document.getElementById("mySidenav").style.width = "300px";
  toggleOverlay();
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  toggleOverlay();
}

function toggleOverlay() {
  var overlay = document.getElementById("overlay");
  var body = document.body;

  if (overlay.style.display === "none" || overlay.style.display === "") {
    overlay.style.display = "block";
    body.style.overflow = "hidden";
  } else {
    overlay.style.display = "none";
    body.style.overflow = "auto";
  }
}

function toggleSubMenu() {
  var submenu = document.getElementById("photography-submenu");
  var arrow = document.querySelector(".dropdown-btn .arrow");

  if (submenu.classList.contains("show")) {
    submenu.classList.remove("show");
    arrow.classList.remove("rotate");
  } else {
    submenu.classList.add("show");
    arrow.classList.add("rotate");
  }
}
