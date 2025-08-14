// Lista de médicos con índice para color pastel

let medicos = [
    { nombre: "Adela", min: 8, max: 8, colorIdx: 1 },
    { nombre: "Rigo", min: 8, max: 8, colorIdx: 2 },
    { nombre: "Merino", min: 8, max: 8, colorIdx: 3 },
    { nombre: "Mica", min: 4, max: 4, colorIdx: 4 },
    { nombre: "Naby", min: 4, max: 4, colorIdx: 5 }
];

let festivos = [];
let puentes = [];
let guardiasPorMedico = {};


// ...existing code...

// Configuración
const meses = [
    "Octubre 2025", "Noviembre 2025", "Diciembre 2025",
    "Enero 2026", "Febrero 2026", "Marzo 2026",
    "Abril 2026", "Mayo 2026", "Junio 2026"
];
const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
let medicosPorGuardia = 2;
function calcularPuentes() {
    puentes = [];
    festivos.forEach(f => {
        let d = new Date(f);
        // Puente antes del festivo
        let prev = new Date(d);
        while (prev.getDay() !== 6 && prev.getDay() !== 0) {
            prev.setDate(prev.getDate()-1);
            let prevStr = prev.toISOString().slice(0,10);
            if (!festivos.includes(prevStr) && !puentes.includes(prevStr)) {
                puentes.push(prevStr);
            }
        }
        // Puente después del festivo
        let next = new Date(d);
        while (next.getDay() !== 6 && next.getDay() !== 0) {
            next.setDate(next.getDate()+1);
            let nextStr = next.toISOString().slice(0,10);
            if (!festivos.includes(nextStr) && !puentes.includes(nextStr)) {
                puentes.push(nextStr);
            }
        }
    });
}

// ...existing code...
function renderMedicos() {
    const cont = document.getElementById("medicos");
    cont.innerHTML = "";
    medicos.forEach((m, i) => {
        cont.innerHTML += `<div class="medico-item">
            <input type="text" value="${m.nombre}" onchange="updateMedicoNombre(${i}, this.value)">
            Min: <input type="number" value="${m.min}" min="0" style="width:40px" onchange="updateMedicoMin(${i}, this.value)">
            Max: <input type="number" value="${m.max}" min="0" style="width:40px" onchange="updateMedicoMax(${i}, this.value)">
            <button onclick="removeMedico(${i})">Eliminar</button>
        </div>`;
    });
}
window.updateMedicoNombre = function(i, val) { medicos[i].nombre = val; renderMedicos(); renderResumen(); renderCalendario(); }
window.updateMedicoMin = function(i, val) { medicos[i].min = parseInt(val); renderMedicos(); renderResumen(); renderCalendario(); }
window.updateMedicoMax = function(i, val) { medicos[i].max = parseInt(val); renderMedicos(); renderResumen(); renderCalendario(); }
window.removeMedico = function(i) { medicos.splice(i,1); renderMedicos(); renderResumen(); renderCalendario(); }
document.getElementById("add-medico").onclick = function() {
    medicos.push({ nombre: "Nuevo", min: 1, max: 1 });
    renderMedicos(); renderResumen(); renderCalendario();
};

// ...existing code...
