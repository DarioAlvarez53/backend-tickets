const express = require("express");
const db = require("./db");

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

// Api para consultar tickets
app.get("/api/tickets", (req, res) => {
    const tickets = db.prepare("SELECT * FROM tickets").all();
    res.json(tickets);
})

// Api para agregar un ticket
app.post("/api/tickets", (req, res) => {
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
app.put("/api/tickets/:id", (req, res) => {
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
app.delete("/api/tickets/:id", (req, res) => {
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

app.get("/", (req, res) => {
  res.send("Servidor de tickets funcionando");
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});