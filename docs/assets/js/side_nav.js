function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    toggleOverlay();
  }
  
  /* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
  function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    toggleOverlay();
  } 

  function toggleOverlay() {
    var overlay = document.getElementById("overlay");
    // Toggle the display of the overlay
    if (overlay.style.display === "none" || overlay.style.display === "") {
      overlay.style.display = "block"; // Show the overlay
    } else {
      overlay.style.display = "none"; // Hide the overlay
    }
  }