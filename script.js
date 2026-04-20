let myChart;
let isRawDataMode = false; // Variabel pengingat mode grafik

// Fungsi menukar mode grafik saat tombol panah ditekan
function toggleChartMode() {
    isRawDataMode = !isRawDataMode; 
    calculate(); 
}

// Fungsi memunculkan/menyembunyikan detail langkah penyelesaian matematika
function toggleDetails(id, btn) {
    const elemen = document.getElementById(id);
    if (elemen.classList.contains('hidden')) {
        elemen.classList.remove('hidden');
        btn.innerText = 'Sembunyikan ▲';
    } else {
        elemen.classList.add('hidden');
        btn.innerText = 'Selengkapnya ▼';
    }
}

// Fungsi Menghapus Baris dengan Minimal 3 Data pengaman
function hapusBaris(elemen) {
    const tbody = document.getElementById('tableBody');
    if (tbody.rows.length <= 3) {
        alert("Peringatan: Kalkulus regresi kuadratik membutuhkan minimal 3 data agar kurva bisa terbentuk akurat.");
        return;
    }
    elemen.closest('tr').remove();
}

// Fungsi Tambah Baris Otomatis
function addRow() {
    const tbody = document.getElementById('tableBody');
    let mingguTerakhir = 0;
    if (tbody.rows.length > 0) {
        const inputVal = tbody.rows[tbody.rows.length - 1].cells[0].querySelector('input').value;
        mingguTerakhir = parseFloat(inputVal) || 0;
    }
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="number" value="${mingguTerakhir + 1}" class="w-20 p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"></td>
        <td><input type="number" class="w-24 p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"></td>
        <td class="text-center"><button onclick="hapusBaris(this)" class="text-red-400 hover:text-red-600 font-bold text-xl">×</button></td>
    `;
    tbody.appendChild(tr);
}

// Fungsi Utama Kalkulasi
function calculate() {
    const data = [];
    const rows = document.getElementById('tableBody').rows;
    
    for (let row of rows) {
        const x = parseFloat(row.cells[0].querySelector('input').value);
        const y = parseFloat(row.cells[1].querySelector('input').value);
        if (!isNaN(x) && !isNaN(y)) data.push([x, y]);
    }

    if (data.length < 3) {
        alert("Minimal sediakan 3 data panen mingguan.");
        return;
    }

    // 1. Regresi Polinomial Derajat 2
    const result = regression.polynomial(data, { order: 2 });
    
    // Mengambil koefisien dengan urutan yang BENAR [a, b, c]
    const a = result.equation[0]; 
    const b = result.equation[1]; 
    const c = result.equation[2]; 

    const startX = parseFloat(document.getElementById('startWeek').value);
    const endX = parseFloat(document.getElementById('endWeek').value);

    // 2. Integral: F(x) = (a/3)x^3 + (b/2)x^2 + cx
    const F = (x) => (a/3) * Math.pow(x, 3) + (b/2) * Math.pow(x, 2) + c * x;
    const totalPanen = F(endX) - F(startX);
    
    // 3. Laju Panen pada minggu terakhir target
    const lajuSeketika = a * Math.pow(endX, 2) + b * endX + c;

    displayResults(a, b, c, startX, endX, totalPanen, lajuSeketika, data);
}

// Fungsi Menampilkan Hasil dan Pembuktian Matematika
function displayResults(a, b, c, start, end, total, instant, rawData) {
    document.getElementById('resultsArea').classList.remove('hidden');
    
    // Render fungsi kurva f(x)
    const f_str = `f(x) = ${a.toFixed(3)}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b).toFixed(3)}x ${c < 0 ? '-' : '+'} ${Math.abs(c).toFixed(3)}`;
    katex.render(f_str, document.getElementById('mathFunction'));

    // Render integral
    const int_str = `\\text{Total} = \\int_{${start}}^{${end}} (${a.toFixed(2)}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b).toFixed(2)}x ${c < 0 ? '-' : '+'} ${Math.abs(c).toFixed(2)}) dx = ${total.toFixed(2)} \\text{ kg}`;
    katex.render(int_str, document.getElementById('mathIntegral'));

    document.getElementById('integralResult').innerText = total.toFixed(2) + " kg";
    document.getElementById('instantResult').innerText = (instant > 0 ? instant.toFixed(2) : 0) + " kg";

    // Langkah Regresi
    let poinData = rawData.map(d => `(${d[0]}, ${d[1]})`).join(', ');
    let regSteps = `\\begin{aligned}
    &\\text{1. Model Regresi Polinomial Derajat 2:} \\\\
    &f(x) = ax^2 + bx + c \\\\
    &\\text{2. Memproses Titik Data Historis } (x, y): \\\\
    &${poinData} \\\\
    &\\text{3. Menggunakan Metode Kuadrat Terkecil, didapat koefisien:} \\\\
    &a = ${a.toFixed(4)} \\\\
    &b = ${b.toFixed(4)} \\\\
    &c = ${c.toFixed(4)} \\\\
    &\\text{4. Substitusi koefisien untuk mendapatkan fungsi laju panen:} \\\\
    &f(x) = ${a.toFixed(3)}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b).toFixed(3)}x ${c < 0 ? '-' : '+'} ${Math.abs(c).toFixed(3)}
    \\end{aligned}`;
    katex.render(regSteps, document.getElementById('stepRegression'), { displayMode: true });

    // Langkah Integral Tentu
    const a3 = (a/3).toFixed(4);
    const b2 = (b/2).toFixed(4);
    const c1 = c.toFixed(4);
    const Fb = ((a/3)*Math.pow(end, 3) + (b/2)*Math.pow(end, 2) + c*end).toFixed(2);
    const Fa = ((a/3)*Math.pow(start, 3) + (b/2)*Math.pow(start, 2) + c*start).toFixed(2);

    let intSteps = `\\begin{aligned}
    &\\text{1. Tentukan Antiturunan } F(x): \\\\
    &\\int (${a.toFixed(3)}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b).toFixed(3)}x ${c < 0 ? '-' : '+'} ${Math.abs(c).toFixed(3)}) dx \\\\
    &F(x) = \\left(\\frac{${a.toFixed(3)}}{3}\\right)x^3 + \\left(\\frac{${b.toFixed(3)}}{2}\\right)x^2 + (${c.toFixed(3)})x \\\\
    &F(x) = ${a3}x^3 ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)}x^2 ${c1 < 0 ? '-' : '+'} ${Math.abs(c1)}x \\\\
    &\\text{2. Evaluasi Teorema Dasar Kalkulus } (\\text{Batas Atas } b=${end}, \\text{ Batas Bawah } a=${start}): \\\\
    &F(${end}) = ${a3}(${end})^3 ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)}(${end})^2 ${c1 < 0 ? '-' : '+'} ${Math.abs(c1)}(${end}) = ${Fb} \\\\
    &F(${start}) = ${a3}(${start})^3 ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)}(${start})^2 ${c1 < 0 ? '-' : '+'} ${Math.abs(c1)}(${start}) = ${Fa} \\\\
    &\\text{3. Hitung Luas Daerah Di Bawah Kurva } (F(b) - F(a)): \\\\
    &\\text{Total} = ${Fb} - ${Fa} = ${total.toFixed(2)} \\text{ kg}
    \\end{aligned}`;
    katex.render(intSteps, document.getElementById('stepIntegral'), { displayMode: true });

    updateChart(a, b, c, start, end, rawData);
}

// Fungsi Menggambar Grafik Chart.js
function updateChart(a, b, c, start, end, rawData) {
    const ctx = document.getElementById('yieldChart').getContext('2d');
    const titleElement = document.getElementById('chartTitle');
    
    if (myChart) myChart.destroy();

    // Urutkan data riil dari minggu terkecil agar garis penghubung tidak menyilang
    const sortedRawData = [...rawData].sort((d1, d2) => d1[0] - d2[0]);

    if (isRawDataMode) {
        // ==========================================
        // MODE 2: GRAFIK DATA RIIL (Menghubungkan Titik)
        // ==========================================
        titleElement.innerText = "Tren Hasil Panen Aktual (Data Riil)";
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Tren Hasil Panen Aktual',
                    data: sortedRawData.map(d => ({x: d[0], y: d[1]})),
                    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Biru terang
                    borderColor: '#3b82f6',
                    showLine: true,
                    fill: true,
                    tension: 0.3, // Membuat lengkungan natural di titik-titiknya
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'Minggu Ke-' } },
                    y: { title: { display: true, text: 'Kilogram' }, min: 0 }
                }
            }
        });
    } else {
        // ==========================================
        // MODE 1: GRAFIK PEMODELAN KALKULUS (Default)
        // ==========================================
        titleElement.innerText = "Visualisasi Akumulasi Panen (Model)";
        const curveData = [];
        const integralFillData = [];

        // Mencari batas menggambar agar tidak terpotong
        let maxDataX = 0;
        if (rawData.length > 0) {
            maxDataX = Math.max(...rawData.map(d => d[0]));
        }
        let maxDisplayX = Math.max(end, maxDataX) + 1;

        for (let x = 0; x <= maxDisplayX; x += 0.1) { 
            const y = a * x * x + b * x + c;
            const valY = y < 0 ? 0 : y;
            curveData.push({x: x, y: valY});
            
            if (x >= start && x <= end) {
                integralFillData.push({x: x, y: valY});
            }
        }

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Data Historis (Titik Riil)',
                        data: sortedRawData.map(d => ({x: d[0], y: d[1]})),
                        backgroundColor: '#10b981',
                        borderColor: '#10b981',
                        showLine: false,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Kurva f(x)',
                        data: curveData,
                        borderColor: '#10b981',
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Area Integral (Total Kumulatif)',
                        data: integralFillData,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)', // Hijau terang
                        borderColor: '#10b981',
                        fill: true,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'Minggu Ke-' } },
                    y: { title: { display: true, text: 'Kilogram' }, min: 0 }
                }
            }
        });
    }
}

// Eksekusi kalkulasi awal saat web dimuat
window.onload = calculate;