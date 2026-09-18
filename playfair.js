// playfair.js
// Implementasi algoritma Playfair Cipher sesuai aturan pada README:
// - Matrix 5x5, alphabet A-Z tanpa J (J digabung ke I)
// - Padding utama X, fallback Q jika karakter yang butuh filler adalah X
// - Same row -> geser kanan (enkripsi) / kiri (dekripsi)
// - Same column -> geser bawah (enkripsi) / atas (dekripsi)
// - Rectangle -> tukar kolom (sama untuk enkripsi & dekripsi)

const ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // tanpa huruf J

/**
 * Membangun matrix 5x5 dari sebuah key.
 * 1. Uppercase
 * 2. Hapus karakter selain A-Z
 * 3. J -> I
 * 4. Hapus duplikat, pertahankan kemunculan pertama
 * 5. Tambahkan sisa alphabet sampai matrix berisi 25 karakter
 */
function buildMatrix(rawKey) {
  const key = rawKey.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const seen = new Set();
  const letters = [];

  for (const ch of key) {
    if (!seen.has(ch)) {
      seen.add(ch);
      letters.push(ch);
    }
  }
  for (const ch of ALPHABET) {
    if (!seen.has(ch)) {
      seen.add(ch);
      letters.push(ch);
    }
  }

  const matrix = [];
  for (let r = 0; r < 5; r++) {
    matrix.push(letters.slice(r * 5, r * 5 + 5));
  }
  return matrix;
}

/** Mencari posisi {r, c} sebuah huruf pada matrix. */
function findPos(matrix, ch) {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (matrix[r][c] === ch) return { r, c };
    }
  }
  return null;
}

/**
 * Preprocessing teks plaintext/ciphertext:
 * Uppercase, hapus karakter selain A-Z, J -> I.
 */
function preprocessText(raw) {
  return raw.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
}

/**
 * Memecah teks menjadi bigram untuk ENKRIPSI, termasuk penyisipan filler:
 * - Jika dua karakter berurutan sama, sisipkan filler (X, atau Q jika
 *   karakter tersebut sendiri adalah X) di antaranya.
 * - Jika karakter terakhir tidak berpasangan, tambahkan filler yang sama.
 */
function buildBigramsForEncryption(text) {
  const arr = text.split('');
  const pairs = [];
  let i = 0;

  while (i < arr.length) {
    const a = arr[i];

    if (i + 1 >= arr.length) {
      // karakter terakhir sendirian -> tambahkan filler
      const filler = a === 'X' ? 'Q' : 'X';
      pairs.push([a, filler]);
      i += 1;
      continue;
    }

    const b = arr[i + 1];
    if (a === b) {
      // pasangan huruf sama -> sisipkan filler, huruf kedua diproses ulang
      const filler = a === 'X' ? 'Q' : 'X';
      pairs.push([a, filler]);
      i += 1;
    } else {
      pairs.push([a, b]);
      i += 2;
    }
  }

  return pairs;
}

/**
 * Memecah ciphertext menjadi bigram untuk DEKRIPSI.
 * Ciphertext diasumsikan sudah berupa pasangan huruf yang valid (genap).
 * Jika ganjil (input tidak standar), karakter terakhir dilengkapi 'X'.
 */
function chunkBigramsForDecryption(text) {
  const arr = text.split('');
  const pairs = [];
  for (let i = 0; i < arr.length; i += 2) {
    if (i + 1 < arr.length) {
      pairs.push([arr[i], arr[i + 1]]);
    } else {
      pairs.push([arr[i], 'X']);
    }
  }
  return pairs;
}

/**
 * Memproses satu bigram sesuai mode ('enkripsi' | 'dekripsi').
 * Mengembalikan detail lengkap (input, output, tipe aturan, posisi)
 * agar bisa divisualisasikan pada GUI.
 */
function processPair(matrix, a, b, mode) {
  const pa = findPos(matrix, a);
  const pb = findPos(matrix, b);
  let ra, rb, type;

  if (pa.r === pb.r) {
    // Same row
    type = 'row';
    const step = mode === 'enkripsi' ? 1 : -1;
    ra = matrix[pa.r][(pa.c + step + 5) % 5];
    rb = matrix[pb.r][(pb.c + step + 5) % 5];
  } else if (pa.c === pb.c) {
    // Same column
    type = 'col';
    const step = mode === 'enkripsi' ? 1 : -1;
    ra = matrix[(pa.r + step + 5) % 5][pa.c];
    rb = matrix[(pb.r + step + 5) % 5][pb.c];
  } else {
    // Rectangle
    type = 'rect';
    ra = matrix[pa.r][pb.c];
    rb = matrix[pb.r][pa.c];
  }

  return { input: [a, b], output: [ra, rb], type, posA: pa, posB: pb };
}