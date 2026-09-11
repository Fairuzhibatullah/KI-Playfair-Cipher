/**
 * Menghasilkan Playfair Matrix 5x5 berdasarkan key yang diberikan.
 * @param {string} key - Kata kunci / passphrase
 * @returns {Array<Array<string>>} Matrix 5x5
 */
function generateMatrix(key) {
    // Validasi input awal
    if (!key || typeof key !== 'string') {
        throw new Error("Key must contain at least one alphabetic character.");
    }

    // Hanya ambil karakter A-Z (J menjadi I)
    let cleanedKey = key.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');

    // Validasi setelah dibersihkan
    if (cleanedKey.length === 0) {
        throw new Error("Key must contain at least one alphabetic character.");
    }

    const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; 
    const matrixChars = [];
    const usedChars = new Set(); 

    // karakter dari key
    for (let i = 0; i < cleanedKey.length; i++) {
        const char = cleanedKey[i];
        if (!usedChars.has(char)) {
            matrixChars.push(char);
            usedChars.add(char);
        }
    }

    // sisa huruf alfabet yang belum digunakan
    for (let i = 0; i < alphabet.length; i++) {
        const char = alphabet[i];
        if (!usedChars.has(char)) {
            matrixChars.push(char);
            usedChars.add(char);
        }
    }

    // array 25 karakter menjadi matrix 5x5
    const matrix = [];
    let index = 0;
    for (let row = 0; row < 5; row++) {
        const currentRow = [];
        for (let col = 0; col < 5; col++) {
            currentRow.push(matrixChars[index]);
            index++;
        }
        matrix.push(currentRow);
    }

    return matrix;
}

/**
 * Membersihkan teks dan membentuk pasangan huruf (bigram) sesuai aturan Playfair.
 * @param {string} text - Plaintext atau ciphertext
 * @returns {Object} Objek berisi cleanedText dan array bigrams
 */
function preprocessText(text) {
    if (!text || typeof text !== 'string') {
        throw new Error("Text must contain at least one alphabetic character.");
    }

    // Hanya ambil karakter A-Z (J menjadi I)
    let cleanedText = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');

    if (cleanedText.length === 0) {
        throw new Error("Text must contain at least one alphabetic character.");
    }

    const bigrams = [];
    let i = 0;

    // Bentuk bigram secara berurutan
    while (i < cleanedText.length) {
        let char1 = cleanedText[i];
        let char2 = cleanedText[i + 1];

        // karakter terakhir ganjil
        if (char2 === undefined) {
            // X adalah padding utama. 
            // Q sebagai fallback agar tidak ada pasangan XX.
            let filler = (char1 === 'X') ? 'Q' : 'X';
            bigrams.push(char1 + filler);
            break;
        }

        // dua huruf dalam pasangan sama
        if (char1 === char2) {
            let filler = (char1 === 'X') ? 'Q' : 'X';
            bigrams.push(char1 + filler);
            i++; 
        } else {
            bigrams.push(char1 + char2);
            i += 2;
        }
    }

    return {
        cleanedText: cleanedText,
        bigrams: bigrams
    };
}

/**
 * Mencari posisi (baris dan kolom) sebuah karakter di dalam matrix Playfair.
 * @param {Array<Array<string>>} matrix - Matrix 5x5
 * @param {string} char - Karakter yang dicari
 * @returns {Object|null} Objek berisi row dan col, atau null jika tidak ditemukan
 */
function findPosition(matrix, char) {
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            if (matrix[row][col] === char) {
                return { row: row, col: col };
            }
        }
    }
    return null;
}

/**
 * Mengenkripsi teks menggunakan aturan Playfair Cipher.
 * @param {string} text - Plaintext yang akan dienkripsi
 * @param {string} key - Kata kunci / passphrase
 * @returns {Object} Hasil enkripsi beserta detail prosesnya
 */
function encrypt(text, key) {
    // Generate Matrix
    const matrix = generateMatrix(key);

    // Preprocess Text
    const preprocessed = preprocessText(text);
    const bigrams = preprocessed.bigrams;

    const steps = [];
    let ciphertext = "";

    // Enkripsi setiap bigram
    for (let i = 0; i < bigrams.length; i++) {
        let pair = bigrams[i];
        let char1 = pair[0];
        let char2 = pair[1];

        let pos1 = findPosition(matrix, char1);
        let pos2 = findPosition(matrix, char2);

        let resultChar1, resultChar2, rule;

        if (pos1.row === pos2.row) {
            // Rule 1 — Same Row
            rule = "Same Row";
            resultChar1 = matrix[pos1.row][(pos1.col + 1) % 5];
            resultChar2 = matrix[pos2.row][(pos2.col + 1) % 5];
        } else if (pos1.col === pos2.col) {
            // Rule 2 — Same Column
            rule = "Same Column";
            resultChar1 = matrix[(pos1.row + 1) % 5][pos1.col];
            resultChar2 = matrix[(pos2.row + 1) % 5][pos2.col];
        } else {
            // Rule 3 — Rectangle
            rule = "Rectangle";
            resultChar1 = matrix[pos1.row][pos2.col];
            resultChar2 = matrix[pos2.row][pos1.col];
        }

        let result = resultChar1 + resultChar2;
        ciphertext += result;

        // Simpan langkah untuk GUI
        steps.push({
            pair: pair,
            rule: rule,
            result: result
        });
    }

    // Return JSON informasi lengkap
    return {
        ciphertext: ciphertext,
        cleanedText: preprocessed.cleanedText,
        bigrams: bigrams,
        matrix: matrix,
        steps: steps
    };
}

/**
 * Mendekripsi ciphertext menggunakan aturan Playfair Cipher.
 * @param {string} text - Ciphertext yang didekripsi
 * @param {string} key - Kata kunci 
 * @returns {Object} Hasil dekripsi beserta detail prosesnya
 */
function decrypt(text, key) {
    if (!text || typeof text !== 'string') {
        throw new Error("Ciphertext must contain at least one alphabetic character.");
    }

    // Generate Matrix
    const matrix = generateMatrix(key);

    // Normalisasi ciphertext
    let cleanedText = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');

    if (cleanedText.length === 0) {
        throw new Error("Ciphertext must contain at least one alphabetic character after normalization.");
    }

    if (cleanedText.length % 2 !== 0) {
        throw new Error("Ciphertext length must be even.");
    }

    const steps = [];
    let plaintext = "";

    // Dekripsi setiap bigram
    for (let i = 0; i < cleanedText.length; i += 2) {
        let char1 = cleanedText[i];
        let char2 = cleanedText[i + 1];
        let pair = char1 + char2;

        let pos1 = findPosition(matrix, char1);
        let pos2 = findPosition(matrix, char2);

        let resultChar1, resultChar2, rule;

        if (pos1.row === pos2.row) {
            // Rule 1 — Same Row (Geser ke kiri, wrapping jika lewat)
            rule = "Same Row";
            resultChar1 = matrix[pos1.row][(pos1.col - 1 + 5) % 5];
            resultChar2 = matrix[pos2.row][(pos2.col - 1 + 5) % 5];
        } else if (pos1.col === pos2.col) {
            // Rule 2 — Same Column (Geser ke atas, wrapping jika lewat)
            rule = "Same Column";
            resultChar1 = matrix[(pos1.row - 1 + 5) % 5][pos1.col];
            resultChar2 = matrix[(pos2.row - 1 + 5) % 5][pos2.col];
        } else {
            // Rule 3 — Rectangle (Tukar kolom, baris tetap)
            rule = "Rectangle";
            resultChar1 = matrix[pos1.row][pos2.col];
            resultChar2 = matrix[pos2.row][pos1.col];
        }

        let result = resultChar1 + resultChar2;
        plaintext += result;

        // Simpan langkah GUI
        steps.push({
            pair: pair,
            rule: rule,
            result: result
        });
    }

    return {
        plaintext: plaintext,
        ciphertext: cleanedText,
        matrix: matrix,
        steps: steps
    };
}
