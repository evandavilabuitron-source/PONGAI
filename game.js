const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const neuralCanvas = document.getElementById("neuralCanvas");
const neuralCtx = neuralCanvas.getContext("2d");

let estadoJuego = "MENU";

//referencias a elementos del DOM
const menuInicio = document.getElementById("menu-inicio");
const estadoTexto = document.getElementById("estado-texto");
const btnEntrenar = document.getElementById("btn-entrenar");
const btnJugar = document.getElementById("btn-jugar");
const btnReiniciar = document.getElementById("btn-reiniciar");
const btnMenu = document.getElementById("btn-menu");
const TAM_POBLACION = 16;
const MAX_PASOS_EPISODIO = 500;
const PASOS_POR_FRAME_ENTRENAMIENTO = 4;
const STORAGE_KEY_MEJOR_IA = "pong_player_two_mejor_ia";

function actualizarUIEstado() {
    if (estadoJuego === "MENU") {
        menuInicio.style.display = "flex";
        estadoTexto.textContent = "Modo: Menú";
    } else if (estadoJuego === "ENTRENANDO") {
        menuInicio.style.display = "none";
        estadoTexto.textContent = "Modo: Entrenando IA";
    } else if (estadoJuego === "JUGANDO") {
        menuInicio.style.display = "none";
        estadoTexto.textContent = "Modo: Jugando contra la IA";
    }
}

let bola = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 4,
    vy: 3,
    radio: 10,
    invisible: false
};

let jugador = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 30,
    ancho: 80,
    alto: 15,
    velocidad: 7,
    puntos: 0
};

let ia = {
    x: canvas.width / 2 - 40,
    y: 20,
    ancho: 80,
    alto: 15,
    velocidad: 5,
    fitness: 0,
    generacion: 1,
    puntos: 0
};

let teclas = {
    izquierda: false,
    derecha: false
}

let poblacion = [];
let fitnessPoblacion = [];
let indiceIndividuo = 0;
let pasosEpisodio = 0;
let mejorCerebro = null;
let mejorFitnessHistorico = -Infinity;
let ultimaSalidaRed = null;

function cargarMejorCerebroGuardado() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_MEJOR_IA);
        if (!raw) return;
        const data = JSON.parse(raw);
        mejorCerebro = RedNeuronal.fromJSON(data);
        if (typeof data.mejorFitness === "number") {
            mejorFitnessHistorico = data.mejorFitness;
        }
    } catch (e) {
        console.warn("No se pudo cargar un modelo guardado:", e);
    }
}

function guardarMejorCerebro(red, fitness) {
    if (!red) return;
    mejorCerebro = red.clonar();
    if (fitness > mejorFitnessHistorico) {
        mejorFitnessHistorico = fitness;
    }
    try {
        localStorage.setItem(STORAGE_KEY_MEJOR_IA, JSON.stringify({
            ...mejorCerebro.toJSON(),
            mejorFitness: mejorFitnessHistorico
        }));
    } catch (e) {
        console.warn("No se pudo guardar el modelo en localStorage:", e);
    }
}

function crearPoblacionInicial() {
    poblacion = Array.from({ length: TAM_POBLACION }, () => new RedNeuronal(4, 6, 3));
    fitnessPoblacion = Array(TAM_POBLACION).fill(0);
    indiceIndividuo = 0;
    pasosEpisodio = 0;
    ia.generacion = 1;
    ia.fitness = 0;
}

function evolucionarGeneracion() {
    
    const indicesOrdenados = Array.from({ length: TAM_POBLACION }, (_, i) => i)
        .sort((a, b) => fitnessPoblacion[b] - fitnessPoblacion[a]);

    const mejorIdx = indicesOrdenados[0];
    const mejorRedGen = poblacion[mejorIdx];
    const mejorFitnessGen = fitnessPoblacion[mejorIdx];

    if (mejorFitnessGen >= mejorFitnessHistorico || !mejorCerebro) {
        guardarMejorCerebro(mejorRedGen, mejorFitnessGen);
    }

    const nuevaPoblacion = [];
    // pasa el mejor
    nuevaPoblacion.push(mejorRedGen.clonar());

    // a partir de los 4 bestos
    const topCount = Math.min(4, TAM_POBLACION);
    while (nuevaPoblacion.length < TAM_POBLACION) {
        const padreIdx = indicesOrdenados[Math.floor(Math.random() * topCount)];
        const hijo = poblacion[padreIdx].clonar();
        hijo.mutar(0.2, 0.2);
        nuevaPoblacion.push(hijo);
    }

    poblacion = nuevaPoblacion;
    fitnessPoblacion = Array(TAM_POBLACION).fill(0);
    indiceIndividuo = 0;
    pasosEpisodio = 0;
    ia.generacion++;
}

function obtenerRedActiva() {
    if (estadoJuego === "ENTRENANDO") {
        return poblacion[indiceIndividuo];
    }
    if (estadoJuego === "JUGANDO") {
        if (mejorCerebro) return mejorCerebro;
        if (poblacion.length > 0) return poblacion[0];
        return new RedNeuronal(4, 6, 3);
    }
    return mejorCerebro || poblacion[0] || null;
}

function finalizarTurnoEntrenamiento() {
    const fitnessActual = fitnessPoblacion[indiceIndividuo];
    if (fitnessActual > mejorFitnessHistorico) {
        guardarMejorCerebro(poblacion[indiceIndividuo], fitnessActual);
    }

    indiceIndividuo++;
    pasosEpisodio = 0;
    ia.x = canvas.width / 2 - ia.ancho / 2;

    if (indiceIndividuo >= TAM_POBLACION) {
        evolucionarGeneracion();
    }

    ia.fitness = fitnessPoblacion[indiceIndividuo] || 0;
    reiniciarBolaAlCentro(-3.5);
}

cargarMejorCerebroGuardado();
crearPoblacionInicial();

function reiniciarBolaAlCentro(vyInicial = -3) {
    bola.x = canvas.width / 2;
    bola.y = canvas.height / 2;
    bola.vx = (Math.random() < 0.5 ? -1 : 1) * 4;
    bola.vy = vyInicial;
    bola.invisible = false;
}

//eventos keyup keydown
document.addEventListener("keydown", function(evento) {
    if (evento.key === "ArrowLeft") teclas.izquierda = true;
    if (evento.key === "ArrowRight") teclas.derecha = true;
})

document.addEventListener("keyup", function(evento) {
    if (evento.key === "ArrowLeft") teclas.izquierda = false;
    if (evento.key === "ArrowRight") teclas.derecha = false;
})

//funciones de transición
function iniciarEntrenamiento() {
    crearPoblacionInicial();
    estadoJuego = "ENTRENANDO";
    jugador.puntos = 0;
    ia.puntos = 0;
    ia.x = canvas.width / 2 - ia.ancho / 2;
    reiniciarBolaAlCentro(-3);
    actualizarUIEstado();
}

function iniciarPartidaContraIA() {
    if (!mejorCerebro && poblacion.length > 0) {
        let mejorIdx = 0;
        for (let i = 1; i < poblacion.length; i++) {
            if (fitnessPoblacion[i] > fitnessPoblacion[mejorIdx]) {
                mejorIdx = i;
            }
        }
        guardarMejorCerebro(poblacion[mejorIdx], fitnessPoblacion[mejorIdx]);
    }
    
    estadoJuego = "JUGANDO";
    jugador.puntos = 0;
    ia.puntos = 0;
    ia.x = canvas.width / 2 - ia.ancho / 2;
    jugador.x = canvas.width / 2 - jugador.ancho / 2;
    reiniciarBolaAlCentro(3);
    actualizarUIEstado();
}

function volverAlMenu() {
    estadoJuego = "MENU";
    reiniciarBolaAlCentro(-3);
    actualizarUIEstado();
}

btnEntrenar.addEventListener("click", iniciarEntrenamiento);
btnReiniciar.addEventListener("click", iniciarEntrenamiento);
btnJugar.addEventListener("click", iniciarPartidaContraIA);
btnMenu.addEventListener("click", volverAlMenu);

actualizarUIEstado();

function moverIA() {
    const red = obtenerRedActiva();
    if (!red) return;

    const centroIA = ia.x + ia.ancho / 2;
    // Entradas normalizadas
    const entradas = [
        (bola.x - centroIA) / (canvas.width / 2),
        (bola.y / canvas.height) * 2 - 1,
        bola.vx / 6,
        bola.vy / 6
    ];

    const resultado = red.predict(entradas);
    ultimaSalidaRed = resultado;

    // 0-izquierda 1-nada 2-derecha
    if (resultado.accion === 0) {
        ia.x -= ia.velocidad;
    } else if (resultado.accion === 2) {
        ia.x += ia.velocidad;
    }

    if (ia.x < 0) ia.x = 0;
    if (ia.x + ia.ancho > canvas.width) ia.x = canvas.width - ia.ancho;
}

function mostrarVisualizadorNeuralnetwork() {
    neuralCtx.fillStyle = "#0f172a";
    neuralCtx.fillRect(0, 0, neuralCanvas.width, neuralCanvas.height);

    const red = obtenerRedActiva();

    // Encabezado
    neuralCtx.fillStyle = "#e2e8f0";
    neuralCtx.font = "bold 13px Arial";
    neuralCtx.fillText(`Cerebro IA · Gen ${ia.generacion}`, 14, 24);

    neuralCtx.font = "11px Arial";
    neuralCtx.fillStyle = "#94a3b8";
    const indTexto = estadoJuego === "ENTRENANDO"
        ? `Ind ${indiceIndividuo + 1}/${TAM_POBLACION}`
        : "Modo: Campeón";
    const fitTexto = `Fit: ${ia.fitness.toFixed(1)}`;
    const recTexto = Number.isFinite(mejorFitnessHistorico)
        ? `Best: ${mejorFitnessHistorico.toFixed(1)}`
        : "Best: 0.0";
    neuralCtx.fillText(`${indTexto} · ${fitTexto}`, 14, 42);
    neuralCtx.fillStyle = "#4ade80";
    neuralCtx.fillText(recTexto, 14, 58);

    if (!red) return;

    const etiquetasEntradas = ["Bola X", "Bola Y", "Vel X", "Vel Y"];
    const etiquetasSalidas = ["Izq", "Quieto", "Der"];

    const xEntrada = 22;
    const xOculta = 125;
    const xSalida = 215;

    const yEntradas = [110, 170, 230, 290];
    const yOcultas = [100, 142, 184, 226, 268, 310];
    const ySalidas = [130, 200, 270];

    const salidas = ultimaSalidaRed ? ultimaSalidaRed.salidas : [0, 0, 0];
    const accionActiva = ultimaSalidaRed ? ultimaSalidaRed.accion : 1;

    // entrada
    for (let i = 0; i < red.numEntradas; i++) {
        for (let j = 0; j < red.numOcultas; j++) {
            const peso = red.pesosEntradaOculta[i][j];
            const fuerza = Math.min(1, Math.abs(peso) / 2.5);
            if (fuerza < 0.08) continue;

            neuralCtx.strokeStyle = peso >= 0
                ? `rgba(74, 222, 128, ${0.15 + fuerza * 0.75})`
                : `rgba(248, 113, 113, ${0.15 + fuerza * 0.75})`;
            neuralCtx.lineWidth = 0.8 + fuerza * 2.2;

            neuralCtx.beginPath();
            neuralCtx.moveTo(xEntrada, yEntradas[i]);
            neuralCtx.lineTo(xOculta, yOcultas[j]);
            neuralCtx.stroke();
        }
    }

    // salida
    for (let j = 0; j < red.numOcultas; j++) {
        for (let k = 0; k < red.numSalidas; k++) {
            const peso = red.pesosOcultaSalida[j][k];
            const fuerza = Math.min(1, Math.abs(peso) / 2.5);
            if (fuerza < 0.08) continue;

            neuralCtx.strokeStyle = peso >= 0
                ? `rgba(74, 222, 128, ${0.15 + fuerza * 0.75})`
                : `rgba(248, 113, 113, ${0.15 + fuerza * 0.75})`;
            neuralCtx.lineWidth = 0.8 + fuerza * 2.2;

            neuralCtx.beginPath();
            neuralCtx.moveTo(xOculta, yOcultas[j]);
            neuralCtx.lineTo(xSalida, ySalidas[k]);
            neuralCtx.stroke();
        }
    }

    // nodos entrada
    for (let i = 0; i < etiquetasEntradas.length; i++) {
        neuralCtx.beginPath();
        neuralCtx.arc(xEntrada, yEntradas[i], 5, 0, Math.PI * 2);
        neuralCtx.fillStyle = "#38bdf8";
        neuralCtx.fill();

        neuralCtx.fillStyle = "#e2e8f0";
        neuralCtx.font = "10px Arial";
        neuralCtx.fillText(etiquetasEntradas[i], xEntrada + 8, yEntradas[i] - 7);
    }

    // nodos ocultossss
    for (let j = 0; j < yOcultas.length; j++) {
        neuralCtx.beginPath();
        neuralCtx.arc(xOculta, yOcultas[j], 4.5, 0, Math.PI * 2);
        neuralCtx.fillStyle = "#fbbf24";
        neuralCtx.fill();
    }

    // nodos de salida
    for (let k = 0; k < etiquetasSalidas.length; k++) {
        const esActiva = k === accionActiva;
        neuralCtx.beginPath();
        neuralCtx.arc(xSalida, ySalidas[k], esActiva ? 7 : 5, 0, Math.PI * 2);
        neuralCtx.fillStyle = esActiva ? "#22c55e" : "#64748b";
        neuralCtx.fill();

        neuralCtx.fillStyle = esActiva ? "#4ade80" : "#cbd5e1";
        neuralCtx.font = esActiva ? "bold 11px Arial" : "10px Arial";
        const valStr = typeof salidas[k] === "number" ? ` (${salidas[k].toFixed(1)})` : "";
        neuralCtx.fillText(etiquetasSalidas[k] + valStr, xSalida - 34, ySalidas[k] + 16);
    }

    neuralCtx.fillStyle = "#94a3b8";
    neuralCtx.font = "10px Arial";
    neuralCtx.fillText("Verde: peso +  |  Rojo: peso -", 14, 365);
    neuralCtx.fillStyle = bola.invisible ? "#f87171" : "#4ade80";
    neuralCtx.fillText(bola.invisible ? "Bola invisible (IA usa datos)" : "Bola visible", 14, 385);
}

function pasoEntrenamiento() {
    pasosEpisodio++;

    const centroIA = ia.x + ia.ancho / 2;
    const distanciaX = Math.abs(bola.x - centroIA);
    const cercania = Math.max(0, 1 - distanciaX / (canvas.width / 2));
    const factorDireccion = bola.vy < 0 ? 1.5 : 0.4;

    fitnessPoblacion[indiceIndividuo] += (0.05 + cercania * 0.6) * factorDireccion;
    ia.fitness = fitnessPoblacion[indiceIndividuo];

    moverIA();
    bola.x += bola.vx;
    bola.y += bola.vy;
    bola.invisible = false;

    if (bola.x - bola.radio < 0 || bola.x + bola.radio > canvas.width) {
        bola.vx = -bola.vx;
    }

    // Pared 
    if (bola.y + bola.radio > canvas.height) {
        bola.vy = -Math.abs(bola.vy);
    }

    // Rebote en la IA
    if (
        bola.y - bola.radio <= ia.y + ia.alto &&
        bola.y + bola.radio >= ia.y &&
        bola.x + bola.radio >= ia.x &&
        bola.x - bola.radio <= ia.x + ia.ancho &&
        bola.vy < 0
    ) {
        let puntoImpacto = (bola.x - (ia.x + ia.ancho / 2)) / (ia.ancho / 2);
        puntoImpacto = Math.max(-1, Math.min(1, puntoImpacto));
        bola.vy = Math.abs(bola.vy);
        bola.vx = puntoImpacto * 5;
        bola.y = ia.y + ia.alto + bola.radio;

        fitnessPoblacion[indiceIndividuo] += 75;
        ia.fitness = fitnessPoblacion[indiceIndividuo];
    }

    // Fin del turno 
    if (bola.y + bola.radio < 0 || pasosEpisodio >= MAX_PASOS_EPISODIO) {
        finalizarTurnoEntrenamiento();
    }
}

function actualizar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (estadoJuego === "ENTRENANDO") {
        for (let s = 0; s < PASOS_POR_FRAME_ENTRENAMIENTO; s++) {
            pasoEntrenamiento();
            if (estadoJuego !== "ENTRENANDO") break;
        }
    } else if (estadoJuego === "JUGANDO") {
        moverIA();

        if (teclas.izquierda && jugador.x > 0) {
            jugador.x -= jugador.velocidad;
        }
        if (teclas.derecha && jugador.x + jugador.ancho < canvas.width) {
            jugador.x += jugador.velocidad;
        }

        bola.x += bola.vx;
        bola.y += bola.vy;

        // Invisibilidad
        if (bola.y > 250 && bola.y < 450) {
            bola.invisible = true;
        } else {
            bola.invisible = false;
        }

        if (bola.x - bola.radio < 0 || bola.x + bola.radio > canvas.width) {
            bola.vx = -bola.vx;
        }

        // rebote en la ia
        if (
            bola.y - bola.radio <= ia.y + ia.alto &&
            bola.y + bola.radio >= ia.y &&
            bola.x + bola.radio >= ia.x &&
            bola.x - bola.radio <= ia.x + ia.ancho &&
            bola.vy < 0
        ) {
            let puntoImpacto = (bola.x - (ia.x + ia.ancho / 2)) / (ia.ancho / 2);
            puntoImpacto = Math.max(-1, Math.min(1, puntoImpacto));
            bola.vy = Math.abs(bola.vy);
            bola.vx = puntoImpacto * 5;
            bola.y = ia.y + ia.alto + bola.radio;
        }

        // rebote en jugador
        if (
            bola.y + bola.radio >= jugador.y &&
            bola.y - bola.radio <= jugador.y + jugador.alto &&
            bola.x + bola.radio >= jugador.x &&
            bola.x - bola.radio <= jugador.x + jugador.ancho &&
            bola.vy > 0
        ) {
            let puntoImpacto = (bola.x - (jugador.x + jugador.ancho / 2)) / (jugador.ancho / 2);
            puntoImpacto = Math.max(-1, Math.min(1, puntoImpacto));
            bola.vy = -Math.abs(bola.vy);
            bola.vx = puntoImpacto * 5;
            bola.y = jugador.y - bola.radio;
        }

        if (bola.y + bola.radio < 0) {
            jugador.puntos++;
            reiniciarBolaAlCentro(3);
        } else if (bola.y - bola.radio > canvas.height) {
            ia.puntos++;
            reiniciarBolaAlCentro(-3);
        }
    }

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("IA: " + ia.puntos, 30, 50);
    ctx.fillText("Jugador: " + jugador.puntos, 30, canvas.height - 30);
    ctx.fillStyle = "red";
    ctx.fillRect(ia.x, ia.y, ia.ancho, ia.alto);

    ctx.fillStyle = "white";
    ctx.fillRect(jugador.x, jugador.y, jugador.ancho, jugador.alto);

    if (!bola.invisible) {
        ctx.beginPath();
        ctx.arc(bola.x, bola.y, bola.radio, 0, Math.PI * 2);
        ctx.fillStyle = "yellow";
        ctx.fill();
        ctx.closePath();
    } else {
        ctx.fillStyle = "red";
        ctx.font = "12px Arial";
        ctx.fillText("INVISI-BALL TIME", canvas.width / 2 - 50, 30);
    }

    mostrarVisualizadorNeuralnetwork();
    requestAnimationFrame(actualizar);

    if(!bola.invisible) {
        ctx.fillStyle = "rgba(255, 255, 0, 0.2)";
        ctx.beginPath();
        ctx.arc(bola.x - bola.vx * 1.5, bola.y - bola.vy * 1.5, bola.radio * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "10px Arial";
    ctx.fillText("HACK CLUB PLAYER TWO", canvas.width - 130, canvas.height - 10);


}
actualizar();
