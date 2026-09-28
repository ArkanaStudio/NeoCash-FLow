# 💸 NeoCash — Smart Personal Finance & Budget Planner

**NeoCash** adalah aplikasi manajemen keuangan pribadi berbasis web (*Client-Side App*) yang cepat, responsif, dan terintegrasi langsung secara privat dengan **Google Spreadsheet** Anda. 

Dengan NeoCash, Anda dapat mencatat arus kas (*income & expense*), mengatur anggaran bulanan (*budgeting*), memantau target tabungan (*savings goals*), serta melihat analitik grafik keuangan secara *real-time* tanpa biaya langganan dan tanpa risiko kebocoran data.

## 🚀 **Coba Aplikasi Langsung:** [NeoCash Web App](https://neocash-flow.vercel.app/)

---

## ✨ Fitur Utama

- **📊 Dashboard Interaktif:** Ringkasan Total Saldo, Pemasukan, Pengeluaran, dan Tabungan secara *real-time*.
- **📝 Transaksi & Arus Kas:** Pencatatan cepat untuk transaksi *Income*, *Expense*, maupun *Transfer/Savings* beserta kategori dan sumber akun (*Bank*, *Cash*, *E-Wallet*).
- **💡 Top-Up Tabungan Langsung (+):** Fitur setoran cepat tabungan dari kartu dashboard yang otomatis memotong saldo utama dan mengalokasikannya ke *Savings Goal*.
- **🎯 Budgeting & Savings Goals:** Pengaturan batas anggaran per kategori dan target tabungan masa depan dengan indikator progres visual.
- **📈 Statistik & Analitik Visual:** Grafik *Cash Flow* dan diagram lingkaran pengeluaran berbasis *Chart.js*.
- **🔒 100% Privat & Aman:** Data tersimpan privat di Google Spreadsheet milik Anda sendiri melalui Google Apps Script Web App.
- **🌗 Dark / Light Mode & Responsive:** Tampilan nyaman diakses baik melalui Smartphone (layar sentuh) maupun Desktop.

---

## 🚀 Panduan Memulai (Cara Penggunaan)

Untuk mulai menggunakan **NeoCash** dan menghubungkannya dengan Google Spreadsheet pribadi Anda, ikuti 3 langkah mudah berikut:

### Langkah 1: Buat Salinan (Copy) Template Spreadsheet
1. Buka [Template Google Spreadsheet NeoCash] : (https://docs.google.com/spreadsheets/d/16sTupGcc96sMVZoPu_62o1NiTpe9D-PaZF21OIcAKHQ/copy?usp=sharing) .
2. Setelah buka link kalian bisa langsung klik buat salinan , maka template spreadsheetsnya nanti langsung otomatis muncul ke google sheets kalian, jika nanti ketika kalian salin apps scriptnya tidak muncul maka kalian bisa klik **tampilkan apps script** lalu copas kodenya dan paste dibagian kode.gs setelah itu klik **CTRL + S** :

   <img width="1920" height="828" alt="2" src="https://github.com/user-attachments/assets/0ab9bff2-55d2-4589-8696-7f62a0385241" />

3. Setelah buat salinan , maka akan muncul template sheets seperti ini :

   <img width="1918" height="937" alt="awal" src="https://github.com/user-attachments/assets/f632e1e3-5b66-42f2-b146-c8ad4fe496d6" />



### Langkah 2: Deploy Google Apps Script
1. Pada spreadsheet salinan milik Anda, klik menu **Extensions** (Ekstensi) > **Apps Script**. :

   <img width="1908" height="654" alt="0" src="https://github.com/user-attachments/assets/5afc4da5-039c-4bbd-87ac-d1958f061e0a" />

   <img width="1920" height="549" alt="1" src="https://github.com/user-attachments/assets/a4ecf8bd-f209-488c-b7f1-ecf838ae515d" />



2. Klik tombol **Terapkan** di pojok kanan atas > pilih **deployment baru**.

   <img width="1920" height="897" alt="3" src="https://github.com/user-attachments/assets/3a4fb206-d0b6-4965-9e14-c9abfa50d47e" />

   <img width="1917" height="889" alt="4" src="https://github.com/user-attachments/assets/6e52da28-b068-4050-b43c-ea9f708a2ed2" />

   

3. Pastikan pengaturan sebagai berikut:

   Buat Konfigurasinya seperti ini :
   - **Pilih Jenis :** Aplikasi Web pada (ikon roda gigi ⚙️)
   - **Jalankan sebagai :** `Saya (email-anda@gmail.com)`
   - **Yang memiliki akses :** `Siapa Saja` *(Penting agar aplikasi dapat mengirim & membaca data)*
     
     <img width="1192" height="871" alt="5" src="https://github.com/user-attachments/assets/18ce3ec5-95b5-4f96-a7b4-209528a03c30" />


4. Klik **Terapkan** dan setujui akses (**Izinkan Akses**).

   <img width="1194" height="861" alt="6" src="https://github.com/user-attachments/assets/21ce6f3f-fcc5-4932-a8a8-4c62e3dd15c0" />

5. Langkah selanjutnya verified google , pilih show advanced lalu pilih **go to project tak berjudul** :
   
   <img width="1072" height="994" alt="7" src="https://github.com/user-attachments/assets/ac96e076-08f6-49d7-88be-5690df137fd5" />

6. Lalu Scroll kebawah dan pilih **Continue** :

   <img width="1018" height="837" alt="8" src="https://github.com/user-attachments/assets/7cf9abfa-6920-4c6a-b894-3654d6403d88" />

7. Setelah prosesnya selesai kalian tinggal **Copy Link URL-nya** :

   <img width="1216" height="874" alt="9" src="https://github.com/user-attachments/assets/54e1d5e2-58c5-4c0e-81eb-e88b75207aa4" />


### Langkah 3: Hubungkan ke Web NeoCash
#### Setelah kita selesai membuat template SpreadSheets nya , kita akan sinkronisasi template sheetsnya dengan Web App dari NeoCash :
1. Buka aplikasi web [NeoCash](https://neocash-flow.vercel.app/).
2. Masuk ke menu **Settings** ⚙️.
3. Tempelkan (*paste*) **Web App URL** yang telah Anda salin sebelumnya ke kolom yang tersedia.
4. Klik **Save Configuration**.
5. Selesai! Seluruh pencatatan Anda sekarang otomatis tersimpan di Google Spreadsheet Anda.

   <img width="1915" height="946" alt="10" src="https://github.com/user-attachments/assets/b37cf3ff-0d55-4854-8922-f66bcbf3ab6b" />


---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox/Grid), Vanilla JavaScript (ES6+)
- **Charts & Icons:** [Chart.js](https://www.chartjs.org/), [Lucide Icons](https://lucide.dev/)
- **Backend & Database:** Google Apps Script (GAS) & Google Sheets API
- **Hosting:** [Vercel](https://vercel.com/)

---

## 🔒 Privasi & Keamanan Data

NeoCash dirancang dengan arsitektur **Zero-Knowledge / Client-Side Direct Fetching**. 
- Tidak ada server perantara yang menyimpan data Anda.
- URL Apps Script dan riwayat transaksi hanya tersimpan di peramban (*localStorage*) perangkat Anda.
- Hanya Anda yang memiliki akses penuh terhadap Google Spreadsheet tempat data disimpan.

---

## 📄 Lisensi

Proyek ini terbuka di bawah lisensi [MIT License](LICENSE). Bebas digunakan, dimodifikasi, dan dikembangkan kembali secara personal.
