const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitButton = document.getElementById('send-button');
const welcomeGreeting = document.getElementById('welcome-greeting');

// Multi-turn conversation history
const conversation = [];

// Quick suggestion chips handler
document.querySelectorAll('.chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const promptText = btn.getAttribute('data-prompt') || btn.textContent.trim();
    input.value = promptText;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Sembunyikan welcome card saat pesan pertama dikirim
  if (welcomeGreeting) {
    welcomeGreeting.style.display = 'none';
  }

  // 1. Tampilkan pesan user di chat box & reset input
  appendMessage('user', userMessage);
  input.value = '';

  // 2. Simpan pesan user ke conversation history
  conversation.push({ role: 'user', text: userMessage });

  // 3. Tampilkan pesan temporary "Thinking..." dengan animasi loading
  const thinkingMessage = appendMessage('bot', 'Celeste sedang mengetik...');
  thinkingMessage.classList.add('thinking');

  // Disable kontrol selama proses berlangsung
  input.disabled = true;
  if (submitButton) submitButton.disabled = true;

  try {
    // 4. Kirim request POST ke backend /api/chat
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

    // 5. Ganti pesan "Thinking..." dengan balasan AI
    thinkingMessage.classList.remove('thinking');

    if (data && data.result) {
      thinkingMessage.textContent = data.result;
      conversation.push({ role: 'model', text: data.result });
    } else {
      thinkingMessage.textContent = 'Maaf, tidak ada respon yang diterima.';
      conversation.pop(); // Batalkan pesan user terakhir jika respon gagal
    }
  } catch (error) {
    console.error('Chat error:', error);
    thinkingMessage.classList.remove('thinking');
    thinkingMessage.textContent = 'Gagal terhubung ke server. Silakan coba lagi.';
    conversation.pop(); // Batalkan pesan user terakhir dari context
  } finally {
    // Aktifkan kembali kontrol input
    input.disabled = false;
    if (submitButton) submitButton.disabled = false;
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

/**
 * Menambahkan bubble pesan ke dalam chat box
 * @param {'user' | 'bot'} sender
 * @param {string} text
 * @returns {HTMLDivElement}
 */
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
