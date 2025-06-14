// Fungsi untuk mencari FPB (Faktor Persekutuan Terbesar)
function gcd(a, b) {
    if (b < 0.0000001) return a; // Mengatasi masalah floating point
    return gcd(b, Math.floor(a % b));
}

// Fungsi untuk mengubah desimal menjadi pecahan
function decimalToFraction(decimal) {
    if (isNaN(decimal)) return '<span class="undefined">tidak terdefinisi</span>';
    if (decimal === 0) return '0';
    if (Number.isInteger(decimal)) return decimal.toString();
    
    const len = decimal.toString().length - 2;
    let denominator = Math.pow(10, len);
    let numerator = decimal * denominator;
    
    // Sederhanakan pecahan
    const divisor = gcd(numerator, denominator);
    numerator /= divisor;
    denominator /= divisor;
    
    // Handle kasus NaN/NaN
    if (isNaN(numerator) || isNaN(denominator)) {
        return '<span class="undefined">tidak terdefinisi</span>';
    }
    
    if (denominator === 1) return numerator.toString();
    
    return `<div class="fraction">
        <span class="numerator">${numerator}</span>
        <span class="denominator">${denominator}</span>
    </div>`;
}

// Fungsi untuk memformat angka menjadi pecahan atau bilangan bulat
function formatNumber(num) {
    if (Math.abs(num) < 0.0000001) return '0';
    return decimalToFraction(num);
}

function createMatrix() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const container = document.getElementById('matrix-container');
    
    let table = '<table><thead><tr><th></th>';
    
    // Header kolom
    for (let j = 0; j < cols; j++) {
        if (j === cols - 1) {
            table += `<th>Hasil</th>`;
        } else {
            table += `<th>x<sub>${j + 1}</sub></th>`;
        }
    }
    table += '</tr></thead><tbody>';
    
    // Isi matriks
    for (let i = 0; i < rows; i++) {
        table += `<tr><th>Baris ${i + 1}</th>`;
        for (let j = 0; j < cols; j++) {
            table += `<td><input type="number" class="matrix-cell" id="m${i}${j}" value="${i === j ? 1 : 0}" step="any"></td>`;
        }
        table += '</tr>';
    }
    
    table += '</tbody></table>';
    container.innerHTML = table;
    
    // Sembunyikan hasil sebelumnya
    document.getElementById('result').style.display = 'none';
    document.getElementById('steps').innerHTML = '';
}

function getMatrix() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const matrix = [];
    
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            const value = parseFloat(document.getElementById(`m${i}${j}`).value) || 0;
            row.push(value);
        }
        matrix.push(row);
    }
    
    return matrix;
}

function solve() {
    const matrix = getMatrix();
    const stepsDiv = document.getElementById('steps');
    const resultDiv = document.getElementById('result');
    const finalMatrixDiv = document.getElementById('final-matrix');
    const solutionMessageDiv = document.getElementById('solution-message');
    
    stepsDiv.innerHTML = '';
    resultDiv.style.display = 'none';
    
    const steps = gaussJordan(matrix);
    
    // Tampilkan semua langkah
    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        
        let stepContent = `
            <div class="step-header">
                <h4 class="step-title">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Langkah ${index + 1}
                </h4>
            </div>
            ${matrixToHTML(step.matrix, step.pivot)}
            <div class="step-description">${step.description}</div>
        `;
        
        stepDiv.innerHTML = stepContent;
        stepsDiv.appendChild(stepDiv);
    });
    
    // Tampilkan hasil akhir
    const finalMatrix = steps[steps.length - 1].matrix;
    finalMatrixDiv.innerHTML = matrixToHTML(finalMatrix);
    
    // Cek solusi
    const solutionInfo = checkSolution(finalMatrix);
    solutionMessageDiv.className = `solution-message ${solutionInfo.class}`;
    solutionMessageDiv.innerHTML = solutionInfo.message;
    
    // Tampilkan hasil
    resultDiv.style.display = 'block';
    
    // Scroll ke hasil
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

function gaussJordan(matrix) {
    const steps = [];
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    // Salin matriks untuk menghindari modifikasi langsung
    const workMatrix = JSON.parse(JSON.stringify(matrix));
    
    // Catat matriks awal
    steps.push({
        matrix: JSON.parse(JSON.stringify(workMatrix)),
        description: "Matriks awal sebelum eliminasi",
        pivot: null
    });
    
    for (let col = 0, row = 0; col < cols - 1 && row < rows; col++) {
        // Temukan baris dengan elemen pivot terbesar (untuk mengurangi error pembulatan)
        let maxRow = row;
        for (let i = row + 1; i < rows; i++) {
            if (Math.abs(workMatrix[i][col]) > Math.abs(workMatrix[maxRow][col])) {
                maxRow = i;
            }
        }
        
        // Tukar baris jika diperlukan
        if (maxRow !== row) {
            [workMatrix[row], workMatrix[maxRow]] = [workMatrix[maxRow], workMatrix[row]];
            steps.push({
                matrix: JSON.parse(JSON.stringify(workMatrix)),
                description: `Menukar baris ${row + 1} dengan baris ${maxRow + 1} untuk mendapatkan pivot terbesar`,
                pivot: { row, col }
            });
        }
        
        // Jika elemen pivot adalah 0, kolom ini sudah dieliminasi
        if (Math.abs(workMatrix[row][col]) < 0.0000001) {
            steps.push({
                matrix: JSON.parse(JSON.stringify(workMatrix)),
                description: `Elemen pivot pada baris ${row + 1}, kolom ${col + 1} adalah 0 (dapat diabaikan)`,
                pivot: { row, col }
            });
            continue;
        }
        
        // Buat elemen pivot menjadi 1
        const pivot = workMatrix[row][col];
        if (Math.abs(pivot - 1) > 0.0000001) {
            for (let j = col; j < cols; j++) {
                workMatrix[row][j] /= pivot;
            }
            steps.push({
                matrix: JSON.parse(JSON.stringify(workMatrix)),
                description: `Membagi baris ${row + 1} dengan ${formatNumber(pivot)} untuk membuat pivot menjadi 1`,
                pivot: { row, col }
            });
        }
        
        // Eliminasi kolom ini di baris lain
        for (let i = 0; i < rows; i++) {
            if (i !== row && Math.abs(workMatrix[i][col]) > 0.0000001) {
                const factor = workMatrix[i][col];
                for (let j = col; j < cols; j++) {
                    workMatrix[i][j] -= factor * workMatrix[row][j];
                }
                steps.push({
                    matrix: JSON.parse(JSON.stringify(workMatrix)),
                    description: `Mengurangi baris ${i + 1} dengan ${formatNumber(factor)} kali baris ${row + 1} untuk mengeliminasi kolom ${col + 1}`,
                    pivot: { row, col }
                });
            }
        }
        
        row++;
    }
    
    return steps;
}

function matrixToHTML(matrix, pivot = null) {
    let html = '<table><tbody>';
    for (let i = 0; i < matrix.length; i++) {
        html += '<tr>';
        for (let j = 0; j < matrix[i].length; j++) {
            // Format angka menjadi pecahan
            const value = Math.abs(matrix[i][j]) < 0.0000001 ? 0 : matrix[i][j];
            const formattedValue = formatNumber(value);
            const isPivot = pivot && pivot.row === i && pivot.col === j;
            html += `<td class="${isPivot ? 'pivot' : ''}">${formattedValue}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}

function checkSolution(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    // Cek untuk solusi unik, tidak ada solusi, atau solusi tak terhingga
    for (let i = 0; i < rows; i++) {
        let allZero = true;
        for (let j = 0; j < cols - 1; j++) {
            if (Math.abs(matrix[i][j]) > 0.0000001) {
                allZero = false;
                break;
            }
        }
        
        if (allZero && Math.abs(matrix[i][cols - 1]) > 0.0000001) {
            return {
                class: 'danger',
                message: 'Sistem tidak memiliki solusi (kontradiksi ditemukan)'
            };
        }
    }
    
    // Hitung rank matriks koefisien dan augmented
    let rankA = 0, rankAB = 0;
    for (let i = 0; i < rows; i++) {
        let nonZeroRow = false;
        for (let j = 0; j < cols - 1; j++) {
            if (Math.abs(matrix[i][j]) > 0.0000001) {
                nonZeroRow = true;
                break;
            }
        }
        if (nonZeroRow) rankA++;
        
        let nonZeroRowAB = false;
        for (let j = 0; j < cols; j++) {
            if (Math.abs(matrix[i][j]) > 0.0000001) {
                nonZeroRowAB = true;
                break;
            }
        }
        if (nonZeroRowAB) rankAB++;
    }
    
    if (rankA < rankAB) {
        return {
            class: 'danger',
            message: 'Sistem tidak memiliki solusi (inkonsisten)'
        };
    } else if (rankA < cols - 1) {
        const freeVars = cols - 1 - rankA;
        return {
            class: 'warning',
            message: `Sistem memiliki solusi tak terhingga dengan ${freeVars} variabel bebas`
        };
    } else {
        let solutions = '';
        if (rankA === cols - 1 && rankA === rows) {
            solutions = '<div style="margin-top: 10px;">Solusi:';
            for (let i = 0; i < rows; i++) {
                solutions += ` x<sub>${i + 1}</sub> = ${formatNumber(matrix[i][cols - 1])};`;
            }
            solutions += '</div>';
        }
        
        return {
            class: 'success',
            message: 'Sistem memiliki solusi unik' + solutions
        };
    }
}

// Buat matriks default saat halaman dimuat
window.onload = createMatrix;