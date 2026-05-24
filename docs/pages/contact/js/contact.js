import { functions } from '/assets/js/firebase-init.js';
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";

const submitContactForm = httpsCallable(functions, 'submitContactForm');

const form = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const successMsg = document.getElementById('success-message');
const errorMsg = document.getElementById('error-message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  errorMsg.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();

  try {
    await submitContactForm({ name, email, subject, message });
    form.style.display = 'none';
    successMsg.style.display = 'block';
  } catch (err) {
    errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
    errorMsg.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
});
