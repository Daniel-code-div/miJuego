class Bordes {
    constructor(minX, maxX, minY, maxY) {
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
    }
}

class ObjetoMovil {
    constructor(bordesTablero, elem, vel) {
        this.bordesTablero = bordesTablero;
        this.vel = vel;
        this.elem = elem;
        this.x = parseInt(getComputedStyle(elem).left);
        this.y = parseInt(getComputedStyle(elem).bottom);
        this.ancho = parseInt(getComputedStyle(elem).width);
        this.alto = parseInt(getComputedStyle(elem).height);
    }

    GetBordes() {
        return new Bordes(this.x - this.ancho/2, this.x + this.ancho/2, this.y - this.alto/2, this.y + this.alto/2);
    }

    Resetear() {
        this.ancho = parseInt(getComputedStyle(this.elem).width);
        this.alto = parseInt(getComputedStyle(this.elem).height);
    }
}

class Pelota extends ObjetoMovil {
    constructor(bordesTablero, elem, vel, dirX, dirY, arrastre) {
        super(bordesTablero, elem, vel);
        this.dirX = dirX;
        this.dirY = dirY;
        this.arrastre = arrastre;
    }

    Mover() {
        this.x += this.dirX * this.vel * deltaTime;
        this.y += this.dirY * this.vel * deltaTime;
        this.elem.style.left = this.x + "px";
        this.elem.style.bottom = this.y + "px";
        this.ComprobarRebote();
    }

    ComprobarRebote() {
        if (this.y + this.alto / 2 > this.bordesTablero.maxY && this.dirY > 0) {
            this.RebotarY();
        } else if (this.y - this.alto / 2 < this.bordesTablero.minY && this.dirY < 0) {
            this.RebotarY();
        }
    }

    RebotarX(inerciaY) {
        this.dirX = -this.dirX;
        this.dirY += inerciaY * this.arrastre;
    }

    RebotarY() {
        this.dirY = -this.dirY;
    }

    ComprobarGol() {
        if (this.x - this.ancho / 2 < this.bordesTablero.minX) return 2;
        if (this.x + this.ancho / 2 > this.bordesTablero.maxX) return 1;
        return 0;
    }

    Resetear(vel, x, y, dirX, dirY) {
        this.vel = vel;
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        super.Resetear();
    }
}

class Pala extends ObjetoMovil {
    constructor(bordesTablero, elem, vel, rozamiento, keyCodeArriba, keyCodeAbajo) {
        super(bordesTablero, elem, vel);
        this.moviendose = false;
        this.velActual = 0;
        this.rozamiento = rozamiento;
        this.keyCodeArriba = keyCodeArriba;
        this.keyCodeAbajo = keyCodeAbajo;

        if (keyCodeArriba && keyCodeAbajo) {
            document.addEventListener("keydown", this.IniciarMovimiento.bind(this));
            document.addEventListener("keyup", this.FinalizarMovimiento.bind(this));
        }
    }

    IniciarMovimiento(evento) {
        this.moviendose = true;
        if (evento.key === this.keyCodeArriba) this.velActual = this.vel;
        else if (evento.key === this.keyCodeAbajo) this.velActual = -this.vel;
    }

    FinalizarMovimiento(evento) {
        if (evento.key === this.keyCodeArriba || evento.key === this.keyCodeAbajo) {
            this.moviendose = false;
        }
    }

    Mover() {
        this.y += this.velActual * deltaTime;
        if (this.y + this.alto / 2 > this.bordesTablero.maxY) this.y = this.bordesTablero.maxY - this.alto / 2;
        if (this.y - this.alto / 2 < this.bordesTablero.minY) this.y = this.alto / 2;
        this.elem.style.bottom = this.y + "px";
    }

    Frenar() {
        if (!this.moviendose) {
            this.velActual /= this.rozamiento;
            if (Math.abs(this.velActual) < 0.1) this.velActual = 0;
        }
    }

    ComprobarColision(bordes2) {
        var bordes1 = this.GetBordes();
        return !(
            bordes1.maxX < bordes2.minX ||
            bordes1.minX > bordes2.maxX ||
            bordes1.maxY < bordes2.minY ||
            bordes1.minY > bordes2.maxY
        );
    }
}

class Marcador {
    constructor(elem) {
        this.elem = elem;
        this.puntos = 0;
    }

    GanarPunto() {
        this.puntos++;
        this.elem.innerHTML = "" + this.puntos;
    }
}

// VARIABLES DEL JUEGO
//el 60 va antes de todas las const para que pueda leer de cuanto tiempo va ser el juego
let modoDeJuego = null;
let pala1, pala2, pelota, marcador1, marcador2, cronometroElem;
let deltaTime = 0, time = Date.now();
const duracionJuego = 120; // segundos   
let tiempoRestante = duracionJuego;
let juegoActivo = false;
const escenarioElem = document.querySelector(".escenario");
const bordesTablero = new Bordes(0, 800, 0, 600);
const cuentaRegresivaElem = document.getElementById("cuenta-regresiva")
const contadorInicio = document.getElementById("contador-inicio")
const modalGanador = document.getElementById("modal-ganador")
const mensajeGanador = document.getElementById("mensaje-ganador")


function mostrarCuentaRegresiva() {

    document.getElementById("pantalla-inicial").style.display = "none";
    document.querySelector(".escenario").style.display = "block";
    cuentaRegresivaElem.style.display = "block"

    let count = 3  
    contadorInicio.textContent = count

    const intervalo = setInterval(() => {
        count--
        if (count > 0) {
            contadorInicio.textContent = count
        } else {
            clearInterval(intervalo)
            cuentaRegresivaElem.style.display = "none"
            iniciarJuego()
        }
    }, 1000)
}

// EVENTO PARA INICIAR SEGÚN MODO
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("modo-vs-jugador").addEventListener("click", () => {
        modoDeJuego = "jugador";
        mostrarCuentaRegresiva();
    });
    document.getElementById("modo-vs-pc").addEventListener("click", () => {
        modoDeJuego = "pc";
        mostrarCuentaRegresiva();
    });

    document.getElementById("boton-reiniciar").addEventListener("click", () => {
        location.reload();
    });
});

function iniciarJuego() {
    document.getElementById("pantalla-inicial").style.display = "none";
    document.querySelector(".escenario").style.display = "block";
    document.querySelector(".info-juego").style.display = "flex";

    // INICIALIZAR OBJETOS
    let dir = Math.random() * 2 * Math.PI;
    pelota = new Pelota(bordesTablero, document.querySelector(".pelota"), 300, Math.cos(dir), Math.sin(dir), 0.1);
    pala1 = new Pala(bordesTablero, document.querySelector(".pala1"), 300, 1.15, "a", "z");

    pala2 = (modoDeJuego === "pc")
        ? new Pala(bordesTablero, document.querySelector(".pala2"), 300, 1.15, null, null)
        : new Pala(bordesTablero, document.querySelector(".pala2"), 300, 1.15, "ArrowUp", "ArrowDown");

    marcador1 = new Marcador(document.querySelector(".marcador1"));
    marcador2 = new Marcador(document.querySelector(".marcador2"));
    cronometroElem = document.querySelector(".cronometro");

    // ⏱️ Iniciar tiempo justo aquí
    tiempoRestante = duracionJuego;
    time = Date.now();

    juegoActivo = true;
    requestAnimationFrame(Tick);
}


// LOOP PRINCIPAL
function Tick() {
    deltaTime = (Date.now() - time) / 1000;
    time = Date.now();

    if (juegoActivo) {
        Update();
        requestAnimationFrame(Tick);
    }
}

function Update() {
    pelota.Mover();
    MoverPalas();
    ComprobarPalazo();
    ComprobarGol();
    ActualizarCronometro();
}

function MoverPalas() {
    pala1.Frenar();
    pala1.Mover();

    if (modoDeJuego === "pc") {
        // IA para pala2
        let objetivoY = pelota.y;
        let diferencia = objetivoY - pala2.y;
        pala2.velActual = Math.sign(diferencia) * 200; // velocidad fija
    } else {
        pala2.Frenar();
    }

    pala2.Mover();
}

function ComprobarPalazo() {
    if (pala1.ComprobarColision(pelota.GetBordes()) && pelota.dirX < 0) {
        pelota.RebotarX(pala1.velActual * deltaTime);
    } else if (pala2.ComprobarColision(pelota.GetBordes()) && pelota.dirX > 0) {
        pelota.RebotarX(pala2.velActual * deltaTime);
    }
}

function ComprobarGol() {
    var resultado = pelota.ComprobarGol();
    if (resultado !== 0) {
        if (resultado === 1) marcador1.GanarPunto();
        else marcador2.GanarPunto();
        ReiniciarRonda(resultado);
    }
}

function ReiniciarRonda(ladoGanador) {
    pala1.Resetear();
    pala2.Resetear();
    const dir = ladoGanador === 1 ? 1 : -1;
    pelota.Resetear(300, 400, 300, dir, (Math.random() - 0.5) * 2);
}

function ActualizarCronometro() {
    tiempoRestante -= deltaTime;
    if (tiempoRestante <= 0) {
        tiempoRestante = 0;
        juegoActivo = false;
        FinalizarJuego();
    }

    let segundos = Math.floor(tiempoRestante % 60);
    let minutos = Math.floor(tiempoRestante / 60);
    cronometroElem.textContent = `${minutos}:${segundos.toString().padStart(2, "0")}`;
}

function FinalizarJuego() {
    juegoActivo = false
    let mensaje = "¡Empate!";
    
    if (marcador1.puntos > marcador2.puntos)
        mensaje = modoDeJuego == "pc" ? "¡GANASTE!" : "Jugador 1 Gana"
    else if (marcador2.puntos > marcador1.puntos)
        mensaje = modoDeJuego === "pc" ? "¡La PC gana!" : "¡Jugador 2 gana!"

    mensajeGanador.textContent = mensaje
    modalGanador.style.display = "flex"

}
