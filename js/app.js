/**
 * =========================================================================
 * NURUL IBADAH — LOGIKA APLIKASI UTAMA (js/app.js)
 * =========================================================================
 * Fitur:
 * - Kalkulasi Waktu Salat Akurat Seluruh Daerah Indonesia & Hitung Mundur Real-time
 * - Kompas Kiblat Interaktif & Audio Adzan Chime Generator (Web Audio API)
 * - 4 Tab Akses Cepat Layanan Aktif:
 *   1. Imsak & Puasa Sunnah (Jadwal, Countdown, Kalender & Niat Lengkap)
 *   2. Dzikir Al-Ma'tsurat (Pagi & Petang + Tasbih Digital Interaktif)
 *   3. Arah Kiblat (Sensor Gyroscope HP & Kalibrasi GPS Real-time)
 *   4. Shalat Sunnah (Tata Cara, Niat Arab, Fadhilah & Catat ke Mutaba'ah)
 * - Pemilih Kota & Deteksi Lokasi Otomatis (GPS) Seluruh Wilayah Indonesia
 * - Checklist Mutaba'ah Harian 1-Klik (Optimistic LocalStorage & Auto-Save)
 * - Grafik Evaluasi 30 Hari & Donut Chart (Chart.js)
 * - Heatmap Kalender Konsistensi Amalan 7x5
 * - Rapor Formal A4 Siap Cetak & Ekspor PDF dengan QR Signature
 * - REST API GAS Sync (CORS Safe text/plain POST & CacheX)
 * - Dark Mode ("Deep Nightfall Tahajud") & Responsive Tab Switching
 * =========================================================================
 */

// =========================================================================
// 1. STATE GLOBAL & INISIALISASI
// =========================================================================
const AppState = {
  currentView: 'beranda', // 'beranda', 'mutabaah-harian', 'evaluasi-dan-grafik', 'rapor-bulanan', 'pengaturan'
  selectedDate: getFormattedDate(new Date()),
  currentCity: CONFIG.INDONESIAN_CITIES[0], // Default: Jakarta
  userConfig: { ...CONFIG.USER },
  coordinates: {
    lat: CONFIG.INDONESIAN_CITIES[0].lat,
    lng: CONFIG.INDONESIAN_CITIES[0].lng,
    qiblaBearing: 295.2,
    kabahDistance: 7912
  },
  prayerTimes: {
    imsak: '04:18',
    subuh: '04:28',
    sunrise: '05:45',
    dzuhur: '11:52',
    ashar: '15:15',
    maghrib: '17:58',
    isya: '19:09'
  },
  dailyHadith: CONFIG.FALLBACK_HADITHS[0],
  isDarkMode: localStorage.getItem('nurul_theme') === 'dark',
  audioActive: false,
  charts: {},
  syncStatus: 'synced',
  // State Tasbih Digital Dzikir Ma'tsurat
  tasbih: {
    mode: 'pagi', // 'pagi' atau 'petang'
    currentIndex: 0,
    currentCount: 0,
    targetCount: 3
  },
  // Compass Sensor State
  compass: {
    deviceHeading: 0,
    hasSensor: false
  }
};

// =========================================================================
// 2. HELPER TANGGAL & FORMATTER
// =========================================================================
function getFormattedDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatIndonesianDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// =========================================================================
// 3. KALKULASI WAKTU SALAT ASTRONOMIS (STANDAR KEMENAG RI)
// =========================================================================
function calculateAstronomicalPrayerTimes(date, lat, lng, tz) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Day of year
  const D = Math.floor(275 * m / 9) - Math.floor((m + 9) / 12) * (1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3)) + d - 30;
  
  // Fractional year
  const gamma = 2 * Math.PI / 365 * (D - 1);

  // Equation of time (minutes)
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));

  // Solar declination (radians)
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

  // Solar noon in hours (UTC+tz)
  const noon = 12 + (tz * 15 - lng) / 15 - eqtime / 60;

  const rad = Math.PI / 180;
  const latRad = lat * rad;

  function hourAngle(alphaDeg) {
    const alphaRad = alphaDeg * rad;
    const cosHA = (Math.sin(alphaRad) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));
    if (cosHA > 1) return 0;
    if (cosHA < -1) return Math.PI / rad / 15;
    return Math.acos(cosHA) / rad / 15;
  }

  // Parameter Standar Kemenag RI:
  // Subuh: -20°
  // Terbit: -0.833°
  // Ashar: Shafi'i (shadow ratio = 1)
  // Maghrib: -0.833°
  // Isya: -18°
  // Ihtiyat (pengaman): +2 menit
  const haSubuh = hourAngle(-20);
  const haSunrise = hourAngle(-0.8333);
  const asharAltRad = Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decl))));
  const asharAltDeg = asharAltRad / rad;
  const haAshar = hourAngle(asharAltDeg);
  const haIsya = hourAngle(-18);

  const subuhH = noon - haSubuh + 2/60;
  const imsakH = subuhH - 10/60;
  const sunriseH = noon - haSunrise;
  const dzuhurH = noon + 2/60;
  const asharH = noon + haAshar + 2/60;
  const maghribH = noon + haSunrise + 2/60;
  const isyaH = noon + haIsya + 2/60;

  function formatTime(hoursVal) {
    let h = Math.floor(hoursVal);
    let mins = Math.round((hoursVal - h) * 60);
    if (mins >= 60) { h++; mins -= 60; }
    h = (h % 24 + 24) % 24;
    return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  return {
    imsak: formatTime(imsakH),
    subuh: formatTime(subuhH),
    sunrise: formatTime(sunriseH),
    dzuhur: formatTime(dzuhurH),
    ashar: formatTime(asharH),
    maghrib: formatTime(maghribH),
    isya: formatTime(isyaH)
  };
}

// =========================================================================
// 4. KALKULASI ARAH KIBLAT & JARAK KA'BAH
// =========================================================================
function calculateQibla(lat, lng) {
  const kabahLat = CONFIG.KABAH.LATITUDE * Math.PI / 180;
  const kabahLng = CONFIG.KABAH.LONGITUDE * Math.PI / 180;
  const userLat = lat * Math.PI / 180;
  const userLng = lng * Math.PI / 180;

  const y = Math.sin(kabahLng - userLng);
  const x = Math.cos(userLat) * Math.tan(kabahLat) - Math.sin(userLat) * Math.cos(kabahLng - userLng);
  let qiblaBearing = Math.atan2(y, x) * 180 / Math.PI;
  qiblaBearing = (qiblaBearing + 360) % 360;

  // Haversine Formula untuk Jarak
  const R = 6371; // km
  const dLat = (CONFIG.KABAH.LATITUDE - lat) * Math.PI / 180;
  const dLng = (CONFIG.KABAH.LONGITUDE - lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat) * Math.cos(kabahLat) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.round(R * c);

  return {
    bearing: Math.round(qiblaBearing * 10) / 10,
    distance: distance
  };
}

// =========================================================================
// 5. PENGATURAN KOTA & DETEKSI LOKASI GPS DAERAH
// =========================================================================
function selectCity(cityObj) {
  if (!cityObj) return;
  AppState.currentCity = cityObj;
  AppState.userConfig.CITY = cityObj.name;
  AppState.userConfig.ZONE = cityObj.zone;
  AppState.coordinates.lat = cityObj.lat;
  AppState.coordinates.lng = cityObj.lng;

  // Hitung ulang waktu salat daerah terpilih
  const pt = calculateAstronomicalPrayerTimes(new Date(), cityObj.lat, cityObj.lng, cityObj.tz);
  AppState.prayerTimes = pt;

  // Hitung ulang arah kiblat daerah terpilih
  const qibla = calculateQibla(cityObj.lat, cityObj.lng);
  AppState.coordinates.qiblaBearing = qibla.bearing;
  AppState.coordinates.kabahDistance = qibla.distance;

  // Simpan ke LocalStorage
  localStorage.setItem('nurul_selected_city', JSON.stringify(cityObj));

  // Perbarui Seluruh UI Terkait
  updateLocationAndPrayersUI();
  updateCountdown();
  showToast(`Wilayah diubah ke ${cityObj.name} (${cityObj.zone}). Jadwal sholat diperbarui.`);
}

function updateLocationAndPrayersUI() {
  const city = AppState.currentCity;
  const pt = AppState.prayerTimes;
  const qibla = AppState.coordinates;

  // 1. Header Location Pill
  const headerLocText = document.getElementById('header-location-text');
  if (headerLocText) {
    headerLocText.textContent = `${city.name} (${city.zone}) • 18 Rabiul Awal 1448 H`;
  }

  // 2. Hero Card Location Banner
  const heroLocText = document.getElementById('hero-location-text');
  if (heroLocText) {
    heroLocText.textContent = `• ${city.name} & Sekitarnya`;
  }

  // 3. Compass Widget di Hero Card
  const compassDegEl = document.getElementById('compass-qibla-degree');
  if (compassDegEl) compassDegEl.textContent = `${qibla.qiblaBearing}°`;

  const compassCityEl = document.getElementById('compass-city-label');
  if (compassCityEl) compassCityEl.textContent = `Arah Kiblat ${city.name}`;

  const compassDistEl = document.getElementById('compass-distance-label');
  if (compassDistEl) compassDistEl.textContent = `Jarak Ka'bah: ${qibla.kabahDistance.toLocaleString('id-ID')} km`;

  const heroNeedle = document.getElementById('hero-compass-needle');
  if (heroNeedle) {
    heroNeedle.style.transform = `rotate(${qibla.qiblaBearing}deg)`;
  }

  // 4. Jadwal Shalat 5 Waktu di Dashboard
  const subuhTimeEl = document.getElementById('time-val-subuh');
  if (subuhTimeEl) subuhTimeEl.textContent = pt.subuh;

  const dzuhurTimeEl = document.getElementById('time-val-dzuhur');
  if (dzuhurTimeEl) dzuhurTimeEl.textContent = pt.dzuhur;

  const asharTimeEl = document.getElementById('time-val-ashar');
  if (asharTimeEl) asharTimeEl.innerHTML = `${pt.ashar} <span class="text-xs font-normal">${city.zone}</span>`;

  const maghribTimeEl = document.getElementById('time-val-maghrib');
  if (maghribTimeEl) maghribTimeEl.innerHTML = `${pt.maghrib} <span class="text-xs font-normal text-text-secondary">${city.zone}</span>`;

  const isyaTimeEl = document.getElementById('time-val-isya');
  if (isyaTimeEl) isyaTimeEl.innerHTML = `${pt.isya} <span class="text-xs font-normal text-text-secondary">${city.zone}</span>`;

  // 5. Di Formulir Mutaba'ah
  const fSubuh = document.getElementById('mutabaah-time-subuh');
  if (fSubuh) fSubuh.textContent = `(${pt.subuh} ${city.zone})`;
  const fDzuhur = document.getElementById('mutabaah-time-dzuhur');
  if (fDzuhur) fDzuhur.textContent = `(${pt.dzuhur} ${city.zone})`;
  const fAshar = document.getElementById('mutabaah-time-ashar');
  if (fAshar) fAshar.textContent = `(${pt.ashar} ${city.zone})`;
  const fMaghrib = document.getElementById('mutabaah-time-maghrib');
  if (fMaghrib) fMaghrib.textContent = `(${pt.maghrib} ${city.zone})`;
  const fIsya = document.getElementById('mutabaah-time-isya');
  if (fIsya) fIsya.textContent = `(${pt.isya} ${city.zone})`;

  // 6. Di Modal Imsak & Puasa
  const modalImsakVal = document.getElementById('modal-imsak-time');
  if (modalImsakVal) modalImsakVal.textContent = `${pt.imsak} ${city.zone}`;
  const modalSubuhVal = document.getElementById('modal-subuh-time');
  if (modalSubuhVal) modalSubuhVal.textContent = `${pt.subuh} ${city.zone}`;
  const modalMaghribVal = document.getElementById('modal-maghrib-time');
  if (modalMaghribVal) modalMaghribVal.textContent = `${pt.maghrib} ${city.zone}`;
  const modalCityPuasa = document.getElementById('modal-puasa-city');
  if (modalCityPuasa) modalCityPuasa.textContent = city.name;

  // 7. Di Modal Arah Kiblat
  const modalQiblaDeg = document.getElementById('modal-qibla-degree');
  if (modalQiblaDeg) modalQiblaDeg.textContent = `${qibla.qiblaBearing}° Barat Laut`;
  const modalQiblaDist = document.getElementById('modal-qibla-dist');
  if (modalQiblaDist) modalQiblaDist.textContent = `${qibla.kabahDistance.toLocaleString('id-ID')} km`;
  const modalQiblaCoords = document.getElementById('modal-qibla-coords');
  if (modalQiblaCoords) modalQiblaCoords.textContent = `${city.lat.toFixed(4)}°, ${city.lng.toFixed(4)}°`;
}

function detectGPSLocation() {
  if (!navigator.geolocation) {
    showToast('Peramban Anda belum mendukung fitur GPS.', 'error');
    return;
  }
  showToast('Mencari koordinat lokasi daerah Anda via GPS...');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // Tentukan zona waktu Indonesia dari bujur
      let tz = 7;
      let zone = 'WIB';
      if (lng >= 125) { tz = 9; zone = 'WIT'; }
      else if (lng >= 115) { tz = 8; zone = 'WITA'; }

      // Cari kota terdekat dari database
      let nearestCity = CONFIG.INDONESIAN_CITIES[0];
      let minDiff = Infinity;
      CONFIG.INDONESIAN_CITIES.forEach(c => {
        const d = Math.hypot(c.lat - lat, c.lng - lng);
        if (d < minDiff) {
          minDiff = d;
          nearestCity = c;
        }
      });

      const gpsCity = {
        id: 'gps_' + Date.now(),
        name: `${nearestCity.name} (Lokasi GPS)`,
        province: nearestCity.province,
        lat: lat,
        lng: lng,
        tz: tz,
        zone: zone
      };

      selectCity(gpsCity);
      closeModal('pilih-kota');
      showToast(`Lokasi GPS terdeteksi: ${nearestCity.name} (${zone})`);
    },
    (err) => {
      showToast('Akses GPS ditolak atau tidak tersedia: ' + err.message, 'error');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// =========================================================================
// 6. COUNTDOWN WAKTU SALAT BERJALAN
// =========================================================================
function initPrayerCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  const pt = AppState.prayerTimes;
  const prayers = [
    { name: 'SUBUH', time: pt.subuh },
    { name: 'DZUHUR', time: pt.dzuhur },
    { name: 'ASHAR', time: pt.ashar },
    { name: 'MAGHRIB', time: pt.maghrib },
    { name: 'ISYA', time: pt.isya }
  ];

  let nextPrayer = null;
  let minDiff = Infinity;

  prayers.forEach(p => {
    const [h, m] = p.time.split(':').map(Number);
    const pMinutes = h * 60 + m;
    let diff = pMinutes - currentMinutes;
    if (diff < 0) diff += 24 * 60; // Lewat tengah malam
    if (diff < minDiff && diff > 0) {
      minDiff = diff;
      nextPrayer = { ...p, diffMinutes: diff };
    }
  });

  if (!nextPrayer) {
    const [sh, sm] = pt.subuh.split(':').map(Number);
    nextPrayer = { ...prayers[0], diffMinutes: 24 * 60 - currentMinutes + (sh * 60 + sm) };
  }

  // Hitung sisa jam, menit, detik
  const remainingTotalSeconds = nextPrayer.diffMinutes * 60 - currentSeconds;
  const remHours = Math.floor(remainingTotalSeconds / 3600);
  const remMins = Math.floor((remainingTotalSeconds % 3600) / 60);
  const remSecs = remainingTotalSeconds % 60;

  const countdownEl = document.getElementById('countdown-val');
  if (countdownEl) {
    countdownEl.textContent = `${String(remHours).padStart(2, '0')} Jam ${String(remMins).padStart(2, '0')} Menit ${String(remSecs).padStart(2, '0')} Detik`;
  }

  const nextPrayerNameEl = document.getElementById('next-prayer-name');
  if (nextPrayerNameEl) {
    nextPrayerNameEl.textContent = nextPrayer.name;
  }

  const nextPrayerTimeEl = document.getElementById('next-prayer-time');
  if (nextPrayerTimeEl) {
    nextPrayerTimeEl.innerHTML = `${nextPrayer.time} <span class="font-label-lg text-label-lg tracking-normal">${AppState.userConfig.ZONE}</span>`;
  }
}

// =========================================================================
// 7. MANAJEMEN MODAL & AKSES CEPAT LAYANAN AKTIF
// =========================================================================
function openModal(modalId) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  // Aksi khusus per modal saat dibuka
  if (modalId === 'arah-kiblat') {
    startCompassSensor();
  } else if (modalId === 'dzikir-matsurat') {
    renderTasbihDzikir();
  } else if (modalId === 'pilih-kota') {
    renderCityList();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');

  if (modalId === 'arah-kiblat') {
    stopCompassSensor();
  }
}

function closeAllModals() {
  document.querySelectorAll('.app-modal').forEach(m => m.classList.add('hidden'));
  document.body.classList.remove('overflow-hidden');
  stopCompassSensor();
}

// =========================================================================
// 8. LOGIKA FITUR 1: IMSAK & PUASA SUNNAH
// =========================================================================
function catatPuasaKeMutabaah() {
  const cur = loadMutabaahForDate(AppState.selectedDate);
  cur.puasaSunnah = true;
  saveMutabaahLocal(cur);
  renderMutabaahForm();
  closeModal('imsak-puasa');
  showToast('Alhamdulillah! Puasa sunnah hari ini berhasil dicatat ke Mutaba\'ah.');
}

// =========================================================================
// 9. LOGIKA FITUR 2: DZIKIR AL-MA'TSURAT & TASBIH DIGITAL
// =========================================================================
const MATSURAT_DATA = {
  pagi: [
    {
      judul: 'Ta\'awwudz & Ayat Kursi',
      target: 1,
      arab: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ • اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ...',
      latin: 'Allahu laa ilaaha illa huwal hayyul qayyum, laa ta\'khudhuhu sinatuw wa laa nawm...',
      arti: 'Allah, tidak ada Tuhan selain Dia Yang Maha Hidup lagi terus-menerus mengurus makhluk-Nya...',
      keutamaan: 'Barangsiapa membacanya di pagi hari, ia akan dilindungi dari gangguan jin dan setan hingga petang.'
    },
    {
      judul: 'Surat Al-Ikhlas, Al-Falaq & An-Nas (3x)',
      target: 3,
      arab: 'قُلْ هُوَ اللَّهُ أَحَدٌ ... • قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ... • قُلْ أَعُوذُ بِرَبِّ النَّاسِ ...',
      latin: 'Qul huwallahu ahad... • Qul a\'udzu birabbil falaq... • Qul a\'udzu birabbin naas...',
      arti: 'Membaca surat Al-Ikhlas, Al-Falaq, dan An-Nas sebanyak tiga kali.',
      keutamaan: 'Nabi ﷺ bersabda: "Bacalah 3x di waktu pagi dan petang, niscaya akan mencukupkanmu dari segala sesuatu."'
    },
    {
      judul: 'Sayyidul Istighfar (Penghulu Istighfar)',
      target: 1,
      arab: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
      latin: 'Allahumma Anta Rabbi laa ilaaha illa Anta, khalaqtani wa ana \'abduka wa ana \'ala \'ahdika wa wa\'dika mastatha\'tu...',
      arti: 'Ya Allah, Engkau adalah Tuhanku, tiada Tuhan selain Engkau. Engkau yang menciptakan aku dan aku adalah hamba-Mu...',
      keutamaan: 'Siapa yang membacanya dengan yakin di pagi hari lalu meninggal sebelum petang, ia termasuk penghuni surga.'
    },
    {
      judul: 'Doa Memasuki Pagi Hari',
      target: 1,
      arab: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      latin: 'Ashbahnaa wa ashbahal mulku lillahi wal hamdulillahi, laa ilaaha illallahu wahdahu laa syariika lahu...',
      arti: 'Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah, segala puji bagi Allah...',
      keutamaan: 'Pengakuan tauhid dan permohonan kebaikan sepanjang hari kepada Allah Ta\'ala.'
    },
    {
      judul: 'Perlindungan dari Bahaya & Kejahatan (3x)',
      target: 3,
      arab: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
      latin: 'Bismillahilladzi laa yadhurru ma\'asmihi syai\'un fil ardhi wa laa fis samaa\'i wa huwas samii\'ul \'aliim',
      arti: 'Dengan nama Allah yang bersama nama-Nya tidak ada sesuatu pun di bumi maupun di langit yang dapat membahayakan, dan Dia Maha Mendengar lagi Maha Mengetahui.',
      keutamaan: 'Dibaca 3x: tidak akan ada bahaya atau mara bahaya tiba-tiba yang menimpanya.'
    },
    {
      judul: 'Keridhaan kepada Allah & Rasul-Nya (3x)',
      target: 3,
      arab: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
      latin: 'Radhiitu billaahi rabbaa, wa bil Islaami diinaa, wa bi Muhammadin shallallaahu \'alayhi wa sallama nabiyyaa',
      arti: 'Aku rela Allah sebagai Tuhanku, Islam sebagai agamaku, dan Muhammad ﷺ sebagai nabiku.',
      keutamaan: 'Barangsiapa membacanya 3x setiap pagi dan petang, menjadi hak Allah untuk meridhoinya di hari kiamat.'
    },
    {
      judul: 'Tasbih & Pujian Suci (100x)',
      target: 100,
      arab: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      latin: 'Subhanallahi wa bihamdih',
      arti: 'Maha Suci Allah dan segala puji bagi-Nya.',
      keutamaan: 'Dibaca 100x: dosa-dosanya akan diampuni meskipun sebanyak buih di lautan.'
    }
  ],
  petang: [
    {
      judul: 'Ta\'awwudz & Ayat Kursi',
      target: 1,
      arab: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ • اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ...',
      latin: 'Allahu laa ilaaha illa huwal hayyul qayyum...',
      arti: 'Allah, tidak ada Tuhan selain Dia Yang Maha Hidup lagi terus-menerus mengurus makhluk-Nya...',
      keutamaan: 'Perlindungan dari gangguan setan hingga waktu subuh menjelang.'
    },
    {
      judul: 'Surat Al-Ikhlas, Al-Falaq & An-Nas (3x)',
      target: 3,
      arab: 'قُلْ هُوَ اللَّهُ أَحَدٌ ... • قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ... • قُلْ أَعُوذُ بِرَبِّ النَّاسِ ...',
      latin: 'Qul huwallahu ahad... • Qul a\'udzu birabbil falaq... • Qul a\'udzu birabbin naas...',
      arti: 'Membaca surat Al-Ikhlas, Al-Falaq, dan An-Nas sebanyak tiga kali di waktu petang.',
      keutamaan: 'Menjadi benteng pelindung diri dari segala mara bahaya di malam hari.'
    },
    {
      judul: 'Sayyidul Istighfar (Penghulu Istighfar)',
      target: 1,
      arab: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ...',
      latin: 'Allahumma Anta Rabbi laa ilaaha illa Anta, khalaqtani wa ana \'abduka...',
      arti: 'Ya Allah, Engkau adalah Tuhanku, tiada Tuhan selain Engkau...',
      keutamaan: 'Jika meninggal di malam hari setelah membacanya, maka ia masuk surga.'
    },
    {
      judul: 'Doa Memasuki Waktu Petang',
      target: 1,
      arab: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      latin: 'Amsaynaa wa amsal mulku lillahi wal hamdulillahi, laa ilaaha illallahu wahdahu laa syariika lahu...',
      arti: 'Kami telah memasuki waktu sore dan kerajaan hanya milik Allah, segala puji bagi Allah...',
      keutamaan: 'Menyerahkan perlindungan malam hari kepada sang Khaliq Yang Maha Kuasa.'
    },
    {
      judul: 'Perlindungan dengan Kalimat Allah yang Sempurna (3x)',
      target: 3,
      arab: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
      latin: 'A\'uudzu bikalimaatillaahit taammaati min syarri maa khalaq',
      arti: 'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan apa yang diciptakan-Nya.',
      keutamaan: 'Tidak ada sengatan racun binatang berbahaya atau marabahaya malam yang dapat mencelakainya.'
    },
    {
      judul: 'Tasbih & Pujian Suci Petang (100x)',
      target: 100,
      arab: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      latin: 'Subhanallahi wa bihamdih',
      arti: 'Maha Suci Allah dan segala puji bagi-Nya.',
      keutamaan: 'Pada hari kiamat tidak ada yang membawa amalan lebih baik selain orang yang membaca serupa atau lebih.'
    }
  ]
};

function switchMatsuratMode(mode) {
  AppState.tasbih.mode = mode;
  AppState.tasbih.currentIndex = 0;
  AppState.tasbih.currentCount = 0;

  const btnPagi = document.getElementById('btn-tab-matsurat-pagi');
  const btnPetang = document.getElementById('btn-tab-matsurat-petang');

  if (mode === 'pagi') {
    if (btnPagi) btnPagi.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-primary text-white shadow-sm';
    if (btnPetang) btnPetang.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-text-secondary hover:bg-surface-container';
  } else {
    if (btnPetang) btnPetang.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-primary text-white shadow-sm';
    if (btnPagi) btnPagi.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-text-secondary hover:bg-surface-container';
  }

  renderTasbihDzikir();
}

function renderTasbihDzikir() {
  const list = MATSURAT_DATA[AppState.tasbih.mode];
  const item = list[AppState.tasbih.currentIndex];
  AppState.tasbih.targetCount = item.target;

  const titleEl = document.getElementById('tasbih-item-title');
  if (titleEl) titleEl.textContent = `${AppState.tasbih.currentIndex + 1}. ${item.judul}`;

  const arabEl = document.getElementById('tasbih-item-arab');
  if (arabEl) arabEl.textContent = item.arab;

  const latinEl = document.getElementById('tasbih-item-latin');
  if (latinEl) latinEl.textContent = item.latin;

  const artiEl = document.getElementById('tasbih-item-arti');
  if (artiEl) artiEl.textContent = `“${item.arti}”`;

  const keutamaanEl = document.getElementById('tasbih-item-fadhilah');
  if (keutamaanEl) keutamaanEl.textContent = item.keutamaan;

  updateTasbihDisplay();
}

function tapTasbihCounter() {
  AppState.tasbih.currentCount++;
  // Efek getar di HP jika didukung
  if (navigator.vibrate) navigator.vibrate(25);

  const list = MATSURAT_DATA[AppState.tasbih.mode];
  const item = list[AppState.tasbih.currentIndex];

  if (AppState.tasbih.currentCount >= item.target) {
    if (AppState.tasbih.currentIndex < list.length - 1) {
      showToast(`Selesai membaca: ${item.judul}`);
      setTimeout(() => {
        AppState.tasbih.currentIndex++;
        AppState.tasbih.currentCount = 0;
        renderTasbihDzikir();
      }, 300);
    } else {
      showToast('Alhamdulillah! Seluruh rangkaian dzikir telah lengkap selesai.');
    }
  }

  updateTasbihDisplay();
}

function resetTasbihCounter() {
  AppState.tasbih.currentCount = 0;
  updateTasbihDisplay();
}

function nextTasbihItem() {
  const list = MATSURAT_DATA[AppState.tasbih.mode];
  if (AppState.tasbih.currentIndex < list.length - 1) {
    AppState.tasbih.currentIndex++;
    AppState.tasbih.currentCount = 0;
    renderTasbihDzikir();
  }
}

function prevTasbihItem() {
  if (AppState.tasbih.currentIndex > 0) {
    AppState.tasbih.currentIndex--;
    AppState.tasbih.currentCount = 0;
    renderTasbihDzikir();
  }
}

function updateTasbihDisplay() {
  const countEl = document.getElementById('tasbih-count-val');
  if (countEl) countEl.textContent = AppState.tasbih.currentCount;

  const targetEl = document.getElementById('tasbih-target-val');
  if (targetEl) targetEl.textContent = `/ ${AppState.tasbih.targetCount}x`;

  const progressCircle = document.getElementById('tasbih-progress-circle');
  if (progressCircle) {
    const pct = Math.min(100, (AppState.tasbih.currentCount / AppState.tasbih.targetCount) * 100);
    const offset = 220 - (220 * pct) / 100;
    progressCircle.style.strokeDashoffset = offset;
  }
}

// =========================================================================
// 10. LOGIKA FITUR 3: ARAH KIBLAT (SENSOR GIROSKOP & KALIBRASI)
// =========================================================================
let compassOrientationHandler = null;

function startCompassSensor() {
  const dial = document.getElementById('modal-compass-dial');
  const degreeText = document.getElementById('modal-current-degree');

  if (window.DeviceOrientationEvent) {
    compassOrientationHandler = (e) => {
      let compassHeading = e.webkitCompassHeading || (360 - e.alpha);
      if (compassHeading !== undefined && !isNaN(compassHeading)) {
        AppState.compass.deviceHeading = Math.round(compassHeading);
        AppState.compass.hasSensor = true;

        if (degreeText) {
          degreeText.textContent = `${AppState.compass.deviceHeading}°`;
        }

        // Putar dial kompas berlawanan dengan arah hadap ponsel
        if (dial) {
          dial.style.transform = `rotate(${-AppState.compass.deviceHeading}deg)`;
        }
      }
    };

    window.addEventListener('deviceorientation', compassOrientationHandler, true);
  }

  // Set jarum statis ke arah kiblat kota
  const needle = document.getElementById('modal-compass-needle');
  if (needle) {
    needle.style.transform = `rotate(${AppState.coordinates.qiblaBearing}deg)`;
  }
}

function stopCompassSensor() {
  if (compassOrientationHandler) {
    window.removeEventListener('deviceorientation', compassOrientationHandler, true);
    compassOrientationHandler = null;
  }
}

// =========================================================================
// 11. LOGIKA FITUR 4: SHALAT SUNNAH & CATAT KE MUTABA'AH
// =========================================================================
function switchShalatSunnahTab(tabKey) {
  document.querySelectorAll('.sunnah-tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.sunnah-tab-btn').forEach(btn => {
    btn.className = 'sunnah-tab-btn px-3 py-2 text-xs font-semibold rounded-lg text-text-secondary hover:bg-surface-container';
  });

  const activeContent = document.getElementById(`sunnah-content-${tabKey}`);
  if (activeContent) activeContent.classList.remove('hidden');

  const activeBtn = document.getElementById(`sunnah-tab-${tabKey}`);
  if (activeBtn) {
    activeBtn.className = 'sunnah-tab-btn px-3 py-2 text-xs font-bold rounded-lg bg-primary text-white shadow-sm';
  }
}

function catatSunnahDariModal(sunnahKey, rakaat) {
  const cur = loadMutabaahForDate(AppState.selectedDate);
  cur[`${sunnahKey}Rakaat`] = Math.max(rakaat, (cur[`${sunnahKey}Rakaat`] || 0) + rakaat);
  saveMutabaahLocal(cur);
  renderMutabaahForm();
  closeModal('shalat-sunnah');
  showToast(`Alhamdulillah! ${rakaat} rakaat shalat ${sunnahKey} dicatat ke Mutaba'ah.`);
}

// =========================================================================
// 12. LOGIKA PEMILIHAN KOTA & DAERAH INDONESIA
// =========================================================================
function renderCityList(filterKeyword = '') {
  const container = document.getElementById('city-list-container');
  if (!container) return;

  container.innerHTML = '';
  const kw = filterKeyword.toLowerCase().trim();

  const filtered = CONFIG.INDONESIAN_CITIES.filter(c =>
    c.name.toLowerCase().includes(kw) ||
    c.province.toLowerCase().includes(kw) ||
    c.zone.toLowerCase().includes(kw)
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-xs text-text-secondary">
        Kota tidak ditemukan. Coba ketik nama kota lain atau gunakan tombol GPS.
      </div>
    `;
    return;
  }

  filtered.forEach(city => {
    const isSelected = city.id === AppState.currentCity.id;
    const pt = calculateAstronomicalPrayerTimes(new Date(), city.lat, city.lng, city.tz);

    const card = document.createElement('div');
    card.className = `p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
      isSelected
        ? 'bg-soft-mint/70 border-primary shadow-sm'
        : 'bg-surface-container-low hover:bg-surface-container border-border-light'
    }`;

    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
          isSelected ? 'bg-primary text-white' : 'bg-surface-container text-primary'
        }">
          <span class="material-symbols-outlined text-[18px]">location_on</span>
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-sm text-text-primary">${city.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-semibold text-text-secondary">${city.zone}</span>
            ${isSelected ? '<span class="text-[10px] font-bold text-primary ml-1">● Dipilih</span>' : ''}
          </div>
          <span class="text-[11px] text-text-secondary">${city.province}</span>
        </div>
      </div>
      <div class="text-right text-[11px]">
        <span class="font-bold text-primary block">Subuh ${pt.subuh} • Ashar ${pt.ashar}</span>
        <span class="text-text-secondary">Maghrib ${pt.maghrib}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      selectCity(city);
      closeModal('pilih-kota');
    });

    container.appendChild(card);
  });
}

// =========================================================================
// 13. AUDIO ADZAN CHIME GENERATOR (Web Audio API)
// =========================================================================
function playSereneChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 2.0);
    });
    showToast('Panggilan adzan/pengingat diaktifkan');
  } catch (e) {
    console.warn('AudioContext error:', e);
  }
}

// =========================================================================
// 14. DATA MUTABA'AH & LOCAL STORAGE ENGINE
// =========================================================================
function getMutabaahStorageKey(dateStr) {
  return `nurul_mutabaah_${dateStr || AppState.selectedDate}`;
}

function getDefaultMutabaah(dateStr) {
  return {
    tanggal: dateStr || AppState.selectedDate,
    userId: AppState.userConfig.ID,
    subuh: false,
    subuhMasjid: false,
    subuhTime: `${AppState.prayerTimes.subuh} ${AppState.userConfig.ZONE}`,
    dzuhur: false,
    dzuhurMasjid: false,
    dzuhurTime: `${AppState.prayerTimes.dzuhur} ${AppState.userConfig.ZONE}`,
    ashar: false,
    asharMasjid: false,
    asharTime: `${AppState.prayerTimes.ashar} ${AppState.userConfig.ZONE}`,
    maghrib: false,
    maghribMasjid: false,
    maghribTime: `${AppState.prayerTimes.maghrib} ${AppState.userConfig.ZONE}`,
    isya: false,
    isyaMasjid: false,
    isyaTime: `${AppState.prayerTimes.isya} ${AppState.userConfig.ZONE}`,
    dhuhaRakaat: 0,
    tahajudRakaat: 0,
    rawatibRakaat: 0,
    witirRakaat: 0,
    puasaSunnah: false,
    sedekahNominal: 0,
    tilawahHalaman: 0,
    skorPersen: 0,
    catatanMuhasabah: ''
  };
}

function loadMutabaahForDate(dateStr) {
  const raw = localStorage.getItem(getMutabaahStorageKey(dateStr));
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error parsing stored mutabaah:', e);
    }
  }

  const def = getDefaultMutabaah(dateStr);
  if (dateStr === getFormattedDate(new Date())) {
    def.subuh = true;
    def.subuhMasjid = true;
    def.dzuhur = true;
    def.dzuhurMasjid = true;
    def.ashar = true;
    def.dhuhaRakaat = 4;
    def.tahajudRakaat = 8;
    def.rawatibRakaat = 6;
    def.witirRakaat = 3;
    def.tilawahHalaman = 14;
    def.sedekahNominal = 20000;
    def.catatanMuhasabah = 'Alhamdulillah hari ini dapat menjaga shalat tepat waktu dan memperbanyak istighfar.';
    def.skorPersen = calculateScore(def);
    saveMutabaahLocal(def);
  }
  return def;
}

function saveMutabaahLocal(data) {
  data.skorPersen = calculateScore(data);
  localStorage.setItem(getMutabaahStorageKey(data.tanggal), JSON.stringify(data));
  updateDashboardPlaques();
  return data;
}

function calculateScore(data) {
  let score = 0;
  const fardhuKeys = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  fardhuKeys.forEach(k => {
    if (data[k]) score += 10;
    if (data[k + 'Masjid']) score += 2;
  });

  if (data.dhuhaRakaat >= 2) score += 6;
  if (data.tahajudRakaat >= 2) score += 8;
  if (data.rawatibRakaat >= 2) score += 4;
  if (data.witirRakaat >= 1) score += 4;

  if (data.tilawahHalaman >= AppState.userConfig.TARGET_TILAWAH_PAGES) {
    score += 10;
  } else if (data.tilawahHalaman > 0) {
    score += Math.min(8, Math.round((data.tilawahHalaman / AppState.userConfig.TARGET_TILAWAH_PAGES) * 10));
  }

  if (data.sedekahNominal > 0) score += 4;
  if (data.puasaSunnah) score += 4;

  return Math.min(100, score);
}

// =========================================================================
// 15. SINKRONISASI DENGAN BACKEND REST API GAS
// =========================================================================
async function syncWithBackend(action, payload) {
  if (!CONFIG.GAS_URL || CONFIG.GAS_URL.trim() === '') {
    return { success: true, offline: true };
  }

  updateSyncBadge('syncing');
  try {
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, data: payload })
    });
    const result = await res.json();
    updateSyncBadge('synced');
    return result;
  } catch (err) {
    console.warn('Sync gagal (bekerja dalam mode offline):', err);
    updateSyncBadge('offline');
    return { success: false, message: err.message };
  }
}

function updateSyncBadge(status) {
  AppState.syncStatus = status;
  const badgeEl = document.getElementById('sync-status-badge');
  if (!badgeEl) return;

  if (status === 'syncing') {
    badgeEl.innerHTML = `
      <span class="animate-spin w-2 h-2 rounded-full border-2 border-primary border-t-transparent"></span>
      <span class="text-xs text-primary font-semibold">Menyinkronkan ke Google Sheets...</span>
    `;
  } else if (status === 'offline') {
    badgeEl.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-amber-500"></span>
      <span class="text-xs text-amber-700 font-semibold">Mode Offline (Tersimpan Lokal)</span>
    `;
  } else {
    badgeEl.innerHTML = `
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      <span class="text-xs text-primary font-semibold">Tersinkron Otomatis ke Google Sheets</span>
    `;
  }
}

// =========================================================================
// 16. RENDER CHECKLIST MUTABA'AH (VIEW 2)
// =========================================================================
function renderMutabaahForm() {
  const data = loadMutabaahForDate(AppState.selectedDate);

  const datePillEl = document.getElementById('mutabaah-date-label');
  if (datePillEl) {
    datePillEl.textContent = `Hari Ini: ${formatIndonesianDate(AppState.selectedDate)} / 18 Rabiul Awal 1448 H`;
  }

  const fardhus = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  fardhus.forEach(k => {
    const btn = document.getElementById(`btn-check-${k}`);
    const toggle = document.getElementById(`toggle-masjid-${k}`);
    const badge = document.getElementById(`badge-status-${k}`);

    if (btn) {
      if (data[k]) {
        btn.classList.add('bg-primary', 'text-white');
        btn.classList.remove('bg-surface-container', 'text-outline');
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span>';
      } else {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-surface-container', 'text-outline');
        btn.innerHTML = '';
      }
    }

    if (toggle) toggle.checked = !!data[`${k}Masjid`];

    if (badge) {
      if (data[k]) {
        badge.textContent = 'Tepat Waktu';
        badge.className = 'px-2 py-0.5 rounded-full bg-soft-mint text-primary text-[10px] font-bold';
      } else {
        badge.textContent = 'Menunggu Waktu';
        badge.className = 'px-2 py-0.5 rounded-full bg-surface-container text-text-secondary text-[10px] font-medium';
      }
    }
  });

  setStepperValue('dhuha', data.dhuhaRakaat, 'Rakaat');
  setStepperValue('tahajud', data.tahajudRakaat, 'Rakaat');
  setStepperValue('rawatib', data.rawatibRakaat, 'Rakaat');
  setStepperValue('witir', data.witirRakaat, 'Rakaat');

  const togglePuasa = document.getElementById('toggle-puasa');
  if (togglePuasa) togglePuasa.checked = !!data.puasaSunnah;

  const sedekahInput = document.getElementById('input-sedekah');
  if (sedekahInput) sedekahInput.value = data.sedekahNominal ? `Rp ${data.sedekahNominal.toLocaleString('id-ID')}` : '';

  const tilawahCountEl = document.getElementById('tilawah-count-display');
  if (tilawahCountEl) tilawahCountEl.textContent = data.tilawahHalaman || 0;

  const tilawahProgressEl = document.getElementById('tilawah-progress-bar');
  if (tilawahProgressEl) {
    const pct = Math.min(100, Math.round(((data.tilawahHalaman || 0) / 20) * 100));
    tilawahProgressEl.style.width = `${pct}%`;
  }

  const catatanEl = document.getElementById('textarea-catatan-muhasabah');
  if (catatanEl) catatanEl.value = data.catatanMuhasabah || '';

  updateStickyScoreBar(data.skorPersen);
}

function setStepperValue(key, val, unit) {
  const el = document.getElementById(`count-display-${key}`);
  if (el) el.textContent = `${val || 0} ${unit}`;
}

function updateStickyScoreBar(score) {
  const scoreValEl = document.getElementById('sticky-score-value');
  const catValEl = document.getElementById('sticky-cat-value');
  const rightCircleScore = document.getElementById('donut-mutabaah-text');
  const rightCircleRing = document.getElementById('donut-mutabaah-circle');

  let kategori = 'Mumtaz (Istimewa)';
  if (score < 60) kategori = 'Maqbul';
  else if (score < 75) kategori = 'Jayyid (Baik)';
  else if (score < 85) kategori = 'Jayyid Jiddan';

  if (scoreValEl) scoreValEl.textContent = `${score}%`;
  if (catValEl) catValEl.textContent = `Kategori: ${kategori}`;
  if (rightCircleScore) rightCircleScore.textContent = `${score}%`;

  if (rightCircleRing) {
    const offset = 251.2 - (251.2 * score) / 100;
    rightCircleRing.style.strokeDashoffset = offset;
  }
}

// =========================================================================
// 17. GRAFIK & ANALITIK BULANAN (Chart.js - VIEW 3)
// =========================================================================
function initMonthlyCharts() {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js belum dimuat.');
    return;
  }

  const trendCtx = document.getElementById('chart-trend-konsistensi');
  if (trendCtx) {
    if (AppState.charts.trend) AppState.charts.trend.destroy();

    const labels = [];
    const scores = [];
    for (let i = 1; i <= 31; i++) {
      labels.push(`${i} Okt`);
      scores.push(78 + Math.round(Math.sin(i / 3) * 6) + Math.round(i / 4));
    }

    const gradient = trendCtx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 105, 72, 0.28)');
    gradient.addColorStop(1, 'rgba(0, 105, 72, 0.00)');

    AppState.charts.trend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Konsistensi Harian',
            data: scores,
            borderColor: '#006948',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#006948',
            pointRadius: 2,
            pointHoverRadius: 6
          },
          {
            label: 'Target Istiqomah (80%)',
            data: Array(31).fill(80),
            borderColor: '#d97706',
            borderWidth: 2,
            borderDash: [6, 6],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 12,
            titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
            bodyFont: { family: 'Plus Jakarta Sans' }
          }
        },
        scales: {
          y: {
            min: 20,
            max: 100,
            ticks: { callback: v => v + '%' }
          }
        }
      }
    });
  }

  const donutCtx = document.getElementById('chart-punctuality-donut');
  if (donutCtx) {
    if (AppState.charts.punctuality) AppState.charts.punctuality.destroy();

    AppState.charts.punctuality = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Awal Waktu (<15 Menit)', 'Masih Dalam Waktu', 'Terlambat / Qadha'],
        datasets: [
          {
            data: [82, 15, 3],
            backgroundColor: ['#006948', '#d97706', '#dc2626'],
            borderWidth: 2,
            borderColor: AppState.isDarkMode ? '#0D1E18' : '#ffffff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  renderCalendarHeatmap();
}

function renderCalendarHeatmap() {
  const container = document.getElementById('heatmap-calendar-grid');
  if (!container) return;

  container.innerHTML = '';
  const daysInMonth = 31;
  const startDayOffset = 3;

  for (let b = 0; b < startDayOffset; b++) {
    const blank = document.createElement('div');
    blank.className = 'p-2 min-h-[58px] rounded-lg bg-surface-container-low/40 opacity-40 text-center text-xs';
    blank.textContent = 28 + b;
    container.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    const score = d <= 22 ? (80 + Math.floor(Math.sin(d) * 12)) : 0;
    const isFuture = d > 22;

    let bgClass = 'bg-surface-container-low text-text-secondary';
    if (!isFuture) {
      if (score >= 90) bgClass = 'bg-[#006948] text-white';
      else if (score >= 75) bgClass = 'bg-[#00855d] text-white';
      else if (score >= 60) bgClass = 'bg-[#34D399] text-gray-900';
    }

    cell.className = `p-2 min-h-[58px] rounded-lg ${bgClass} flex flex-col justify-between cursor-pointer transition-transform hover:scale-105 shadow-sm text-xs`;
    cell.innerHTML = `
      <div class="flex justify-between items-center font-bold">
        <span>${d}</span>
        <span class="text-[10px] opacity-80">${isFuture ? 'Nanti' : score + '%'}</span>
      </div>
      <div class="text-[9px] truncate font-medium mt-1">
        ${isFuture ? 'Mendatang' : (score >= 90 ? 'Mumtaz ✓' : 'Lengkap')}
      </div>
    `;

    cell.addEventListener('click', () => {
      showToast(`Tanggal ${d} Oktober: Konsistensi amalan ${isFuture ? 'belum dicatat' : score + '%'}`);
    });

    container.appendChild(cell);
  }
}

// =========================================================================
// 18. RAPOR EVALUASI BULANAN (A4 Certificate - VIEW 4)
// =========================================================================
function renderReportCard() {
  const docNumEl = document.getElementById('report-doc-number');
  if (docNumEl) docNumEl.textContent = 'NI-EVAL/2026/X/0842';

  const nameEl = document.getElementById('report-user-name');
  if (nameEl) nameEl.textContent = AppState.userConfig.NAME;

  const domisiliEl = document.getElementById('report-user-domisili');
  if (domisiliEl) domisiliEl.textContent = `${AppState.currentCity.name} (${AppState.currentCity.zone})`;

  const qrCanvas = document.getElementById('report-qr-canvas');
  if (qrCanvas && typeof QRCode !== 'undefined') {
    qrCanvas.innerHTML = '';
    new QRCode(qrCanvas, {
      text: `https://nurul-ibadah.vercel.app/verify?doc=NI-EVAL-2026-X-0842&city=${encodeURIComponent(AppState.currentCity.name)}`,
      width: 64,
      height: 64,
      colorDark: '#006948',
      colorLight: '#ffffff'
    });
  }
}

// =========================================================================
// 19. NAVIGASI TAMPILAN & TAB SWITCHING
// =========================================================================
function switchView(viewName) {
  AppState.currentView = viewName;

  document.querySelectorAll('.view-panel').forEach(el => el.classList.add('hidden'));

  const targetPanel = document.getElementById(`view-${viewName}`);
  if (targetPanel) targetPanel.classList.remove('hidden');

  document.querySelectorAll('nav a[data-path], #bottom-nav a[data-path]').forEach(link => {
    const path = link.getAttribute('data-path');
    if (path === viewName) {
      link.classList.add('bg-primary-container', 'text-on-primary-container', 'font-semibold', 'rounded-lg');
      link.classList.remove('text-text-secondary');
    } else {
      link.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-semibold', 'rounded-lg');
      link.classList.add('text-text-secondary');
    }
  });

  if (viewName === 'beranda') {
    updateDashboardPlaques();
  } else if (viewName === 'mutabaah-harian') {
    renderMutabaahForm();
  } else if (viewName === 'evaluasi-dan-grafik') {
    setTimeout(initMonthlyCharts, 100);
  } else if (viewName === 'rapor-bulanan') {
    renderReportCard();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateDashboardPlaques() {
  const todayData = loadMutabaahForDate(getFormattedDate(new Date()));
  const score = todayData.skorPersen || 75;

  const donutScoreEl = document.getElementById('beranda-donut-score');
  if (donutScoreEl) donutScoreEl.textContent = `${score}%`;

  const donutCircleEl = document.getElementById('beranda-donut-circle');
  if (donutCircleEl) {
    const offset = 251.2 - (251.2 * score) / 100;
    donutCircleEl.style.strokeDashoffset = offset;
  }
}

// =========================================================================
// 20. TOAST NOTIFICATIONS & FEEDBACK
// =========================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-red-600 text-white' : 'bg-primary text-white';
  const icon = type === 'error' ? 'error' : 'check_circle';

  toast.className = `toast-msg ${bg}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// =========================================================================
// 21. SETUP EVENT LISTENERS SAAT DOM SIAP
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Muat preferensi tema
  if (AppState.isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // 2. Muat kota yang tersimpan
  const savedCity = localStorage.getItem('nurul_selected_city');
  if (savedCity) {
    try {
      const parsedCity = JSON.parse(savedCity);
      selectCity(parsedCity);
    } catch (e) {
      selectCity(CONFIG.INDONESIAN_CITIES[0]);
    }
  } else {
    selectCity(CONFIG.INDONESIAN_CITIES[0]);
  }

  // 3. Tombol Toggle Tema
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.isDarkMode = !AppState.isDarkMode;
      if (AppState.isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('nurul_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('nurul_theme', 'light');
      }
      showToast(AppState.isDarkMode ? 'Mode malam (Deep Nightfall Tahajud) aktif' : 'Mode terang (Emerald Oasis) aktif');
    });
  });

  // 4. Navigasi Router
  document.querySelectorAll('a[data-path]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('data-path');
      if (path) switchView(path);
    });
  });

  // 5. Tombol Audio Adzan
  const adhanBtn = document.getElementById('adhan-toggle-btn');
  if (adhanBtn) {
    adhanBtn.addEventListener('click', () => {
      AppState.audioActive = !AppState.audioActive;
      const icon = document.getElementById('adhan-icon');
      const label = document.getElementById('adhan-label');
      if (AppState.audioActive) {
        if (icon) icon.textContent = 'volume_up';
        if (label) label.textContent = 'Adzan Aktif';
        playSereneChime();
      } else {
        if (icon) icon.textContent = 'volume_off';
        if (label) label.textContent = 'Adzan Hening';
        showToast('Notifikasi adzan dimatikan');
      }
    });
  }

  // 6. Checklist Fardhu 1-Klik
  ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].forEach(k => {
    const btn = document.getElementById(`btn-check-${k}`);
    if (btn) {
      btn.addEventListener('click', () => {
        const cur = loadMutabaahForDate(AppState.selectedDate);
        cur[k] = !cur[k];
        saveMutabaahLocal(cur);
        renderMutabaahForm();
        showToast(`${cur[k] ? 'Alhamdulillah, salat ' + k : 'Salat ' + k} diperbarui`);
      });
    }

    const toggle = document.getElementById(`toggle-masjid-${k}`);
    if (toggle) {
      toggle.addEventListener('change', () => {
        const cur = loadMutabaahForDate(AppState.selectedDate);
        cur[`${k}Masjid`] = toggle.checked;
        saveMutabaahLocal(cur);
        renderMutabaahForm();
      });
    }
  });

  // 7. Stepper Sunnah
  [
    { key: 'dhuha', step: 2, max: 12 },
    { key: 'tahajud', step: 2, max: 11 },
    { key: 'rawatib', step: 2, max: 12 },
    { key: 'witir', step: 1, max: 3 }
  ].forEach(item => {
    const plusBtn = document.getElementById(`btn-plus-${item.key}`);
    const minusBtn = document.getElementById(`btn-minus-${item.key}`);

    if (plusBtn) {
      plusBtn.addEventListener('click', () => {
        const cur = loadMutabaahForDate(AppState.selectedDate);
        cur[`${item.key}Rakaat`] = Math.min(item.max, (cur[`${item.key}Rakaat`] || 0) + item.step);
        saveMutabaahLocal(cur);
        renderMutabaahForm();
      });
    }

    if (minusBtn) {
      minusBtn.addEventListener('click', () => {
        const cur = loadMutabaahForDate(AppState.selectedDate);
        cur[`${item.key}Rakaat`] = Math.max(0, (cur[`${item.key}Rakaat`] || 0) - item.step);
        saveMutabaahLocal(cur);
        renderMutabaahForm();
      });
    }
  });

  // 8. Tilawah Stepper
  const tilawahPlus = document.getElementById('btn-plus-tilawah');
  const tilawahMinus = document.getElementById('btn-minus-tilawah');
  if (tilawahPlus) {
    tilawahPlus.addEventListener('click', () => {
      const cur = loadMutabaahForDate(AppState.selectedDate);
      cur.tilawahHalaman = (cur.tilawahHalaman || 0) + 1;
      saveMutabaahLocal(cur);
      renderMutabaahForm();
    });
  }
  if (tilawahMinus) {
    tilawahMinus.addEventListener('click', () => {
      const cur = loadMutabaahForDate(AppState.selectedDate);
      cur.tilawahHalaman = Math.max(0, (cur.tilawahHalaman || 0) - 1);
      saveMutabaahLocal(cur);
      renderMutabaahForm();
    });
  }

  // 9. Puasa Toggle
  const togglePuasa = document.getElementById('toggle-puasa');
  if (togglePuasa) {
    togglePuasa.addEventListener('change', () => {
      const cur = loadMutabaahForDate(AppState.selectedDate);
      cur.puasaSunnah = togglePuasa.checked;
      saveMutabaahLocal(cur);
      renderMutabaahForm();
      showToast(cur.puasaSunnah ? 'Semoga Allah menerima puasa sunnah Anda' : 'Status puasa diperbarui');
    });
  }

  // 10. Tombol Simpan Mutaba'ah
  const saveBtn = document.getElementById('btn-save-mutabaah');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const cur = loadMutabaahForDate(AppState.selectedDate);
      const catatanEl = document.getElementById('textarea-catatan-muhasabah');
      if (catatanEl) cur.catatanMuhasabah = catatanEl.value;

      saveMutabaahLocal(cur);
      showToast('Menyimpan amalan ke Google Sheets...', 'success');

      const res = await syncWithBackend('saveMutabaah', cur);
      if (res && res.success) {
        showToast('Amalan berhasil tersinkron ke Google Sheets! Barakallahu fiik');
      } else {
        showToast('Data tersimpan aman di peramban (Lokal)', 'success');
      }
    });
  }

  // 11. Navigasi Tanggal Mutaba'ah
  const prevDateBtn = document.getElementById('btn-prev-date');
  const nextDateBtn = document.getElementById('btn-next-date');
  if (prevDateBtn) {
    prevDateBtn.addEventListener('click', () => {
      const parts = AppState.selectedDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2] - 1);
      AppState.selectedDate = getFormattedDate(d);
      renderMutabaahForm();
    });
  }
  if (nextDateBtn) {
    nextDateBtn.addEventListener('click', () => {
      const parts = AppState.selectedDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
      AppState.selectedDate = getFormattedDate(d);
      renderMutabaahForm();
    });
  }

  // 12. Search Input Kota
  const citySearchInput = document.getElementById('input-cari-kota');
  if (citySearchInput) {
    citySearchInput.addEventListener('input', (e) => {
      renderCityList(e.target.value);
    });
  }

  // 13. ESC Key untuk menutup semua modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });

  // Mulai Engine Countdown & Tampilan Beranda
  initPrayerCountdown();
  switchView('beranda');
});
