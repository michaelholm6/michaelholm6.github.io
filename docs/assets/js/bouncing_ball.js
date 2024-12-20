// Canvas setup
const canvas = document.getElementById('bannerCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * .9;
canvas.height = canvas.offsetHeight;
let letterBoxes = [];
let gamma = 0;
let referenceGamma = 0; 
let beta = 0;
let fingerDownDragging = false;
let mirror = false;
let screen_orientation = 'portrait-primary';
let orientation_supported = false;

window.onload = () => {
  setTimeout(() => {
    localStorage.removeItem('orientationPermission');
    document.cookie = "orientationPermission=; max-age=0";
    supportsOrientation().then((isGranted) => {
      if (isGranted) {
        // Proceed with device orientation event listeners
        orientation_supported = true;
        screen.orientation.addEventListener("change", (event) => {
          screen_orientation = event.target.type;
        });
        window.addEventListener('deviceorientation', function(event) {
          // Get the gamma value (side-to-side tilt)
        // Side-to-side tilt (-90 to 90)
        if (((gamma > 45 && event.gamma < -45) || (gamma < -45 && event.gamma > 45)) && !mirror) {
          mirror = true;
        }
        else if (((gamma < -45 && event.gamma < -45) || (gamma > 45 && event.gamma > 45)) && mirror) {
          mirror = false;
        }
        if (mirror) {
          gamma = -event.gamma ;
        } else {
          gamma = event.gamma;
        }
        beta = event.beta;
        }
        );
      } else {
        console.log("Permission to access device orientation was denied.");
      }
})}, 500); // Wait for 1 second before checking
};

// Ball properties
const ball = {
  x: canvas.width / 2,
  y: 50,
  radius: 20,
  color: '#FF5733',
  dx: 0,
  dy: 0,
  gravity: 0.5,
  bounce: 0.8,
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

function resizeCanvas() {
  // Set the canvas size to the window's width
  canvas.width = window.innerWidth * 0.9; // 90% of the window width
  canvas.height = canvas.offsetHeight; // You can adjust the height based on your needs

  drawName();
}

function getTextAsecentandDescent(text, font) {
  // Create a temporary canvas context
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  context.font = font; // Set the desired font
  context.textBaseline = 'middle'
  var metrics = context.measureText(text);
  return [metrics.actualBoundingBoxAscent, metrics.actualBoundingBoxDescent]; // More accurate height
}

// function getLetterBoundingBoxes(text, maxWidth) {
//   const letterBoxes = [];
//   ctx.font = '60px Arial'; // Ensure the font is set correctly
//   ctx.textAlign = 'center'; // Center the text
//   const lineHeight = 60; // Adjust line height if needed (typically same as font size)
//   let currentX = 0; // Start position for each letter
//   let currentY = 0; // Start vertical position
//   let line = ''; // Track the current line of text

//   const words = text.split(' '); // Split text into words

//   words.forEach((word, wordIndex) => {
//       // Check if adding this word would exceed the max width
//       const testLine = line + word + (wordIndex < words.length - 1 ? ' ' : ''); // Add a space for spacing except for the last word
//       const testWidth = ctx.measureText(testLine).width;

//       if (testWidth > maxWidth && line) {
//           // If the line is full, draw the current line and reset currentX
//           // Draw the line of text
//           for (let i = 0; i < line.length; i++) {
//               const letter = line[i];
//               const letterWidth = ctx.measureText(letter).width;
//               const [ascent, descent] = getTextAsecentandDescent(letter, '60px Arial'); // Get ascent and descent

//               // Create a bounding box for the letter
//               letterBoxes.push({
//                   x: currentX,
//                   width: letterWidth,
//                   top: currentY - ascent,
//                   bottom: currentY + descent,
//               });

//               // Move currentX to the right for the next letter
//               currentX += letterWidth;
//           }

//           // Move to the next line
//           currentY += lineHeight; // Move down for the next line
//           currentX = canvas.width/2 - ctx.measureText(line).width/2;; // Reset X to start position
//           line = word + ' '; // Start a new line with the current word
//       } else {
//           line = testLine; // Otherwise, continue building the line
//       }
//   });

//   //Handle the last line of text
//   if (line) {
//       for (let i = 0; i < line.length; i++) {
//           const letter = line[i];
//           const letterWidth = ctx.measureText(letter).width;
//           const [ascent, descent] = getTextAsecentandDescent(letter, '60px Arial');

//           // Create a bounding box for the letter
//           letterBoxes.push({
//               x: currentX,
//               width: letterWidth,
//               top: currentY - ascent,
//               bottom: currentY + descent,
//           });

//           // Move currentX to the right for the next letter
//           currentX += letterWidth;
//       }
//   }

//   return letterBoxes; // Return the array of letter bounding boxes
// }



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
  const words = nameText.split(' ');
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
    let gravityX = 0;
    let gravityY = 0;

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
    // if (screen_angle == 0 || screen_angle == 180) {
    //   if (screen_angle == 0) {
    //     gravityX = Math.sin((gamma) * Math.PI / 180); // Gravity effect on X-axis based on gamma
    //     gravityY = Math.sin(beta * Math.PI / 180); // Gravity effect on Y-axis based on beta
    //   } else if (screen_angle == 180) {
    //     gravityX = -Math.sin((gamma) * Math.PI / 180); // Gravity effect on X-axis based on gamma
    //     gravityY = -Math.sin(beta * Math.PI / 180); // Gravity effect on Y-axis based on beta
    //   }
    // } else if (screen_angle == 90 || screen_angle == 270) {
    //   if (screen_angle == 90) {
    //     gravityX = Math.sin((beta) * Math.PI / 180); // Gravity effect on X-axis based on gamma
    //     gravityY = -Math.sin(gamma * Math.PI / 180); // Gravity effect on Y-axis based on beta
    //   }
    //   else if (screen_angle == 270) {
    //     gravityX = -Math.sin((beta) * Math.PI / 180); // Gravity effect on X-axis based on gamma
    //     gravityY = Math.sin(gamma * Math.PI / 180); // Gravity effect on Y-axis based on beta
    //   }
    // }

    if (!orientation_supported) {
      gravityX = 0;
      gravityY = 1;
    }

    ball.dx += gravityX * ball.gravity;
    ball.dy += gravityY * ball.gravity;

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

// canvas.addEventListener('touchstart', function (event) {
//   // Prevent the default action (like scrolling)
//   const touch = event.touches[0]; // Get the first touch point
//   const touchX = touch.clientX - canvas.offsetLeft;
//   const touchY = touch.clientY - canvas.offsetTop;
  
//   // Check if the touch is inside the ball
//   if (touchX >= ball.x - ball.radius && touchX <= ball.x + ball.radius &&
//       touchY >= ball.y - ball.radius && touchY <= ball.y + ball.radius) {
//         event.preventDefault();
//     fingerDownDragging = true;
//     ball.previousX = ball.x;
//     ball.previousY = ball.y;
//     ball.isDragging = true; // Start dragging
//   }
// });

canvas.addEventListener('mousemove', function (event) {
  if (fingerDownDragging){
    event.preventDefault();
  }
  if (ball.isDragging) {
    // Get mouse coordinates
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;
    ball.previousX = ball.x;
    ball.previousY = ball.y;


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

// canvas.addEventListener('touchmove', function (event) {
//   if (fingerDownDragging) {
//     event.preventDefault();
//   }
//   if (ball.isDragging) { // Prevent default touch actions like scrolling

//     // Get the first touch point
//     const touch = event.touches[0]; // Use the first touch point
//     const touchX = touch.clientX - canvas.offsetLeft;
//     const touchY = touch.clientY - canvas.offsetTop;

//     // Save previous position for collision check
//     ball.previousX = ball.x;
//     ball.previousY = ball.y;

//     // Check for collision with text (assuming you have the same function)
//     const isColliding = isClippingThroughLetters(ball, touchX, touchY, ball.radius, letterBoxes);

//     if (!isColliding) {
//       // Only update position if there is no collision
//       ball.x = touchX;
//       ball.y = touchY;
//     }

//     if (isColliding) {
//       ball.x = ball.previousX;
//       ball.y = ball.previousY;
//     }

//     // Stop dragging if the touch is outside the ball
//     if (
//       touchX < ball.x - ball.radius ||
//       touchX > ball.x + ball.radius ||
//       touchY < ball.y - ball.radius ||
//       touchY > ball.y + ball.radius
//     ) {
//       ball.isDragging = false; // Stop dragging if the touch is outside the ball
//     }
//   }
// });

canvas.addEventListener('mouseup', () => {
  ball.isDragging = false;
});

canvas.addEventListener('touchend', () => {
  ball.isDragging = false;
  fingerDownDragging = false;
});

// Animation loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //const letterBoxes = getLetterBoundingBoxes(nameText, canvas.width - 20);
  //colorLetterBoxes(letterBoxes);
  drawName();
  updateBall();
  drawBall();
  requestAnimationFrame(animate);
}

setTimeout(animate(), 250);

function resizeCanvas() {
  //   Update canvas dimensions
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  textX = (canvas.width - textWidth) / 2;
  textY = canvas.height / 2;

  //   Redraw the static elements after resizing
  drawName();
}

// Resize the canvas initially and when the window is resized
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Listen for the resize event
window.addEventListener('resize', resizeCanvas);

// Call resizeCanvas on load to set the initial size
resizeCanvas();

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
              document.removeEventListener('touchstart', interactionListener);
              document.removeEventListener('touchmove', interactionListener);
            })
            .catch(reject);
        };

        // Listen for user interaction
        document.addEventListener('click', interactionListener);
        document.addEventListener('touchstart', interactionListener);
        document.addEventListener('touchmove', interactionListener);
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