const express = require("express");
const db = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRETO = "123456"

const cantidad = db.prepare(
    "SELECT COUNT(*) AS total FROM tickets"
).get();

if(cantidad.total === 0){
    const insertar = db.prepare(
        "INSERT INTO tickets (titulo, estado, prioridad, fecha) VALUES (?, ?, ?, ?)"
    );
    insertar.run("No imprime", "abierto", "alta", "");
    insertar.run("Correo lento", "cerrado", "baja", "");
    insertar.run("Sin internet", "abierto", "media", "");
    insertar.run("Teclado falla", "abierto", "baja", "");
}

const app = express();
app.use(express.json());

const cors = require("cors");
app.use(cors());

// Middleware para verificar el token de JWT
const verificarToken = (req, res, next) => {
    const auth = req.headers.authorization;
    if(!auth || !auth.startsWith("Bearer ")){
        return res.status(401).json({
            error: "Token no proporcionado"
        })
    }
    const token = auth.split(" ")[1];
    try {
        const datos = jwt.verify(token, SECRETO);
        req.usuario = datos;
        next();
    } catch {
        return res.status(401).json({
            error: "Token invalido o expirado"
        })
    }
}

// Api para consultar tickets
app.get("/api/tickets", verificarToken, (req, res) => {
    const tickets = db.prepare("SELECT * FROM tickets").all();
    res.json(tickets);
})

// Api para agregar un ticket
app.post("/api/tickets", verificarToken, (req, res) => {
    const {titulo, prioridad} = req.body
    if(!titulo || !prioridad) {
        return res.status(400).json({
            error: "Falta titulo o prioridad"
        });
    }
    const fechaAlta = new Date().toLocaleDateString("es-MX");
    const resultado = db.prepare(
        "INSERT INTO tickets (titulo, estado, prioridad, fecha) VALUES (?, ?, ?, ?)"
    ).run(titulo, "abierto", prioridad, fechaAlta);
    const nuevoTicket = db.prepare(
        "SELECT * FROM tickets WHERE id = ?"
    ).get(resultado.lastInsertRowid);
    res.status(201).json(nuevoTicket);
})

// Api para actualizar un ticket
app.put("/api/tickets/:id", verificarToken, (req, res) => {
    const id = Number(req.params.id);
    const ticket = db.prepare(
        "SELECT * FROM tickets WHERE id = ?"
    ).get(id)
    if(!ticket){
        return res.status(404).json({
            error: "Ticket no encontrado"
        })
    }
    const { titulo, estado, prioridad } = req.body;
    const nuevoTitulo =  titulo !== undefined ? titulo : ticket.titulo;
    const nuevoEstado =  estado !== undefined ? estado : ticket.estado;
    const nuevaPrioridad =  prioridad !== undefined ? prioridad : ticket.prioridad;
    db.prepare(
        "UPDATE tickets SET titulo = ?, estado = ?, prioridad = ? WHERE id = ?"
    ).run(nuevoTitulo, nuevoEstado, nuevaPrioridad, id)
    const actualizado = db.prepare(
        "SELECT * FROM tickets WHERE id = ?"
    ).get(id)
    res.json(actualizado)
})

// Api para eliminar un registro
app.delete("/api/tickets/:id", verificarToken, (req, res) => {
    const id = Number(req.params.id);
    const ticket = db.prepare(
        "SELECT * FROM tickets WHERE id = ?"
    ).get(id);
    if(!ticket) {
        return res.status(404).json({
            error: "Ticket no encontrado"
        })
    }
    db.prepare("DELETE FROM tickets WHERE id = ?").get(id);
    res.json({
        mensaje: "Ticket eliminado",
        ticket
    })
})

// Rutas para el login de la pagina
app.post("/api/registro", async (req, res) => {
    const {nombre, email, password} = req.body;
    if(!nombre || !email || !password){
        return res.status(400).json({ error: "Faltan datos"})
    }
    const existe = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(email);
    if(existe) {
        return res.status(400).json({ error: "Ese correo ya esta registrado"})
    }
    const hash = await bcrypt.hash(password, 10);
    const resultado = db.prepare("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)").run(nombre, email, hash);
    const usuario = db.prepare("SELECT id, nombre, email FROM usuarios WHERE id = ?").get(resultado.lastInsertRowid);
    res.status(201).json(usuario);
})

// ruta para el login
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({error: "Faltan datos"});
    }
    const usuario = db.prepare(
        "SELECT * FROM usuarios WHERE email = ?"
    ).get(email);
    if(!usuario) {
        return res.status(401).json({error: "Correo electronico o contraseña incorrectos"});
    }
    const coincide = await bcrypt.compare(password, usuario.password);
    if(!coincide){
        return res.status(401).json({error: "Correo electronico o contraseña incorrectos"})
    }
    const token = jwt.sign({
        id: usuario.id,
        email: usuario.email,
    }, SECRETO, {
        expiresIn: "1h"
    });
    res.json({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        token
    })
})

app.get("/", (req, res) => {
  res.send("Servidor de tickets funcionando");
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});