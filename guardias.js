// --- CONFIGURACIÓN ---
let medicos = [
  { nombre: 'Adela', minGuardias: 8, maxGuardias: 8 },
  { nombre: 'Rigo', minGuardias: 8, maxGuardias: 8 },
  { nombre: 'Merino', minGuardias: 8, maxGuardias: 8 },
  { nombre: 'Mica', minGuardias: 4, maxGuardias: 4 },
  { nombre: 'Naby', minGuardias: 4, maxGuardias: 4 },
  { nombre: 'Estrella', minGuardias: 4, maxGuardias: 4 },
  { nombre: 'Amparo', minGuardias: 4, maxGuardias: 4 },
  { nombre: 'Sara', minGuardias: 4, maxGuardias: 4 },
  { nombre: 'Luceth', minGuardias: 4, maxGuardias: 4 },
  { nombre: 'Salva', minGuardias: 3, maxGuardias: 3 },
  { nombre: 'Brian', minGuardias: 2, maxGuardias: 2 },
  { nombre: 'Marta', minGuardias: 2, maxGuardias: 2 },
  { nombre: 'Julia', minGuardias: 2, maxGuardias: 2 },
  { nombre: 'Pepe', minGuardias: 2, maxGuardias: 2 },
  { nombre: 'Wendy', minGuardias: 2, maxGuardias: 2 },
  { nombre: 'Lerma', minGuardias: 2, maxGuardias: 2 }
];

let colores = ["#FFB3BA","#FFDFBA","#FFFFBA","#BAFFC9","#BAE1FF","#E3BAFF","#FFC2DE","#C2FFC2","#B3E0FF","#FFDEBA","#FFBFB3","#BAFFD9","#C2BAFF","#FFBAF2","#BAFFD4","#FFD8BA"];
let festivos = [
  '2025-10-09','2025-11-01','2025-12-06','2025-12-08','2025-12-25',
  '2026-01-01','2026-01-06','2026-03-19','2026-03-29','2026-04-02','2026-04-03','2026-04-06','2026-05-01','2026-08-15'
];
let numMedicosPorDia = 2;
let guardiasAsignadas = {};
let guardiasManual = {};

function getFestivoPuente(year, month, day) {
  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  if (festivos.includes(dateStr)) return 'festivo';
  const prevDate = `${year}-${String(month+1).padStart(2,'0')}-${String(day-1).padStart(2,'0')}`;
  const nextDate = `${year}-${String(month+1).padStart(2,'0')}-${String(day+1).padStart(2,'0')}`;
  if (festivos.includes(prevDate) || festivos.includes(nextDate)) return 'puente';
  return '';
}

function getDiasMes(year, month) {
  const dias = [];
  const lastDay = new Date(year, month+1, 0).getDate();
  for(let d=1; d<=lastDay; d++) {
    const date = new Date(year, month, d);
    dias.push({
      date, year, month, day: d,
      dayOfWeek: date.getDay(),
      festPuente: getFestivoPuente(year, month, d)
    });
  }
  return dias;
}

function distribuirGuardias() {
  guardiasAsignadas = {};
  for(let y=2025; y<=2026; y++) {
    let startMonth = (y===2025)?9:0;
    let endMonth = (y===2026)?5:11;
    for(let m=startMonth;m<=endMonth;m++) {
      const diasMes = getDiasMes(y,m);
      let diasPrioridad = [[],[],[],[],[]]; // sábados, festivos, prefestivos, lunes, resto
      diasMes.forEach(dia => {
        if(dia.dayOfWeek===6) diasPrioridad[0].push(dia); // Sábado
        else if(dia.festPuente==='festivo') diasPrioridad[1].push(dia);
        else if(festivos.includes(`${dia.year}-${String(dia.month+1).padStart(2,'0')}-${String(dia.day+1).padStart(2,'0')}`)) diasPrioridad[2].push(dia); // Prefestivo
        else if(dia.dayOfWeek===1) diasPrioridad[3].push(dia); // Lunes
        else diasPrioridad[4].push(dia);
      });
      let contadores = medicos.map((m,idx)=>{
        let min = m.minGuardias;
        let max = m.maxGuardias;
        if(min === 8) { min = 8; max = 9; }
        return {nombre:m.nombre, guardias:0, min, max, color: colores[idx%colores.length]};
      });
      let totalGuardias = diasMes.length * numMedicosPorDia;
      let sumaMaximos = contadores.reduce((acc,c)=>acc+c.max,0);
      if(sumaMaximos > totalGuardias) {
        let exceso = sumaMaximos - totalGuardias;
        let noContratados = contadores.filter(c=>c.min!==8);
        while(exceso > 0 && noContratados.length > 0) {
          noContratados.sort((a,b)=>b.max-a.max);
          let c = noContratados[0];
          if(c.max > c.min) { c.max--; exceso--; }
          else { noContratados.shift(); }
        }
      }
      let libres = {}; medicos.forEach(m=>libres[m.nombre]=false);
      // 1. Repartir festivos equitativamente entre médicos contratados (min 8)
      let festivosDias = diasPrioridad[1];
      let medicosContratados = contadores.filter(c=>c.min===8);
      let festivoIdx = 0;
      for(const dia of festivosDias){
        const fechaStr = `${dia.year}-${String(dia.month+1).padStart(2,'0')}-${String(dia.day).padStart(2,'0')}`;
        if(guardiasManual[fechaStr]) continue;
        let medico = medicosContratados[festivoIdx % medicosContratados.length];
        guardiasAsignadas[fechaStr] = [medico.nombre];
        medico.guardias++;
        festivoIdx++;
      }
      // 2. Reparto por prioridad para el resto de días
      for(let p=0;p<diasPrioridad.length;p++){
        if(p===1) continue;
        for(const dia of diasPrioridad[p]){
          const fechaStr = `${dia.year}-${String(dia.month+1).padStart(2,'0')}-${String(dia.day).padStart(2,'0')}`;
          if(guardiasManual[fechaStr]) continue;
          guardiasAsignadas[fechaStr] = guardiasAsignadas[fechaStr] || [];
          let asignados = [];
          let candidatos = contadores.filter(c=>c.guardias<c.max && !libres[c.nombre]);
          candidatos.sort((a,b)=>{
            const aNecesita = a.guardias<a.min?-1:1;
            const bNecesita = b.guardias<b.min?-1:1;
            if(aNecesita!==bNecesita) return aNecesita-bNecesita;
            return a.guardias-b.guardias;
          });
          for(let i=0;i<numMedicosPorDia;i++){
            if(candidatos.length===0) break;
            let elegido = candidatos[0];
            if(guardiasAsignadas[fechaStr].includes(elegido.nombre)) continue;
            asignados.push(elegido.nombre);
            elegido.guardias++;
            libres[elegido.nombre]=true;
            candidatos = contadores.filter(c=>c.guardias<c.max && !libres[c.nombre]);
            candidatos.sort((a,b)=>{
              const aNecesita = a.guardias<a.min?-1:1;
              const bNecesita = b.guardias<b.min?-1:1;
              if(aNecesita!==bNecesita) return aNecesita-bNecesita;
              return a.guardias-b.guardias;
            });
          }
          guardiasAsignadas[fechaStr]=guardiasAsignadas[fechaStr].concat(asignados);
          Object.keys(libres).forEach(n=>libres[n]=false);
          asignados.forEach(n=>libres[n]=true);
        }
      }
    }
  }
}

window.actualizarGuardiasManual = function(fecha, selectElem) {
  const seleccionados = Array.from(selectElem.selectedOptions).map(opt=>opt.value);
  guardiasManual[fecha] = seleccionados;
  renderResumen();
}
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('generar-guardias').onclick = function() {
    distribuirGuardias();
    renderResumen();
    renderYearCalendar();
  }
});

function renderMedicosList() {
  const container=document.getElementById('medicos-list');
  container.innerHTML='<h3>Médicos</h3>';
  medicos.forEach((m,idx)=>{
    const div=document.createElement('div'); div.className='medico';
    const inputNombre=document.createElement('input'); inputNombre.type='text'; inputNombre.value=m.nombre;
    inputNombre.addEventListener('change',function(){medicos[idx].nombre=this.value; distribuirGuardias(); renderResumen(); renderYearCalendar();});
    const inputMin=document.createElement('input'); inputMin.type='number'; inputMin.min=0; inputMin.value=m.minGuardias;
    inputMin.addEventListener('change',function(){medicos[idx].minGuardias=parseInt(this.value); distribuirGuardias(); renderResumen(); renderYearCalendar();});
    const inputMax=document.createElement('input'); inputMax.type='number'; inputMax.min=1; inputMax.value=m.maxGuardias;
    inputMax.addEventListener('change',function(){medicos[idx].maxGuardias=parseInt(this.value); distribuirGuardias(); renderResumen(); renderYearCalendar();});
    const btnEliminar=document.createElement('button'); btnEliminar.textContent='Eliminar';
    btnEliminar.addEventListener('click',function(){medicos.splice(idx,1); distribuirGuardias(); renderResumen(); renderYearCalendar(); renderMedicosList();});
    div.appendChild(inputNombre);
    div.appendChild(document.createTextNode(' Min: ')); div.appendChild(inputMin);
    div.appendChild(document.createTextNode(' Max: ')); div.appendChild(inputMax);
    div.appendChild(btnEliminar);
    container.appendChild(div);
  });
  const btnAdd=document.createElement('button'); btnAdd.textContent='Añadir médico';
  btnAdd.addEventListener('click',function(){medicos.push({nombre:'Nuevo',minGuardias:2,maxGuardias:2}); renderMedicosList(); renderResumen(); renderYearCalendar();});
  container.appendChild(btnAdd);
}

function renderResumen() {
  distribuirGuardias();
  const resumen={};
  medicos.forEach((m,idx)=>resumen[m.nombre]={color:colores[idx%colores.length],total:0,lunes:0,martes:0,miercoles:0,jueves:0,viernes:0,sabado:0,domingo:0,festivo:0,puente:0,prefestivo:0});
  Object.keys(guardiasAsignadas).forEach(fechaStr=>{
    const guardias=guardiasManual[fechaStr] ? guardiasManual[fechaStr] : guardiasAsignadas[fechaStr];
    const [year,month,day]=fechaStr.split('-').map(Number);
    const date=new Date(year,month-1,day);
    const dayOfWeek=date.getDay();
    let diaSemana=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][dayOfWeek];
    let festPuente=getFestivoPuente(year,month-1,day);
    let esPrefestivo=false;
    const nextDate=`${year}-${String(month).padStart(2,'0')}-${String(day+1).padStart(2,'0')}`;
    if(festivos.includes(nextDate)) esPrefestivo=true;
    guardias.forEach(nombre=>{
      if(!resumen[nombre]) return;
      resumen[nombre].total++;
      resumen[nombre][diaSemana]++;
      if(festPuente==='festivo') resumen[nombre].festivo++;
      if(festPuente==='puente') resumen[nombre].puente++;
      if(esPrefestivo) resumen[nombre].prefestivo++;
    });
  });
  const container=document.getElementById('resumen-list');
  container.innerHTML='<h3>Resumen</h3>';
  const table=document.createElement('table');
  const ths = `<tr>
    <th>Médico</th><th>Total</th><th>L</th><th>M</th><th>X</th><th>J</th><th>V</th><th>S</th><th>D</th><th>Festivos</th><th>Puentes</th><th>Prefestivos</th>
  </tr>`;
  table.innerHTML=ths;
  Object.keys(resumen).forEach(nombre=>{
    const r=resumen[nombre];
    const tr=document.createElement('tr');
    tr.style.background=r.color;
    tr.innerHTML=`<td>${nombre}</td><td>${r.total}</td><td>${r.lunes}</td><td>${r.martes}</td><td>${r.miercoles}</td><td>${r.jueves}</td><td>${r.viernes}</td><td>${r.sabado}</td><td>${r.domingo}</td><td>${r.festivo}</td><td>${r.puente}</td><td>${r.prefestivo}</td>`;
    table.appendChild(tr);
  });
  container.appendChild(table);
}

function renderYearCalendar() {
  const container=document.getElementById('calendar');
  container.innerHTML='';
  for(let y=2025;y<=2026;y++){
    let startMonth=(y===2025)?9:0;
    let endMonth=(y===2026)?5:11;
    for(let m=startMonth;m<=endMonth;m++){
      const dias=getDiasMes(y,m);
      const mesDiv=document.createElement('div'); mesDiv.className='month';
      mesDiv.innerHTML=`<h4>${dias[0].date.toLocaleString('es-ES',{month:'long', year:'numeric'})}</h4>`;
      const grid=document.createElement('div'); grid.className='days';
      ['L','M','X','J','V','S','D'].forEach(weekday=>{ 
        const wDiv=document.createElement('div'); 
        wDiv.style.fontWeight='bold'; wDiv.style.textAlign='center'; 
        wDiv.textContent=weekday; 
        grid.appendChild(wDiv); 
      });
      const firstDay = dias[0].date.getDay();
      let offset = (firstDay === 0) ? 6 : firstDay - 1;
      for(let i=0;i<offset;i++){
        const emptyDiv=document.createElement('div'); emptyDiv.className='day'; emptyDiv.innerHTML=''; grid.appendChild(emptyDiv);
      }
      dias.forEach(dia=>{
        const dayDiv=document.createElement('div'); dayDiv.className='day';
        if(dia.festPuente==='festivo') dayDiv.classList.add('festivo');
        if(dia.festPuente==='puente') dayDiv.classList.add('puente');
        if(dia.dayOfWeek===0) dayDiv.classList.add('domingo');
        const fechaStr=`${dia.year}-${String(dia.month+1).padStart(2,'0')}-${String(dia.day).padStart(2,'0')}`;
        let guardias = guardiasManual[fechaStr] ? guardiasManual[fechaStr] : guardiasAsignadas[fechaStr];
        let innerHTML = `${dia.day}<span>`;
        guardias.forEach((nombre, idx) => {
          const color = colores[medicos.findIndex(m=>m.nombre===nombre)%colores.length];
          innerHTML += `<span style="background:${color};padding:1px 2px;border-radius:3px;margin:1px;display:inline-block;">${nombre}</span>`;
        });
        innerHTML += '</span>';
        innerHTML += `<br><select multiple style='width:90%;margin-top:2px;' onchange='actualizarGuardiasManual("${fechaStr}", this)'>`;
        medicos.forEach((m, idx) => {
          const selected = guardias.includes(m.nombre) ? 'selected' : '';
          innerHTML += `<option value="${m.nombre}" style="background:${colores[idx%colores.length]};" ${selected}>${m.nombre}</option>`;
        });
        innerHTML += '</select>';
        dayDiv.innerHTML = innerHTML;
        grid.appendChild(dayDiv);
      });
      let totalCeldas = offset + dias.length;
      for(let i=totalCeldas;i<42;i++){
        const emptyDiv=document.createElement('div'); emptyDiv.className='day'; emptyDiv.innerHTML=''; grid.appendChild(emptyDiv);
      }
      mesDiv.appendChild(grid);
      const resumenMes = {};
      medicos.forEach((m, idx) => {
        resumenMes[m.nombre] = { total: 0, color: colores[idx % colores.length] };
      });
      dias.forEach(dia => {
        const fechaStr = `${dia.year}-${String(dia.month+1).padStart(2,'0')}-${String(dia.day).padStart(2,'0')}`;
        let guardias = guardiasManual[fechaStr] ? guardiasManual[fechaStr] : guardiasAsignadas[fechaStr];
        if (guardias) {
          guardias.forEach(nombre => {
            if (resumenMes[nombre]) resumenMes[nombre].total++;
          });
        }
      });
      const resumenTable = document.createElement('table');
      resumenTable.style.margin = '12px auto 0 auto';
      resumenTable.style.width = '95%';
      resumenTable.innerHTML = `<tr><th style='text-align:left'>Médico</th><th>Guardias</th></tr>`;
      Object.keys(resumenMes).forEach(nombre => {
        const r = resumenMes[nombre];
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style='background:${r.color};border-radius:4px;padding:2px 6px;'>${nombre}</td><td>${r.total}</td>`;
        resumenTable.appendChild(tr);
      });
      mesDiv.appendChild(resumenTable);
      container.appendChild(mesDiv);
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  renderMedicosList();
  renderResumen();
  renderYearCalendar();
});
