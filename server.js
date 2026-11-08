const express = require("express");
const app = express();

app.use(express.json());

let tickets = [
  { id: 1, titulo: "No imprime", estado: "abierto", prioridad: "alta" },
  { id: 2, titulo: "Correo lento", estado: "cerrado", prioridad: "baja" },
  { id: 3, titulo: "Sin internet", estado: "abierto", prioridad: "media" },
  { id: 4, titulo: "Teclado falla", estado: "abierto", prioridad: "baja" },
];

// Api para consultar tickets
app.get("/api/tickets", (req, res) => {
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
    const idSiguiente = Math.max(0, ...tickets.map(ticket => ticket.id)) + 1
    const fechaAlta = new Date().toLocaleDateString("es-MX");
    const nuevoTicket = {
        id: idSiguiente,
        titulo,
        estado: "abierto",
        prioridad,
        fecha: fechaAlta
    };
    tickets.push(nuevoTicket);
    res.status(201).json(nuevoTicket)
})

// Api para actualizar un ticket
app.put("/api/tickets/:id", (req, res) => {
    const id = Number(req.params.id);
    const ticket = tickets.find(ticket => ticket.id === id);
    if(!ticket){
        return req.status(404).json({
            error: "Ticket no encontrado"
        })
    }
    const { titulo, estado, prioridad } = req.body;
    if(titulo !== undefined) ticket.titulo = titulo;
    if(estado !== undefined) ticket.estado = estado;
    if(prioridad !== undefined) ticket.prioridad = prioridad;
    res.json(ticket)
})

// Api para eliminar un registro
app.delete("/api/tickets/:id", (req, res) => {
    const id = Number(req.params.id);
    const ticket = tickets.find(ticket => ticket.id === id);
    if(!ticket) {
        return res.status(404).json({
            error: "Ticket no encontrado"
        })
    }
    tickets = tickets.filter(ticket => ticket.id !== id);
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