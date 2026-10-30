/**
 * =========================================================================
 * NURUL IBADAH — KONFIGURASI FRONTEND (js/config.js)
 * =========================================================================
 * Sesuai prinsip gas-rahasia-script-properties & gas-pro-api:
 * File ini HANYA memuat URL publik Web App GAS dan preferensi default pengguna.
 * Tidak ada token, API key, atau rahasia sensitif yang ditaruh di sini!
 * =========================================================================
 */

const CONFIG = {
  // Masukkan URL Google Apps Script Web App Anda setelah deploy:
  // Contoh: 'https://script.google.com/macros/s/AKfycbwjS0iEmLt-SbMPKSwMB80FgGoyavVPYI9VyRi7PNt-EwtFItMp-XysBsmhWuc5T0_bsA/exec'
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwjS0iEmLt-SbMPKSwMB80FgGoyavVPYI9VyRi7PNt-EwtFItMp-XysBsmhWuc5T0_bsA/exec',

  // Identitas Pengguna Default
  USER: {
    ID: 'USR-88219',
    NAME: 'Fulan bin Fulan',
    TITLE: 'Penuntut Ilmu',
    CITY: 'Jakarta',
    ZONE: 'WIB',
    METHOD: 'Kemenag RI',
    TARGET_TILAWAH_PAGES: 10,
    TARGET_TAHAJUD_DAYS: 3
  },

  // Koordinat Default Ka'bah di Makkah Al-Mukarramah
  KABAH: {
    LATITUDE: 21.422487,
    LONGITUDE: 39.826206
  },

  // Database Kota-Kota Seluruh Indonesia (Lintang, Bujur, Zona Waktu)
  INDONESIAN_CITIES: [
    // --- WIB (UTC+7) ---
    { id: 'jakarta', name: 'Jakarta', province: 'DKI Jakarta', lat: -6.2088, lng: 106.8456, tz: 7, zone: 'WIB' },
    { id: 'bandung', name: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lng: 107.6191, tz: 7, zone: 'WIB' },
    { id: 'surabaya', name: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lng: 112.7521, tz: 7, zone: 'WIB' },
    { id: 'semarang', name: 'Semarang', province: 'Jawa Tengah', lat: -6.9667, lng: 110.4167, tz: 7, zone: 'WIB' },
    { id: 'yogyakarta', name: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.7956, lng: 110.3695, tz: 7, zone: 'WIB' },
    { id: 'surakarta', name: 'Surakarta (Solo)', province: 'Jawa Tengah', lat: -7.5755, lng: 110.8243, tz: 7, zone: 'WIB' },
    { id: 'malang', name: 'Malang', province: 'Jawa Timur', lat: -7.9797, lng: 112.6304, tz: 7, zone: 'WIB' },
    { id: 'bogor', name: 'Bogor', province: 'Jawa Barat', lat: -6.5971, lng: 106.8060, tz: 7, zone: 'WIB' },
    { id: 'bekasi', name: 'Bekasi', province: 'Jawa Barat', lat: -6.2383, lng: 106.9756, tz: 7, zone: 'WIB' },
    { id: 'tangerang', name: 'Tangerang', province: 'Banten', lat: -6.1783, lng: 106.6319, tz: 7, zone: 'WIB' },
    { id: 'serang', name: 'Serang', province: 'Banten', lat: -6.1104, lng: 106.1640, tz: 7, zone: 'WIB' },
    { id: 'cirebon', name: 'Cirebon', province: 'Jawa Barat', lat: -6.7320, lng: 108.5523, tz: 7, zone: 'WIB' },
    { id: 'medan', name: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lng: 98.6722, tz: 7, zone: 'WIB' },
    { id: 'aceh', name: 'Banda Aceh', province: 'Aceh', lat: 5.5483, lng: 95.3238, tz: 7, zone: 'WIB' },
    { id: 'padang', name: 'Padang', province: 'Sumatera Barat', lat: -0.9471, lng: 100.4172, tz: 7, zone: 'WIB' },
    { id: 'pekanbaru', name: 'Pekanbaru', province: 'Riau', lat: 0.5071, lng: 101.4478, tz: 7, zone: 'WIB' },
    { id: 'batam', name: 'Batam', province: 'Kepulauan Riau', lat: 1.1301, lng: 104.0529, tz: 7, zone: 'WIB' },
    { id: 'palembang', name: 'Palembang', province: 'Sumatera Selatan', lat: -2.9761, lng: 104.7754, tz: 7, zone: 'WIB' },
    { id: 'lampung', name: 'Bandar Lampung', province: 'Lampung', lat: -5.3971, lng: 105.2668, tz: 7, zone: 'WIB' },
    { id: 'jambi', name: 'Jambi', province: 'Jambi', lat: -1.6101, lng: 103.6131, tz: 7, zone: 'WIB' },
    { id: 'bengkulu', name: 'Bengkulu', province: 'Bengkulu', lat: -3.8004, lng: 102.2655, tz: 7, zone: 'WIB' },
    { id: 'pontianak', name: 'Pontianak', province: 'Kalimantan Barat', lat: -0.0263, lng: 109.3425, tz: 7, zone: 'WIB' },
    { id: 'palangkaraya', name: 'Palangka Raya', province: 'Kalimantan Tengah', lat: -2.2161, lng: 113.9139, tz: 7, zone: 'WIB' },

    // --- WITA (UTC+8) ---
    { id: 'denpasar', name: 'Denpasar', province: 'Bali', lat: -8.6705, lng: 115.2126, tz: 8, zone: 'WITA' },
    { id: 'mataram', name: 'Mataram (Lombok)', province: 'Nusa Tenggara Barat', lat: -8.5833, lng: 116.1167, tz: 8, zone: 'WITA' },
    { id: 'kupang', name: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.1772, lng: 123.6070, tz: 8, zone: 'WITA' },
    { id: 'banjarmasin', name: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.3167, lng: 114.5900, tz: 8, zone: 'WITA' },
    { id: 'balikpapan', name: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.2379, lng: 116.8529, tz: 8, zone: 'WITA' },
    { id: 'samarinda', name: 'Samarinda', province: 'Kalimantan Timur', lat: -0.5022, lng: 117.1536, tz: 8, zone: 'WITA' },
    { id: 'makassar', name: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4327, tz: 8, zone: 'WITA' },
    { id: 'manado', name: 'Manado', province: 'Sulawesi Utara', lat: 1.4748, lng: 124.8428, tz: 8, zone: 'WITA' },
    { id: 'palu', name: 'Palu', province: 'Sulawesi Tengah', lat: -0.9003, lng: 119.8779, tz: 8, zone: 'WITA' },
    { id: 'kendari', name: 'Kendari', province: 'Sulawesi Tenggara', lat: -3.9985, lng: 122.5126, tz: 8, zone: 'WITA' },
    { id: 'gorontalo', name: 'Gorontalo', province: 'Gorontalo', lat: 0.5435, lng: 123.0568, tz: 8, zone: 'WITA' },

    // --- WIT (UTC+9) ---
    { id: 'ambon', name: 'Ambon', province: 'Maluku', lat: -3.6553, lng: 128.1909, tz: 9, zone: 'WIT' },
    { id: 'ternate', name: 'Ternate', province: 'Maluku Utara', lat: 0.7900, lng: 127.3800, tz: 9, zone: 'WIT' },
    { id: 'jayapura', name: 'Jayapura', province: 'Papua', lat: -2.5916, lng: 140.6690, tz: 9, zone: 'WIT' },
    { id: 'sorong', name: 'Sorong', province: 'Papua Barat Daya', lat: -0.8762, lng: 131.2558, tz: 9, zone: 'WIT' },
    { id: 'merauke', name: 'Merauke', province: 'Papua Selatan', lat: -8.4991, lng: 140.4018, tz: 9, zone: 'WIT' }
  ],

  // Hadis & Pengingat Cadangan (Bekerja 100% Offline)
  FALLBACK_HADITHS: [
    {
      Teks_Arab: 'أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
      Terjemahan: 'Amalan yang paling dicintai oleh Allah adalah amalan yang kontinu (istiqomah) walaupun sedikit.',
      Perawi_Sumber: 'HR. Bukhari no. 6464 & Muslim no. 782'
    },
    {
      Teks_Arab: 'مَنْ صَلَّى الْبَرْدَيْنِ دَخَلَ الْجَنَّةَ',
      Terjemahan: 'Barangsiapa yang mengerjakan shalat di dua waktu dingin (Subuh dan Ashar), maka ia akan masuk surga.',
      Perawi_Sumber: 'HR. Bukhari no. 574 & Muslim no. 635'
    },
    {
      Teks_Arab: 'فَإِذَا فَرَغْتَ فَانصَبْ وَإِلَىٰ رَبِّكَ فَارْغَب',
      Terjemahan: 'Maka apabila engkau telah selesai (dari suatu urusan), tetaplah bekerja keras (untuk urusan yang lain), dan hanya kepada Tuhanmulah engkau berharap.',
      Perawi_Sumber: 'QS. Asy-Syarh: 7-8'
    },
    {
      Teks_Arab: 'يُصْبِحُ عَلَى كُلِّ سُلاَمَى مِنْ أَحَدِكُمْ صَدَقَةٌ ... وَيُجْزِئُ مِنْ ذَلِكَ رَكْعَتَانِ يَرْكَعُهُمَا مِنَ الضُّحَى',
      Terjemahan: 'Setiap pagi setiap persendian salah seorang di antara kalian harus disedekahi... Dan semua itu cukup digantikan dengan dua rakaat shalat Dhuha.',
      Perawi_Sumber: 'HR. Muslim no. 720'
    }
  ]
};
