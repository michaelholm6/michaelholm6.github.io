// Canvas setup
const canvas = document.getElementById('bannerCanvas');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Ball properties
const ball = {
  x: canvas.width / 2,
  y: 50,
  radius: 20,
  color: '#FF5733',
  dx: 0,
  dy: 0,
  gravity: 0.5,
  bounce: 0.7,
  drag: 0.98,
  isDragging: false,
  previousX: 0,
  previousY: 0,
  maxSpeed: 70
};

// Name properties
const nameText = "Michael's Workshop"; // Change "Your Name" to your name
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

function getLetterBoundingBoxes(text, x, y) {
  const letterBoxes = [];
  ctx.font = '60px Arial'; // Ensure font is set correctly
  let currentX = x; // Start position for each letter

  for (let i = 0; i < text.length; i++) {
    const letter = text[i];
    const width = ctx.measureText(letter).width;
    //const height = parseInt(ctx.font, 10);
    const [ascent, descent] = getTextAsecentandDescent(text[i], '60px Arial'); // Adjust this based on your font size

    // Create a bounding box for the letter
    letterBoxes.push({
      x: currentX,
      width: width,
      top: y - ascent,
      bottom: y + descent,
    });

    // Move the starting position for the next letter
    currentX += width; // Move right for the next letter
  }

  return letterBoxes;
}


function isClippingThroughLetters(ball, ballX, ballY, ballRadius, letterBoxes) {
  const futureX = ballX; // Calculate future x position of the ball
  const futureY = ballY; // Calculate future y position of the ball
  const lineDir = { x: futureX - ball.x, y: futureY - ball.y }; // Direction vector of the ball

  for (const box of letterBoxes) {
    // Check for bounding box overlap

    if (lineIntersectsBox({ x: ball.x, y: ball.y }, { x: futureX, y: futureY }, box)) {
      // Collision detected, bounce the ball off the letter
      resolveCollision(lineDir, ball); // Pass velocity to handle bouncing
      return true; // Collision detected
    }

    if ((
      ballX + ballRadius > box.x &&
      ballX - ballRadius < box.x + box.width &&
      ballY + ballRadius > box.top &&
      ballY - ballRadius < box.bottom
    ) || (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width || ballY - ballRadius < 0 || ballY + ballRadius > canvas.height)) {
      return true;
    }
  }

  // Check for boundary collisions (canvas edges)
  if (ballX - ballRadius < 0 || ballX + ballRadius > canvas.width ||
    ballY - ballRadius < 0 || ballY + ballRadius > canvas.height) {
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
  ball.dx = -10 * Math.cos(direction); // Reverse horizontal velocity (you can customize this)
  ball.dy = -10 * Math.sin(direction); // Reverse vertical velocity (you can customize this)
}

function isCollidingWithText(x, y, r) {
  const imageData = ctx.getImageData(x - r, y - r, r * 2, r * 2);
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] > 0) return true;
  }
  return false;
}


// Draw the name
function drawName() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  ctx.fillText(nameText, textX, textY);
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
  ctx.fill();
  ctx.closePath();
}

// Update ball position and handle collisions
function updateBall() {
  if (!ball.isDragging) {

    ball.dy += ball.gravity;
    ball.dy *= ball.drag;
    ball.dx *= ball.drag;

    ball.dx = Math.max(-ball.maxSpeed, Math.min(ball.dx, ball.maxSpeed));
    ball.dy = Math.max(-ball.maxSpeed, Math.min(ball.dy, ball.maxSpeed));

    ball.x += ball.dx;
    ball.y += ball.dy;


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
    if (isCollidingWithText(ball.x, ball.y, ball.radius)) {
      ball.x -= ball.dx;
      ball.y -= ball.dy;
      ball.dy *= -ball.bounce;
      ball.dx *= -ball.bounce;

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

canvas.addEventListener('mousemove', function (event) {
  if (ball.isDragging) {
    // Get mouse coordinates
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;
    ball.previousX = ball.x;
    ball.previousY = ball.y;


    // Get bounding boxes for letters
    const letterBoxes = getLetterBoundingBoxes(nameText, textX, textY);

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

canvas.addEventListener('mouseup', () => {
  ball.isDragging = false;
});

// Animation loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawName();
  updateBall();
  drawBall();
  requestAnimationFrame(animate);
}

animate();

function resizeCanvas() {
  //   Update canvas dimensions
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  textX = (canvas.width - textWidth) / 2;
  textY = canvas.height / 2;

  //   Redraw the static elements after resizing
  drawName();
}

// Listen for the resize event
window.addEventListener('resize', resizeCanvas);

// Call resizeCanvas on load to set the initial size
resizeCanvas();

canvas.addEventListener('mouseleave', function () {
  ball.isDragging = false; // Stop dragging when the mouse leaves the canvas
});