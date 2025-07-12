// Canvas setup

const canvas = document.getElementById('bannerCanvas');
const ctx = canvas.getContext('2d');
let letterBoxes = [];
let gamma = 0;
let referenceGamma = 0; 
canvas.width = window.innerWidth;
canvas.height = canvas.offsetHeight;
let beta = 0;
let fingerDownDragging = false;
let mirror = false;
let screen_orientation = 'portrait-primary';
let orientation_supported = 'undefined';
let haltBallInteractionBool = false;
let gravityX = 0;
let gravityY = 0;
let showStartPrompt = false;
let ballEnabled = false;
let promptText = "";
let promptLines = [];
let promptX = 0;
let promptY = 0;
let promptLineHeight = 26;
let promptMaxWidth = 0;
document.cookie = "orientationDeclined; path=/; max-age=31536000";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

window.onload = () => {
  const previouslyDeclined = getCookie('orientationDeclined') === 'true';

  if (previouslyDeclined) {
    orientation_supported = 'false';
    showStartPrompt = false;
    promptText = "";
    return;
  }

  if (typeof DeviceOrientationEvent !== 'undefined' && isMobile()) {
    orientation_supported = 'undefined'; // Will request on click
    showStartPrompt = true;
  } else {
    orientation_supported = 'is not mobile';
    showStartPrompt = false;
  }
};

canvas.addEventListener('click', function (e) {
  if (showStartPrompt && !ballEnabled) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const totalHeight = promptLines.length * promptLineHeight;

    if (
      clickX >= promptX - promptMaxWidth / 2 && clickX <= promptX + promptMaxWidth / 2 &&
      clickY >= promptY && clickY <= promptY + totalHeight
    ) {
          if (orientation_supported === 'undefined') {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          enableOrientation();
        } else {
          console.log("Permission denied.");
          document.cookie = "orientationDeclined=true; path=/; max-age=31536000";
          showStartPrompt = false;
          promptText = "";
        }
      })
      .catch(console.error);
  } else {
    // Android or other mobile that doesn't require permission
    enableOrientation();
  }
}
else {
        ballEnabled = true;
        showStartPrompt = false;
      }
    }
  }
});

function enableOrientation() {
  orientation_supported = 'true';
  screen.orientation.addEventListener("change", (event) => {
    screen_orientation = event.target.type;
  });
  window.addEventListener('deviceorientation', function(event) {
    if (((gamma > 60 && event.gamma < -60) || (gamma < -60 && event.gamma > 60)) && !mirror) {
      mirror = true;
    } else if (((gamma < -60 && event.gamma < -60) || (gamma > 60 && event.gamma > 60)) && mirror) {
      mirror = false;
    }
    gamma = mirror ? -event.gamma : event.gamma;
    beta = event.beta;
  });
  ballEnabled = true;
  showStartPrompt = false;
  promptText = "";
}

// Ball properties
const ball = {
  x: canvas.width / 2,
  y: canvas.height,
  radius: 20,
  color: '#FF5733',
  dx: 0,
  dy: 500,
  dx_list: [0, 0, 0, 0, 0],
  dy_list: [0, 0, 0, 0, 0],
  gravity: 1500,
  bounce: 0.8,
  drag: 0.8,
  isDragging: false,
  previousX: 0,
  previousY: 0,
  maxSpeed: 4000
};

// Name properties
const nameText = "Michael's Workbench"; // Change "Your Name" to your name
const fontSize = 60;
ctx.font = `${fontSize}px Arial`;
const textWidth = ctx.measureText(nameText).width;
let textX = canvas.width / 2;
let textY = canvas.height / 2;

function getTextAsecentandDescent(text, font) {
  // Create a temporary canvas context
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  context.font = font; // Set the desired font
  context.textBaseline = 'middle'
  var metrics = context.measureText(text);
  return [metrics.actualBoundingBoxAscent, metrics.actualBoundingBoxDescent]; // More accurate height
}


function isClippingThroughLetters(ball, ballX, ballY, ballRadius, letterBoxes) {
  const futureX = ballX; // Calculate future x position of the ball
  const futureY = ballY; // Calculate future y position of the ball
  const lineDir = { x: futureX - ball.x, y: futureY - ball.y }; // Direction vector of the ball

  for (const box of letterBoxes) {
    // Check for bounding box overlap

    if (lineIntersectsBox({ x: ball.x, y: ball.y }, { x: futureX, y: futureY }, box)) {
      // Collision detected, bounce the ball off the letter
      //resolveCollision(lineDir, ball); // Pass velocity to handle bouncing
     
      return true; // Collision detected
    }

    const closestX = Math.max(box.x, Math.min(ballX, box.x + box.width));
    const closestY = Math.max(box.top, Math.min(ballY, box.bottom));  

    const distanceX = ballX - closestX;
    const distanceY = ballY - closestY;

    if ((
      (distanceX * distanceX + distanceY * distanceY <= ballRadius * ballRadius)
    ) || (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width || ballY - ballRadius < 0 || ballY + ballRadius > canvas.height)) {
      return true;
    }
  }

  // Check for boundary collisions (canvas edges)
  if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width ||
    ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
     // console.log('poop');
    return true; // Collision with canvas boundary
  }

  return false; // No collision
}

// Raycasting function to check if a line segment intersects with a bounding box
function lineIntersectsBox(lineStart, lineEnd, box) {
  // Define the four corners of the box
  const topLeft = { x: box.x, y: box.top };
  const topRight = { x: box.x + box.width, y: box.top };
  const bottomLeft = { x: box.x, y: box.bottom };
  const bottomRight = { x: box.x + box.width, y: box.bottom };

  // Check if the line intersects any of the box edges
  return (
    lineIntersectsLine(lineStart, lineEnd, topLeft, topRight) || // Top edge
    lineIntersectsLine(lineStart, lineEnd, topRight, bottomRight) || // Right edge
    lineIntersectsLine(lineStart, lineEnd, bottomRight, bottomLeft) || // Bottom edge
    lineIntersectsLine(lineStart, lineEnd, bottomLeft, topLeft) // Left edge
  );
}

function haltBallInteraction() {
  haltBallInteractionBool = true;
}

function resumeBallInteraction() {
  haltBallInteractionBool = false;
}

// Helper function to check if two line segments intersect
function lineIntersectsLine(p1, p2, q1, q2) {
  // Calculate the direction of the lines
  const d1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const d2 = { x: q2.x - q1.x, y: q2.y - q1.y };

  // Calculate the determinant
  const determinant = d1.x * d2.y - d1.y * d2.x;

  if (determinant == 0) {
    // Lines are parallel, no intersection
    return false;
  }

  // Calculate the intersection point
  const t = ((q1.x - p1.x) * d2.y - (q1.y - p1.y) * d2.x) / determinant;
  const u = ((q1.x - p1.x) * d1.y - (q1.y - p1.y) * d1.x) / determinant;

  // Check if intersection point is on both line segments
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Resolve collision by bouncing the ball
function resolveCollision(lineDir, ball) {
  ball.isDragging = false; // Stop dragging the ball
  direction = Math.atan2(lineDir.y, lineDir.x); // Get the angle of the line
  ball.dx = -50 * Math.cos(direction); // Reverse horizontal velocity (you can customize this)
  ball.dy = -50 * Math.sin(direction); // Reverse vertical velocity (you can customize this)
}

function isCollidingWithText(x, y, r) {
  const imageData = ctx.getImageData(x - r, y - r, r * 2, r * 2);
  const pixels = imageData.data;
  let collision = false;
  const edges = {
    top: false,
    bottom: false,
    left: false,
    right: false
  };

  // Loop through the pixel data
  for (let i = 0; i < pixels.length; i += 4) {
    const px = (i / 4) % (r * 2); // X position of pixel in the square
    const py = Math.floor((i / 4) / (r * 2)); // Y position of pixel in the square
    
    const alpha = pixels[i + 3];  // Alpha channel (4th element in the array)
    
    // If the alpha is greater than 0, check for collision and edge positions
    if (alpha > 0) {
      collision = true;

      // Check if the pixel is on any of the edges
      if (py === 0) edges.top = true;       // Top edge (y == 0)
      if (py === r * 2 - 1) edges.bottom = true; // Bottom edge (y == height-1)
      if (px === 0) edges.left = true;      // Left edge (x == 0)
      if (px === r * 2 - 1) edges.right = true; // Right edge (x == width-1)
    }
  }

  // Return an object with the collision status and edge information
  return {
    collision: collision,
    edges: edges
  };
}


// Draw the name
function drawName(name) {
  letterBoxes = [];
  const lineHeight = 60;
  const padding = 10;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const maxWidth = Math.min(canvas.width - 2 * padding, window.innerWidth - 2 * padding);
  y = canvas.height / 2 - lineHeight/2;
  x = canvas.width / 2;

  // Split text into words
  const words = name.split(' ');
  let line = '';

  words.forEach(word => {
      const testLine = line + word + ' ';
      const testWidth = ctx.measureText(testLine).width;

      // Check if adding the next word would exceed the maxWidth
      if (testWidth > maxWidth && line) {
          // Draw the line and move to the next line
          line = line.trimEnd();
          ctx.fillText(line, x, y);
          lineWidth = ctx.measureText(line).width;
          startingX = x - lineWidth/2;
          for (let i = 0; i < line.length; i++) {
              const letter = line[i];
              const letterWidth = ctx.measureText(letter).width;
              const [ascent, descent] = getTextAsecentandDescent(letter, '60px Arial');
              letterBoxes.push({
                  x: startingX,
                  width: letterWidth-20,
                  top: y - ascent,
                  bottom: y + descent,
              });
              startingX += letterWidth;
          };
          line = '';
          y += lineHeight;
      };
      line += word + ' ';
    
})
    if (line) {
      line = line.trimEnd(); 
      ctx.fillText(line, x, y);
    }
    lineWidth = ctx.measureText(line).width;
          startingX = x - lineWidth/2;
          for (let i = 0; i < line.length; i++) {
              const letter = line[i];
              const letterWidth = ctx.measureText(letter).width;
              const [ascent, descent] = getTextAsecentandDescent(letter, '60px Arial');
              letterBoxes.push({
                  x: startingX,
                  width: letterWidth,
                  top: y - ascent,
                  bottom: y + descent,
              });
              startingX += letterWidth;
          };
}

function drawPhoneAngles() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.fillText(`Gamma: ${gamma.toFixed(2)}`, 100, 20);
  ctx.fillText(`Beta: ${beta.toFixed(2)}`, 100, 40);
}

// Draw the ball
function drawBall() {
  ctx.beginPath();
  if (ball.isDragging) {
    ball.dx = ball.x - ball.previousX;
    ball.dy = ball.y - ball.previousY;

  }
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  //ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
  ctx.closePath();
}

// Update ball position and handle collisions
function updateBall(frameTime) {
  gravityX = 0;
  gravityY = 0;
  if (frameTime > 0.1) {
    frameTime = .1;
  }
  if (!ball.isDragging && !haltBallInteractionBool) {
    gravityX = 0;
    gravityY = 0;

    if (screen_orientation == 'portrait-primary' || screen_orientation == 'portrait-secondary') {
      if (screen_orientation == 'portrait-primary') {
        gravityX = Math.sin((gamma) * Math.PI / 180); // Gravity effect on X-axis based on gamma
        gravityY = Math.sin(beta * Math.PI / 180); // Gravity effect on Y-axis based on beta
      } else if (screen_orientation == 'portrait-secondary') {
        gravityX = -Math.sin((gamma) * Math.PI / 180); // Gravity effect on X-axis based on gamma
        gravityY = -Math.sin(beta * Math.PI / 180); // Gravity effect on Y-axis based on beta
      }
    } else if (screen_orientation == 'landscape-primary' || screen_orientation == 'landscape-secondary') {
      if (screen_orientation == 'landscape-primary') {
        gravityX = Math.sin((beta) * Math.PI / 180); // Gravity effect on X-axis based on gamma
        gravityY = -Math.sin(gamma * Math.PI / 180); // Gravity effect on Y-axis based on beta
      } else if (screen_orientation == 'landscape-secondary') {
        gravityX = -Math.sin((beta) * Math.PI / 180); // Gravity effect on X-axis based on gamma
        gravityY = Math.sin(gamma * Math.PI / 180); // Gravity effect on Y-axis based on beta
      }
    }

    if (orientation_supported == 'is not mobile') {
      gravityX = 0;
      gravityY = 1;
    }

    ball.dx += gravityX * ball.gravity * frameTime;
    ball.dy += gravityY * ball.gravity * frameTime;

    ball.dy -= ball.drag * ball.dy * frameTime;
    ball.dx -= ball.drag * ball.dx * frameTime;

    ball.dx = Math.max(-ball.maxSpeed, Math.min(ball.dx, ball.maxSpeed));
    ball.dy = Math.max(-ball.maxSpeed, Math.min(ball.dy, ball.maxSpeed));

    ball.x += ball.dx * frameTime;
    ball.y += ball.dy * frameTime;

  }

    


    // Bounce off canvas edges
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx *= -ball.bounce;
      ball.x = Math.max(ball.radius, Math.min(ball.x, canvas.width - ball.radius));
    }
    if (ball.y + ball.radius > canvas.height) {
      ball.dy *= -ball.bounce;
      ball.y = canvas.height - ball.radius;
    }
    if (ball.y - ball.radius < 0) {
      ball.dy *= -ball.bounce;
      ball.y = 0 + ball.radius;
    }

    // Bounce off text
    isCollidingWithTextResults = isCollidingWithText(ball.x, ball.y, ball.radius);
    if (isCollidingWithTextResults.collision) {
      ball.x -= ball.dx * frameTime;
      ball.y -= ball.dy * frameTime;
      if (isCollidingWithTextResults.edges.top) {
        ball.dy *= -ball.bounce;
        ball.dx *= ball.bounce;
      }
      if (isCollidingWithTextResults.edges.bottom) {
        ball.dy *= -ball.bounce;
        ball.dx *= ball.bounce;
      }
      if (isCollidingWithTextResults.edges.left) {
        ball.dx *= -ball.bounce;
        ball.dy *= ball.bounce;
      }
      if (isCollidingWithTextResults.edges.right) {
        ball.dx *= -ball.bounce;
        ball.dy *= ball.bounce;
      }
      
    }
  }

// Mouse controls
canvas.addEventListener('mousedown', function (event) {

  const mouseX = event.offsetX;
  const mouseY = event.offsetY;
  // Check if the mouse is inside the ball
  if (mouseX >= ball.x - ball.radius && mouseX <= ball.x + ball.radius &&
    mouseY >= ball.y - ball.radius && mouseY <= ball.y + ball.radius) {
    ball.previousX = ball.x;
    ball.previousY = ball.y;
    ball.isDragging = true; // Start dragging
  }
});

canvas.addEventListener('touchstart', function (event) {
  // Prevent the default action (like scrolling)
  const touch = event.touches[0]; // Get the first touch point
  const touchX = touch.clientX - canvas.offsetLeft;
  const touchY = touch.clientY - canvas.offsetTop;
  
  // Check if the touch is inside the ball
  if (touchX >= ball.x - ball.radius && touchX <= ball.x + ball.radius &&
      touchY >= ball.y - ball.radius && touchY <= ball.y + ball.radius) {
        event.preventDefault();
    fingerDownDragging = true;
    ball.previousX = ball.x;
    ball.previousY = ball.y;
    ball.isDragging = true; // Start dragging
  }
});

canvas.addEventListener('mousemove', function (event) {
  if (fingerDownDragging){
    event.preventDefault();
  }

  const mouseX = event.offsetX;
  const mouseY = event.offsetY;

  const insideBall = 
    mouseX >= ball.x - ball.radius &&
    mouseX <= ball.x + ball.radius &&
    mouseY >= ball.y - ball.radius &&
    mouseY <= ball.y + ball.radius;

  if (insideBall) {
    canvas.style.cursor = 'grab';
  } else {
    canvas.style.cursor = 'default';
  }

  if (ball.isDragging && !haltBallInteractionBool) {
    // Get mouse coordinates
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;
    ball.previousX = ball.x;
    ball.previousY = ball.y;
    ball.dx = (mouseX - ball.x)*25;
    ball.dy = (mouseY - ball.y)*25;


    // Get bounding boxes for letters
    //const letterBoxes = getLetterBoundingBoxes(nameText, canvas.width - 20);

    // Check for collision with text
    const isColliding = isClippingThroughLetters(ball, mouseX, mouseY, ball.radius, letterBoxes);

    if (!isColliding) {
      // Only update position if there is no collision
      ball.x = mouseX;
      ball.y = mouseY;
    }

    if (isColliding) {
      ball.x = ball.previousX;
      ball.y = ball.previousY;
    }

    if (
      mouseX < ball.x - ball.radius ||
      mouseX > ball.x + ball.radius ||
      mouseY < ball.y - ball.radius ||
      mouseY > ball.y + ball.radius
    ) {

      ball.isDragging = false; // Stop dragging if the mouse is outside the ball
    }
  }
});

canvas.addEventListener('touchmove', function (event) {
  if (fingerDownDragging) {
    event.preventDefault();
  }
  if (ball.isDragging && !haltBallInteractionBool) { // Prevent default touch actions like scrolling

    // Get the first touch point
    const touch = event.touches[0]; // Use the first touch point
    const touchX = touch.clientX - canvas.offsetLeft;
    const touchY = touch.clientY - canvas.offsetTop;

    // Save previous position for collision check
    ball.previousX = ball.x;
    ball.previousY = ball.y;
    ball.dx = (touchX - ball.x)*25;
    ball.dy = (touchY - ball.y)*25;
    ball.dx_list.push(ball.dx);
    ball.dx_list.shift();
    ball.dy_list.push(ball.dy);
    ball.dy_list.shift();
    ball.dx = ball.dx_list.reduce((a, b) => a + b, 0) / ball.dx_list.length;
    ball.dy = ball.dy_list.reduce((a, b) => a + b, 0) / ball.dy_list.length;

    // Check for collision with text (assuming you have the same function)
    const isColliding = isClippingThroughLetters(ball, touchX, touchY, ball.radius, letterBoxes);

    if (!isColliding) {
      // Only update position if there is no collision
      ball.x = touchX;
      ball.y = touchY;
    }

    if (isColliding) {
      ball.x = ball.previousX;
      ball.y = ball.previousY;
    }

    // Stop dragging if the touch is outside the ball
    if (
      touchX < ball.x - ball.radius ||
      touchX > ball.x + ball.radius ||
      touchY < ball.y - ball.radius ||
      touchY > ball.y + ball.radius
    ) {
      ball.isDragging = false; // Stop dragging if the touch is outside the ball
    }
  }
});

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  promptLines = []; // Store lines globally

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      promptLines.push(line);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  promptLines.push(line);
}
canvas.addEventListener('mouseup', () => {
  ball.isDragging = false;
});

canvas.addEventListener('touchend', () => {
  ball.isDragging = false;
  fingerDownDragging = false;
});

canvas.addEventListener('mouseleave', () => {
  ball.isDragging = false;
});

let lastTime = performance.now();

// Animation loop
function animate() {
  let time = performance.now();
  frameTime = (time - lastTime) / 1000;
  lastTime = time;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (orientation_supported == 'false') {
  drawName(nameText);
}
else if (orientation_supported == 'true' || orientation_supported == 'undefined' || orientation_supported == 'is not mobile') {
  drawName(nameText);

  if (showStartPrompt && !ballEnabled) {
  ctx.fillStyle = '#FFFFFF';
  const promptFontSize = 20;
  ctx.font = `${promptFontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Set global prompt text
  promptText = "Hold your device flat and then tap here to enable ball game";
  promptMaxWidth = canvas.width * 0.8;
  promptLineHeight = 26;
  promptX = canvas.width / 2;
  promptY = canvas.height / 2 + 75;

  drawWrappedText(ctx, promptText, promptX, promptY, promptMaxWidth, promptLineHeight);
}

  if (ballEnabled || orientation_supported == 'is not mobile') {
    updateBall(frameTime);
    drawBall();
  }
}

  requestAnimationFrame(animate);
}


setTimeout(animate, 300);

function resizeCanvas(name) {
  //   Update canvas dimensions
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  textX = (canvas.width - textWidth) / 2;
  textY = canvas.height / 2;

  //   Redraw the static elements after resizing
  drawName(name);
}

// Listen for the resize event
window.addEventListener('resize', (event) => {
  resizeCanvas(nameText);  // Pass the custom argument
});

// Call resizeCanvas on load to set the initial size
resizeCanvas(nameText);

canvas.addEventListener('mouseleave', function () {
  ball.isDragging = false; // Stop dragging when the mouse leaves the canvas

});



function isMobile() {
  const userAgent = navigator.userAgent;
  // Check for mobile devices based on the user agent (Android, iPhone, iPad, etc.)
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
}

function supportsOrientation() {
  if (typeof DeviceOrientationEvent !== 'undefined' && isMobile()) {
    // For iOS 13+ devices, check if we need to request permission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS devices require user interaction to request permission
      return new Promise((resolve, reject) => {
        // Add an event listener to request permission on user interaction (click or touch)
        const interactionListener = (event) => {
          DeviceOrientationEvent.requestPermission()
            .then(response => {
              // Resolve the promise based on permission response
              resolve(response === 'granted');
              // Clean up the listener once permission is requested
              document.removeEventListener('click', interactionListener);
            })
            .catch(reject);
        };

        // Listen for user interaction
        document.addEventListener('click', interactionListener);
      });
    }

    // If requestPermission is not needed (e.g., for other mobile browsers)
    return Promise.resolve(true); // Orientation is supported on other mobile browsers
  }

  return Promise.resolve(false); // Not supported on desktops or non-mobile devices
}

function colorLetterBoxes(letterBoxes) {
  letterBoxes.forEach(box => {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(box.x, box.top, box.width, box.bottom - box.top);
  });
}