class RedNeuronal {
    constructor(numEntradas = 4, numOcultas = 6, numSalidas = 3, copia = null) {
        this.numEntradas = numEntradas;
        this.numOcultas = numOcultas;
        this.numSalidas = numSalidas;

        if (copia) {
            this.pesosEntradaOculta = copia.pesosEntradaOculta.map(fila => [...fila]);
            this.sesgosOculta = [...copia.sesgosOculta];
            this.pesosOcultaSalida = copia.pesosOcultaSalida.map(fila => [...fila]);
            this.sesgosSalida = [...copia.sesgosSalida];
        } else {
            this.pesosEntradaOculta = this._crearMatriz(numEntradas, numOcultas);
            this.sesgosOculta = this._crearArreglo(numOcultas);
            this.pesosOcultaSalida = this._crearMatriz(numOcultas, numSalidas);
            this.sesgosSalida = this._crearArreglo(numSalidas);
        }
    }

    _crearArreglo(tam) {
        return Array.from({ length: tam }, () => Math.random() * 2 - 1);
    }

    _crearMatriz(filas, cols) {
        return Array.from({ length: filas }, () => this._crearArreglo(cols));
    }

    _limitar(valor, min = -5, max = 5) {
        return Math.max(min, Math.min(max, valor));
    }

    predict(entradas) {
        // 1. Capa oculta con activación tanh
        const ocultas = Array.from({ length: this.numOcultas }, (_, j) => {
            let suma = this.sesgosOculta[j];
            for (let i = 0; i < this.numEntradas; i++) {
                suma += entradas[i] * this.pesosEntradaOculta[i][j];
            }
            return Math.tanh(suma);
        });

        // 2. Capa de salida con activación tanh
        const salidas = Array.from({ length: this.numSalidas }, (_, k) => {
            let suma = this.sesgosSalida[k];
            for (let j = 0; j < this.numOcultas; j++) {
                suma += ocultas[j] * this.pesosOcultaSalida[j][k];
            }
            return Math.tanh(suma);
        });

        // 3. Elegir el índice de salida con valor más alto (0: izq, 1: quieto, 2: der)
        let mejorIndice = 0;
        for (let k = 1; k < salidas.length; k++) {
            if (salidas[k] > salidas[mejorIndice]) {
                mejorIndice = k;
            }
        }

        return {
            entradas,
            ocultas,
            salidas,
            accion: mejorIndice
        };
    }

    clonar() {
        return new RedNeuronal(
            this.numEntradas,
            this.numOcultas,
            this.numSalidas,
            this
        );
    }

    mutar(probabilidad = 0.25, magnitud = 0.3) {
        const mutarValor = (v) => {
            if (Math.random() < probabilidad) {
                const delta = (Math.random() * 2 - 1) * magnitud;
                return this._limitar(v + delta);
            }
            return v;
        };

        this.pesosEntradaOculta = this.pesosEntradaOculta.map(fila => fila.map(mutarValor));
        this.sesgosOculta = this.sesgosOculta.map(mutarValor);
        this.pesosOcultaSalida = this.pesosOcultaSalida.map(fila => fila.map(mutarValor));
        this.sesgosSalida = this.sesgosSalida.map(mutarValor);
    }

    toJSON() {
        return {
            numEntradas: this.numEntradas,
            numOcultas: this.numOcultas,
            numSalidas: this.numSalidas,
            pesosEntradaOculta: this.pesosEntradaOculta,
            sesgosOculta: this.sesgosOculta,
            pesosOcultaSalida: this.pesosOcultaSalida,
            sesgosSalida: this.sesgosSalida
        };
    }

    static fromJSON(data) {
        const red = new RedNeuronal(data.numEntradas, data.numOcultas, data.numSalidas);
        red.pesosEntradaOculta = data.pesosEntradaOculta.map(fila => [...fila]);
        red.sesgosOculta = [...data.sesgosOculta];
        red.pesosOcultaSalida = data.pesosOcultaSalida.map(fila => [...fila]);
        red.sesgosSalida = [...data.sesgosSalida];
        return red;
    }
}