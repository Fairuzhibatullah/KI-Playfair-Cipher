# Project Kelompok 1 Keamanan Informasi Playfair-Cipher

# Playfair Cipher

Implementasi Playfair Cipher berbasis **HTML, CSS, dan JavaScript vanilla** untuk tugas mata kuliah **Keamanan Informasi 1**.

Aplikasi ini dirancang untuk melakukan enkripsi dan dekripsi menggunakan algoritma Playfair Cipher dengan matrix 5×5 yang dibentuk secara dinamis berdasarkan key.

## Teknologi

* HTML
* CSS
* JavaScript Vanilla
* File `.txt` untuk input dan output

## Fitur

* Generate matrix Playfair 5×5 berdasarkan key
* Preprocessing plaintext
* Pemecahan plaintext menjadi bigram
* Enkripsi Playfair Cipher
* Dekripsi Playfair Cipher
* Detail langkah enkripsi/dekripsi setiap bigram
* Input plaintext secara manual melalui GUI
* Upload file `.txt`
* Download hasil sebagai file `.txt`
* Visualisasi matrix dan proses bigram pada GUI

## Aturan Playfair Cipher

Project ini menggunakan konfigurasi aturan berikut agar implementasi algoritma, GUI, pengujian, dan dokumentasi tetap konsisten.

| Konfigurasi            | Aturan                                           |
| ---------------------- | ------------------------------------------------ |
| Ukuran Matrix          | 5×5                                              |
| I/J Handling           | I dan J digabung                                 |
| Alphabet               | A-Z tanpa J                                      |
| Matrix Fill            | Row by Row                                       |
| Key Processing         | Uppercase, hanya A-Z, J → I, hapus duplikasi     |
| Text Processing        | Uppercase, hanya A-Z, J → I                      |
| Bigram                 | Sequential dari kiri ke kanan                    |
| Padding                | Selalu X (tidak ada fallback)                    |
| Same Row Encryption    | Geser ke kanan                                   |
| Same Column Encryption | Geser ke bawah                                   |
| Rectangle Encryption   | Tukar kolom                                      |
| Same Row Decryption    | Geser ke kiri                                    |
| Same Column Decryption | Geser ke atas                                    |
| Rectangle Decryption   | Tukar kolom                                      |

### 1. I/J Handling

Huruf `I` dan `J` dianggap sebagai karakter yang sama.

Pada matrix, huruf `J` tidak digunakan dan akan dikonversi menjadi `I`.

Alphabet yang digunakan:

```text
ABCDEFGHIKLMNOPQRSTUVWXYZ
```

### 2. Key Processing

Key diproses dengan urutan:

1. Diubah menjadi uppercase.
2. Karakter selain A-Z dihapus.
3. `J` diubah menjadi `I`.
4. Karakter duplikat dihapus dengan mempertahankan kemunculan pertama.
5. Sisa alphabet ditambahkan sampai matrix berisi 25 karakter.

Contoh:

```text
Key: MONARCHY
```

Menghasilkan matrix:

```text
M O N A R
C H Y B D
E F G I K
L P Q S T
U V W X Z
```

### 3. Text Preprocessing

Plaintext diproses dengan:

1. Uppercase.
2. Karakter selain A-Z dihapus.
3. `J` diubah menjadi `I`.
4. Plaintext kemudian diproses menjadi pasangan karakter atau bigram.

Contoh:

```text
Hello, World!
```

menjadi:

```text
HELLOWORLD
```

### 4. Pembentukan Bigram

Plaintext diproses dari kiri ke kanan.

Jika dua karakter dalam satu pasangan sama, filler disisipkan di antara keduanya.

Filler yang digunakan selalu `X`.

Contoh:

```text
HELLO
```

menjadi:

```text
HE LX LO
```

Karena `LL` merupakan dua karakter yang sama, maka disisipkan `X`.

Jika jumlah karakter terakhir ganjil, filler ditambahkan pada karakter terakhir.

Contoh:

```text
CAT
```

menjadi:

```text
CA TX
```

Jika karakter yang membutuhkan filler adalah `X`, tetap gunakan `X`. Aturan ini memungkinkan terbentuknya pasangan `XX`, yang akan diproses secara valid oleh algoritma (digeser ke kanan).

Contoh:

```text
FOXX
```

diproses menjadi:

```text
FO XX XX
```

### 5. Aturan Enkripsi

Setiap bigram dienkripsi berdasarkan posisi kedua karakter pada matrix.

#### Same Row

Jika kedua karakter berada pada baris yang sama:

```text
Geser masing-masing karakter satu posisi ke kanan.
```

Jika mencapai ujung baris, kembali ke awal baris.

#### Same Column

Jika kedua karakter berada pada kolom yang sama:

```text
Geser masing-masing karakter satu posisi ke bawah.
```

Jika mencapai bagian bawah matrix, kembali ke bagian atas.

#### Rectangle

Jika kedua karakter berada pada baris dan kolom yang berbeda:

```text
Tukar kolom kedua karakter.
```

Baris masing-masing karakter tetap.

### 6. Aturan Dekripsi

Dekripsi menggunakan aturan kebalikan dari enkripsi.

#### Same Row

Geser masing-masing karakter satu posisi ke kiri dengan wrapping.

#### Same Column

Geser masing-masing karakter satu posisi ke atas dengan wrapping.

#### Rectangle

Tukar kolom kedua karakter.

Aturan rectangle sama dengan proses enkripsi.

## Contoh

Dengan key:

```text
MONARCHY
```

matrix:

```text
M O N A R
C H Y B D
E F G I K
L P Q S T
U V W X Z
```

Plaintext:

```text
HELLO
```

Preprocessing:

```text
HE LX LO
```

Enkripsi:

```text
HE → CF
LX → SU
LO → PM
```

Ciphertext:

```text
CFSUPM
```

Dekripsi:

```text
CF → HE
SU → LX
PM → LO
```

Hasil dekripsi:

```text
HELXLO
```

`X` pada hasil tersebut merupakan filler yang ditambahkan ketika preprocessing plaintext.

Pada tahap dekripsi, filler tidak dihapus secara otomatis karena karakter `X` dapat merupakan bagian asli dari plaintext.

## Struktur Project

```text
playfair-cipher/
├── index.html
├── style.css
├── playfair.js
├── app.js
├── README.md
└── .gitignore
```

### File

* `index.html` — Struktur halaman dan GUI.
* `style.css` — Styling dan tampilan GUI.
* `playfair.js` — Implementasi algoritma Playfair Cipher.
* `app.js` — Logika interaksi GUI dengan algoritma.
* `README.md` — Dokumentasi project.
* `.gitignore` — File yang tidak perlu disimpan ke repository.

## Status Pengembangan

* [x] Generate Playfair Matrix
* [x] Text preprocessing
* [x] Bigram generation
* [x] Encryption
* [x] Decryption
* [x] GUI integration
* [x] `.txt` file input
* [x] Bigram visualization
* [x] `.txt` result download
* [x] Validation dan error handling pada GUI
* [ ] Final testing
* [ ] Dokumentasi dan demo
