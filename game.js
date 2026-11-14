const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const neuralCanvas = document.getElementById("neuralCanvas");
const neuralCtx = neuralCanvas.getContext("2d");

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
    pesoPosicionBola: Math.random() * 2 - 1,
    pesoVelocidadBola: Math.random() * 2 - 1,
    fitness: 0,
    generacion: 1,
    puntos: 0
};

let teclas = {
    izquierda: false,
    derecha: false
}

document.addEventListener("keydown", function(evento) {
    if (evento.key === "ArrowLeft") teclas.izquierda = true;
    if (evento.key === "ArrowRight") teclas.derecha = true;
})

document.addEventListener("keyup", function(evento) {
    if (evento.key === "ArrowLeft") teclas.izquierda = false;
    if (evento.key === "ArrowRight") teclas.derecha = false;
})



// setInterval(function() {
//     bola.invisible = !bola.invisible;
// }, 3000);

function moverIA() {

    let centroIA = ia.x + ia.ancho / 2;


    let distanciaX = bola.x - centroIA; 
    let entradaVelocidadX = bola.vx;


    let decision = (distanciaX * ia.pesoPosicionBola) + (entradaVelocidadX * ia.pesoVelocidadBola);


    if (decision > 5 && ia.x + ia.ancho < canvas.width) {
        ia.x += ia.velocidad;
    } else if (decision < -5 && ia.x > 0) {
        ia.x -= ia.velocidad;
    }

    if (ia.x < 0) ia.x = 0;
    if (ia.x + ia.ancho > canvas.width) ia.x = canvas.width - ia.ancho;
}

function mutarIA() {
    ia.generacion++;
    ia.pesoPosicionBola = Math.random() * 2 - 1;
    ia.pesoVelocidadBola = Math.random() * 2 - 1;

    console.log("Nueva IA", ia.generacion);
}

function mostrarVisualizadorNeuralnetwork() {
    neuralCtx.fillStyle = "#0f172a";
    neuralCtx.fillRect(0, 0, neuralCanvas.width, neuralCanvas.height);

    // ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    // ctx.fillRect(canvas.width - 130, 60, 120, 90);

    neuralCtx.fillStyle = "white";
    neuralCtx.font = "16px Arial";
    neuralCtx.fillText("Cerebro IA (Vivo)", 20, 35);

    neuralCtx.font = "14px Arial";
    neuralCtx.fillStyle = "#38bdf8";
    neuralCtx.fillText("Generación:" + Number(ia.generacion), 20, 65);

    neuralCtx.beginPath(); neuralCtx.arc(50, 120, 8, 0, Math.PI * 2); neuralCtx.fillStyle = bola.invisible ? "red" : "lime"; neuralCtx.fill();
    neuralCtx.fillStyle = "white"; neuralCtx.font = "12px Arial"; neuralCtx.fillText("Bola X", 70, 124);

    neuralCtx.beginPath(); neuralCtx.arc(50, 200, 8, 0, Math.PI * 2); neuralCtx.fillStyle = "lime"; neuralCtx.fill();
    neuralCtx.fillText("Paleta IA", 70, 204);

    neuralCtx.beginPath(); neuralCtx.arc(125, 160, 6, 0, Math.PI * 2); neuralCtx.fillStyle = "orange"; neuralCtx.fill();
    neuralCtx.beginPath(); neuralCtx.arc(125, 240, 6, 0, Math.PI * 2); neuralCtx.fillStyle = "orange"; neuralCtx.fill();

    neuralCtx.beginPath(); neuralCtx.arc(200, 180, 10, 0, Math.PI * 2); neuralCtx.fillStyle = "cyan"; neuralCtx.fill();
    neuralCtx.fillText("Movimiento", 150, 220);

    //para cuando se haga invisible
    neuralCtx.strokeStyle = bola.invisible ? "orange" : "lime";
    neuralCtx.lineWidth = 2;

    neuralCtx.beginPath();
    neuralCtx.moveTo(50, 120); neuralCtx.lineTo(125, 160);
    neuralCtx.moveTo(50, 200); neuralCtx.lineTo(125, 240);
    neuralCtx.moveTo(125, 160); neuralCtx.lineTo(200, 180);
    neuralCtx.moveTo(125, 240); neuralCtx.lineTo(200, 180);
    neuralCtx.stroke();

    neuralCtx.fillStyle = bola.invisible ? "#ec5f5f" : "#30ee76";
    neuralCtx.font = "14px Arial";
    neuralCtx.fillText(bola.invisible ? "Estado: Pensando" : "Estado: Rastreando", 20, 320);

    // ctx.beginPath(); ctx.arc(canvas.width - 110, 95, 4, 0, Math.PI * 2); ctx.fillStyle = bola.invisible ? "red" : "lime"; ctx.fill();
    // ctx.beginPath(); ctx.arc(canvas.width - 110, 115, 4, 0, Math.PI * 2); ctx.fillStyle = "lime"; ctx.fill();
    // ctx.beginPath(); ctx.arc(canvas.width - 60, 150, 5, 0, Math.PI * 2); ctx.fillStyle = "cyan"; ctx.fill();

    // ctx.strokeStyle = bola.invisible ? "orange" : "white";
    // ctx.lineWidth = 1;
    // ctx.beginPath();
    // ctx.moveTo(canvas.width - 110, 95); ctx.lineTo(canvas.width - 60, 105);
    // ctx.moveTo(canvas.width - 110, 115); ctx.lineTo(canvas.width - 60, 150);
    // ctx.stroke();
}

function actualizar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    moverIA();

    if (teclas.izquierda && jugador.x > 0) {
        jugador.x -= jugador.velocidad;
    }

    if (teclas.derecha && jugador.x + jugador.ancho < canvas.width) {
        jugador.x += jugador.velocidad;
    }

    bola.x += bola.vx;
    bola.y += bola.vy;

    if (bola.y > 250 && bola.y < 450) {
        bola.invisible = true;
    } else {
        bola.invisible = false;
    }

    if (bola.x - bola.radio < 0 || bola.x + bola.radio > canvas.width){
        bola.vx = -bola.vx;
    }

    if (bola.y - bola.radio < 0) {
        bola.vy = -bola.vy;
    }
//rebote en la ia
    if (
        bola.y - bola.radio <= ia.y + ia.alto &&
        bola.y + bola.radio >= ia.y &&
        bola.x >= ia.x &&
        bola.x <= ia.x + ia.ancho &&
        bola.vy < 0
    ) {
        bola.vy = Math.abs(bola.vy);
    }
//rebote en jugador
    if (
        bola.y + bola.radio >= jugador.y &&
        bola.y - bola.radio <= jugador.y + jugador.alto &&
        bola.x >= jugador.x &&
        bola.x <= jugador.x + jugador.ancho
    ) {
        bola.vy = -Math.abs(bola.vy)
    }
//reinicio
    // if (bola.y > canvas.height || bola.y < 0) {
    //     mutarIA();
    //     bola.x = canvas.width / 2;
    //     bola.y = canvas.height / 2;
    //     bola.vy = 3;
    // }
    //nuevo reinicio
    if (bola.y > canvas.height) {
        ia.puntos++;
        mutarIA();
        bola.x = canvas.width / 2;
        bola.y = canvas.height / 2;
        bola.vy = 3;
    } else if (bola.y < 0) {
        jugador.puntos++;
        bola.x = canvas.width / 2;
        bola.y = canvas.height / 2;
        bola.vy = 3;
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
