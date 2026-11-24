# Replika Rumah Joglo (Three.js)

Final project Grafika Komputer. Replika 3D sederhana rumah tradisional Joglo
dengan eksterior dan interior, dibuat dari geometri dasar di Three.js.
Lingkup model adalah rumah Joglo dan halamannya di dalam pagar/gapura.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:8000`. Versi online:
https://mitrapartogi13.github.io/fp-grafkom/

Untuk deploy ulang ke GitHub Pages: `npm run deploy`.
 Tambahkan `?view=pendopo` (atau `eksterior`,
`gerbang`, `pringgitan`, `dalem`, `senthong`, `atas`) untuk langsung membuka
sudut tertentu, dan `&night` untuk mode malam.

## Kontrol

| Aksi | Mode Orbit | Mode Jalan |
|---|---|---|
| Melihat | drag kiri (putar; bila dekat = menoleh) | gerakkan mouse |
| Bergerak | WASD / drag kanan (geser) | WASD, Shift = lari |
| Maju/mundur | scroll (zoom; bila dekat = maju/mundur) | - |

Tombol keyboard: `1`-`7` preset kamera, `F` ganti mode, `T` tur otomatis,
`P` buka/tutup pintu, `N` siang/malam, `H` sembunyikan HUD,
`G` tampilkan FPS, `C` simpan screenshot (PNG). Pada mode jalan, klik layar untuk
mengunci mouse dan tekan Esc untuk melepasnya.

Untuk masuk ke rumah pada mode orbit, scroll terus ke arah rumah. Saat kamera
sudah dekat target, scroll berubah menjadi maju/mundur sehingga kamera bisa
masuk ke pendopo atau dalem.

## Struktur kode

| File | Isi |
|---|---|
| `src/textures.js` | tekstur prosedural kayu dan genteng (CanvasTexture), pemetaan UV kayu |
| `src/lib.js` | material, fungsi bantu `box`, `cyl`, `beam`, `ring` |
| `src/joglo.js` | bebatur, umpak, soko guru, soko pengarak, tumpang sari, atap, dinding, pintu, perabot, lampu |
| `src/environment.js` | halaman, jalan batu, pagar, gapura, pohon, semak, bunga, kolam, sumur, batu, rumput |
| `src/camera.js` | OrbitControls, PointerLockControls + tabrakan, preset, tur otomatis |
| `src/main.js` | renderer, cahaya, bayangan, siang/malam, HUD, loop animasi |

## Konsep grafika yang dipakai

- **Geometri dasar:** Box, Cylinder (umpak = silinder 4 sisi), Cone, Icosahedron, Dodecahedron, Plane, Circle.
- **Geometri kustom:** atap limas terpotong dibuat langsung dari `BufferGeometry` (vertex + normal).
- **Transformasi dan hierarki:** `Group` untuk pendopo/dalem/perabot. Pintu berputar pada engselnya (pivot). Daun kelapa adalah anak dari mahkota pohon.
- **Tekstur dan pemetaan UV:** tekstur kayu dan genteng digambar sendiri di `<canvas>` (tanpa aset luar). UV balok kayu dihitung ulang dari ukuran dunia agar serat mengikuti sumbu terpanjang balok. UV atap dihitung per bidang miring (u = searah tepi atap, v = searah kemiringan) agar baris genteng sejajar cucuran.
- **Instancing:** rumput (14.000), batu, dan bunga memakai `InstancedMesh` dengan warna per instance.
- **Pencahayaan dan shading:** HemisphereLight, DirectionalLight (matahari, bayangan PCF soft), PointLight (lampu gantung), material Lambert, dan flat shading.
- **Kamera:** perspektif, orbit, first-person, interpolasi posisi (tween), dan jalur spline Catmull-Rom untuk tur.
- **Tabrakan:** AABB (`Box3`) dari mesh bertanda `solid`, termasuk deteksi tinggi lantai untuk naik anak tangga.
- **Fog** untuk kesan jarak.
