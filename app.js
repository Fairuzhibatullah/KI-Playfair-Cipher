// app.js
// Menghubungkan GUI (index.html) dengan algoritma Playfair Cipher di playfair.js

// ---------- State ----------
const state = {
  mode: 'enkripsi',   // 'enkripsi' | 'dekripsi'
  matrix: null,
  steps: [],
  currentStep: -1,
  inputMode: 'paste', // 'paste' | 'upload'
  uploadedFileName: '',
};

// ---------- DOM references ----------
const $ = (id) => document.getElementById(id);

const modeEnkripsi = $('modeEnkripsi');
const modeDekripsi = $('modeDekripsi');
const keyInput = $('keyInput');
const messageInput = $('messageInput');
const tabPaste = $('tabPaste');
const tabUpload = $('tabUpload');
const pasteRow = document.querySelector('.paste-row');
const uploadRow = document.querySelector('.upload-row');
const dropZone = $('dropZone');
const dropLabel = $('dropLabel');
const fileInput = $('fileInput');
const buildBtn = $('buildBtn');
const matrixGrid = $('matrixGrid');
const ruleContent = $('ruleContent');
const prevStep = $('prevStep');
const nextStep = $('nextStep');
const bigramList = $('bigramList');
const resultBox = $('resultBox');
const copyBtn = $('copyBtn');
const downloadBtn = $('downloadBtn');
const toast = $('toast');

const RULE_LABELS = {
  row: 'Baris sama',
  col: 'Kolom sama',
  rect: 'Rectangle',
};

// ---------- Mode: Enkripsi / Dekripsi ----------
modeEnkripsi.addEventListener('click', () => setMode('enkripsi'));
modeDekripsi.addEventListener('click', () => setMode('dekripsi'));

function setMode(mode) {
  state.mode = mode;
  modeEnkripsi.classList.toggle('active', mode === 'enkripsi');
  modeDekripsi.classList.toggle('active', mode === 'dekripsi');
  resetOutput();
}

// ---------- Tab: Tempel teks / Unggah .txt ----------
tabPaste.addEventListener('click', () => switchInputTab('paste'));
tabUpload.addEventListener('click', () => switchInputTab('upload'));

function switchInputTab(tab) {
  state.inputMode = tab;
  tabPaste.classList.toggle('active', tab === 'paste');
  tabUpload.classList.toggle('active', tab === 'upload');
  pasteRow.classList.toggle('hidden', tab !== 'paste');
  uploadRow.classList.toggle('visible', tab === 'upload');
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.uploadedFileName = file.name;
  const reader = new FileReader();
  reader.onload = (ev) => {
    messageInput.value = (ev.target.result || '').replace(/[^a-zA-Z\s]/g, '');
    dropLabel.textContent = 'Berkas dimuat: ' + file.name;
    dropZone.classList.add('has-file');
  };
  reader.readAsText(file);
});

// Filter input agar hanya menerima huruf alfabet (A-Z, a-z) dan spasi
keyInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
});

messageInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
});


// ---------- Proses utama ----------
buildBtn.addEventListener('click', runProcess);

function runProcess() {
  const rawKey = keyInput.value.trim();
  const rawMessage = messageInput.value;

  if (!rawKey) {
    alert('Isi passphrase terlebih dahulu.');
    return;
  }
  const keyCheck = rawKey.toUpperCase().replace(/[^A-Z]/g, '');
  if (!keyCheck) {
    alert('Passphrase harus mengandung minimal satu huruf A-Z.');
    return;
  }

  const cleanMessage = preprocessText(rawMessage);
  if (!cleanMessage) {
    alert('Pesan harus mengandung minimal satu huruf A-Z.');
    return;
  }

  state.matrix = buildMatrix(rawKey);

  try {
    const pairs = state.mode === 'enkripsi'
      ? buildBigramsForEncryption(cleanMessage)
      : chunkBigramsForDecryption(cleanMessage);

    state.steps = pairs.map(([a, b]) => processPair(state.matrix, a, b, state.mode));
    state.currentStep = 0;

    renderMatrix();
    renderBigramList();
    renderStep();
    renderResult();
  } catch (error) {
    alert(error.message);
  }
}

function resetOutput() {
  state.steps = [];
  state.currentStep = -1;
  if (state.matrix) renderMatrix();

  bigramList.innerHTML =
    '<div class="bigram-empty">Belum ada data. Isi kata kunci dan pesan, lalu klik "Bangun matriks &amp; proses".</div>';
  ruleContent.innerHTML =
    '<p class="hint" style="margin-top:6px;">Jalankan proses untuk melihat aturan yang berlaku pada tiap pasangan huruf.</p>';
  prevStep.disabled = true;
  nextStep.disabled = true;
  resultBox.textContent = 'Hasil akan muncul di sini setelah diproses.';
  resultBox.classList.add('placeholder');
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
}

// ---------- Render: Grid matrix ----------
function renderMatrix(highlightStep) {
  matrixGrid.innerHTML = '';
  const step = highlightStep !== undefined ? highlightStep : state.steps[state.currentStep];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const div = document.createElement('div');
      div.className = 'cell';
      div.textContent = state.matrix[r][c];
      if (step) {
        if (step.posA.r === r && step.posA.c === c) div.classList.add('hl-a');
        else if (step.posB.r === r && step.posB.c === c) div.classList.add('hl-b');
      }
      matrixGrid.appendChild(div);
    }
  }
}

// ---------- Render: penjelasan aturan tiap langkah ----------
function ruleDescription(step, mode) {
  if (step.type === 'row') {
    return mode === 'enkripsi'
      ? 'Kedua huruf berada di baris yang sama. Setiap huruf digeser satu posisi ke kanan, kembali ke awal baris jika mencapai ujung.'
      : 'Kedua huruf berada di baris yang sama. Setiap huruf digeser satu posisi ke kiri, kembali ke akhir baris jika mencapai awal.';
  }
  if (step.type === 'col') {
    return mode === 'enkripsi'
      ? 'Kedua huruf berada di kolom yang sama. Setiap huruf digeser satu posisi ke bawah, kembali ke atas jika mencapai dasar matriks.'
      : 'Kedua huruf berada di kolom yang sama. Setiap huruf digeser satu posisi ke atas, kembali ke bawah jika mencapai puncak matriks.';
  }
  return 'Kedua huruf berada di baris dan kolom yang berbeda (rectangle). Baris tetap, kolom kedua huruf ditukar.';
}

function renderStep() {
  if (state.currentStep < 0 || !state.steps.length) {
    ruleContent.innerHTML = '<p class="hint" style="margin-top:6px;">Belum ada langkah untuk ditampilkan.</p>';
    return;
  }

  const step = state.steps[state.currentStep];
  ruleContent.innerHTML = `
    <div class="step-count">Langkah ${state.currentStep + 1} dari ${state.steps.length}</div>
    <span class="rule-tag">${RULE_LABELS[step.type]}</span>
    <div class="pair-display">${step.input.join('')}<span class="arrow">→</span>${step.output.join('')}</div>
    <div class="rule-desc">${ruleDescription(step, state.mode)}</div>
  `;

  renderMatrix(step);
  highlightBigramItem(state.currentStep);
  prevStep.disabled = state.currentStep === 0;
  nextStep.disabled = state.currentStep === state.steps.length - 1;
}

prevStep.addEventListener('click', () => {
  if (state.currentStep > 0) {
    state.currentStep -= 1;
    renderStep();
  }
});
nextStep.addEventListener('click', () => {
  if (state.currentStep < state.steps.length - 1) {
    state.currentStep += 1;
    renderStep();
  }
});

// ---------- Render: daftar bigram ----------
function renderBigramList() {
  bigramList.innerHTML = '';
  state.steps.forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'bigram-item';
    item.dataset.idx = idx;
    item.innerHTML = `<span><span class="idx">${String(idx + 1).padStart(2, '0')}</span>${step.input.join('')}</span><span class="out">${step.output.join('')}</span>`;
    item.addEventListener('click', () => {
      state.currentStep = idx;
      renderStep();
    });
    bigramList.appendChild(item);
  });
}

function highlightBigramItem(idx) {
  document.querySelectorAll('.bigram-item').forEach((el) => {
    el.classList.toggle('selected', Number(el.dataset.idx) === idx);
  });
}

// ---------- Render: hasil akhir ----------
function renderResult() {
  const output = state.steps.map((s) => s.output.join('')).join('');
  resultBox.textContent = output;
  resultBox.classList.remove('placeholder');
  copyBtn.disabled = false;
  downloadBtn.disabled = false;
}

// ---------- Salin & Unduh ----------
copyBtn.addEventListener('click', async () => {
  const text = resultBox.textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  showToast('Disalin ke clipboard');
});

downloadBtn.addEventListener('click', () => {
  const text = resultBox.textContent;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  let fileName;
  if (state.inputMode === 'upload' && state.uploadedFileName) {
    const baseName = state.uploadedFileName.replace(/\.[^/.]+$/, '');
    const suffix = state.mode === 'enkripsi' ? '(encrypted)' : '(decrypted)';
    fileName = `${baseName} ${suffix}.txt`;
  } else {
    fileName = state.mode === 'enkripsi' ? '(encrypted).txt' : '(decrypted).txt';
  }

  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Berkas diunduh');
});

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ---------- Inisialisasi ----------
state.matrix = buildMatrix(keyInput.value);
renderMatrix();