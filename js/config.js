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
  GAS_URL: '',

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

  // Koordinat Default (DKI Jakarta) & Ka'bah
  COORDINATES: {
    LATITUDE: -6.1754,
    LONGITUDE: 106.8272,
    QIBLA_BEARING: 295.2, // Derajat Barat Laut
    KABAH_DISTANCE_KM: 7912
  },

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
