const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitButton = form.querySelector('button[type="submit"]');

// Maintain conversation history to send multi-turn context to Gemini
const conversation = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Display user message in chat box
  appendMessage('user', userMessage);
  input.value = '';

  // 2. Add user message to conversation history
  conversation.push({ role: 'user', text: userMessage });

  // 3. Display temporary "Thinking..." message
  const thinkingMessage = appendMessage('bot', 'Thinking...');

  // Disable form controls while waiting for response
  input.disabled = true;
  if (submitButton) submitButton.disabled = true;

  try {
    // 4. Send conversation payload to /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 5. Replace "Thinking..." with AI reply or fallback message
    if (data && data.result) {
      thinkingMessage.textContent = data.result;
      conversation.push({ role: 'model', text: data.result });
    } else {
      thinkingMessage.textContent = 'Sorry, no response received.';
      conversation.pop(); // Revert user message from history on invalid response
    }
  } catch (error) {
    console.error('Chat error:', error);
    thinkingMessage.textContent = 'Failed to get response from server.';
    conversation.pop(); // Revert user message from history on request failure
  } finally {
    // Re-enable form controls and scroll chat to bottom
    input.disabled = false;
    if (submitButton) submitButton.disabled = false;
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

/**
 * Appends a chat bubble to the chat box.
 * @param {'user' | 'bot'} sender - The sender type.
 * @param {string} text - Message content.
 * @returns {HTMLDivElement} The created message element.
 */
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  msg.style.clear = 'both';
  msg.style.whiteSpace = 'pre-wrap';

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
