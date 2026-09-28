# 💸 NeoCash — Pencatat Budget Pengeluaran

**NeoCash** adalah aplikasi manajemen keuangan pribadi berbasis web (*Client-Side App*) yang cepat, responsif, dan terintegrasi langsung secara privat dengan **Google Spreadsheet** Anda. 

Dengan NeoCash, Anda dapat mencatat arus kas (*Pemasukan & Pengeluaran*), mengatur anggaran bulanan (*Budgeting*), memantau target tabungan (*Savings Goals*), serta melihat analitik grafik keuangan secara *real-time* tanpa biaya langganan dan tanpa risiko kebocoran data.

## 🚀 **Coba Aplikasi Langsung:** [NeoCash Web App](https://neocash-flow.vercel.app/)

---

## ✨ Fitur Utama

- **📊 Dashboard Interaktif:** Ringkasan Total Saldo, Pemasukan, Pengeluaran, dan Tabungan secara *real-time*.
- **📝 Transaksi & Arus Kas:** Pencatatan cepat untuk transaksi *Pemasukan*, *Pengeluaran*, maupun *Tabungan* beserta kategori dan sumber akun (*Bank*, *Cash*, *E-Wallet*) yang sudah otomatis tercatat pada database *Spreadsheet pribadi kalian*.
- **💡 Top-Up Tabungan Langsung (+):** Fitur setoran cepat tabungan dari kartu dashboard yang otomatis memotong saldo utama dan mengalokasikannya ke *Savings/Goals*.
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

   <img width="1920" height="828" alt="2" src="https://github.com/user-attachments/assets/926241dc-7422-4869-b212-8e8ad9613089" />

3. Setelah buat salinan , maka akan muncul template sheets seperti ini :

   <img width="1918" height="937" alt="awal" src="https://github.com/user-attachments/assets/db5bf277-73b2-40a8-b74c-629d914d0b5a" />



### Langkah 2: Deploy Google Apps Script
1. Pada spreadsheet salinan milik Anda, klik menu **Extensions** (Ekstensi) > **Apps Script**. :

   <img width="1908" height="654" alt="0" src="https://github.com/user-attachments/assets/621c600f-f357-4549-a0f3-b2eb91d0ff06" />

   <img width="1920" height="549" alt="1" src="https://github.com/user-attachments/assets/ef29ccab-1226-483e-92b9-df798522fed7" />



2. Klik tombol **Terapkan** di pojok kanan atas > pilih **deployment baru**.

   <img width="1920" height="897" alt="3" src="https://github.com/user-attachments/assets/85e59a7d-d174-481c-9e20-850b83a5959a" />

   <img width="1917" height="889" alt="4" src="https://github.com/user-attachments/assets/5adff736-a4ba-400e-8fbe-76a9edd0cd03" />

   

3. Pastikan pengaturan sebagai berikut:

   Buat Konfigurasinya seperti ini :
   - **Pilih Jenis :** Aplikasi Web pada (ikon roda gigi ⚙️)
   - **Jalankan sebagai :** `Saya (email-anda@gmail.com)`
   - **Yang memiliki akses :** `Siapa Saja` *(Penting agar aplikasi dapat mengirim & membaca data)*
     
     <img width="1192" height="871" alt="5" src="https://github.com/user-attachments/assets/f63bf879-21c0-4abb-8df0-158dc8b587c1" />


4. Klik **Terapkan** dan setujui akses (**Izinkan Akses**).

   <img width="1194" height="861" alt="6" src="https://github.com/user-attachments/assets/d941f7a4-30b3-4b69-a32b-4280aea4d31b" />

5. Langkah selanjutnya verified google , pilih show advanced lalu pilih **go to project tak berjudul** :
   
   <img width="1072" height="994" alt="7" src="https://github.com/user-attachments/assets/f801ee8c-4986-4bb0-870f-527a25719799" />

6. Lalu Scroll kebawah dan pilih **Continue** :

   <img width="1018" height="837" alt="8" src="https://github.com/user-attachments/assets/6e8b0aa9-e2ab-4d35-9caf-bfb10bef0f19" />

7. Setelah prosesnya selesai kalian tinggal **Copy Link URL-nya** :

   <img width="1216" height="874" alt="9" src="https://github.com/user-attachments/assets/895986af-2bf4-478e-8378-ae4bb80572e6" />


### Langkah 3: Hubungkan ke Web NeoCash
#### Setelah kita selesai membuat template SpreadSheets nya , kita akan sinkronisasi template sheetsnya dengan Web App dari NeoCash :
1. Buka aplikasi web [NeoCash](https://neocash-flow.vercel.app/).
2. Masuk ke menu **Settings** ⚙️.
3. Tempelkan (*paste*) **Web App URL** yang telah Anda salin sebelumnya ke kolom yang tersedia.
4. Klik **Save Configuration**.
5. Selesai! Seluruh pencatatan Anda sekarang otomatis tersimpan di Google Spreadsheet Anda.

   <img width="1915" height="946" alt="10" src="https://github.com/user-attachments/assets/5fcda833-54f6-49bb-9973-18f7c39e2094" />


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
