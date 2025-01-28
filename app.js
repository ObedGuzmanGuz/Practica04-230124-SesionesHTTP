import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import moment  from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import os from 'os';



 const app= express();
 const PORT = 3500;


 app.use(cors({
    origin: 'http://localhost:3000', // Cambia esto al dominio permitido
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    credentials: true, // Permite el uso de cookies y credenciales
    }));

//10.10.60.21 -Paco GG
//10.10.60.24 -Charly
//10.10.60.10 -Giovani

 app.use(express.json())

 app.use(express.urlencoded({extended:true}))
 
 const sessions = {}; //sirve para que se almacene las sesiones



 //configuraxion de la sesiones

 app.use(
        session({
        secret:'p4-Obed#OBGF-sessiionesHTTP',
        resave: false, //permite desabilitar los cambios 
        saveUninitialized: false,  //si no esta inicializada que se inicialize
        cookie: {maxAge: 5*60*100}


        })
 )

// Funcion de utilidad que nos permitira acceder a la informacion de la intefaz de red en este caso (LAN)

const getClientIp = (req) => {
    const ip=
        req.headers['x-forwarded-for'] || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress || 
        req.connection.socket?.remoteAddress
        
    
    
};

// Login endpoint

app.post("/login", (req,res)=> {
    
    const {email, nickname , macAddress} = req.body;

    if(!email || !nickname || !macAddress){
        return res.status(400).json({ message: "Se esperan campos requeridos"});
    }


    const sessionID= uuidv4();
    const now = moment().tz('America/Mexico_City'); 


    
    sessions[sessionID]={
        sessionID,
        email,
        nickname,
        macAddress,
        ip:getServerNetworkInfo(),
        createAt: now.format('YYYY-MM-DD HH:mm:ss'), 
        lastAccessed: now.format('YYYY-MM-DD HH:mm:ss'), 

    };

    // req.session[sessionID] = sessionData;
    // activeSessions[sessionID] = sessionData; //Guardar sesion en el almacenamiento de sesiones

    res.status(200).json({
    message:"Se ha logeado de manera exitosa",
    sessionID,

});

});


// Logout endpoint
app.post("/logout", (req, res) => {
    const { sessionID } = req.body;

    // Verificar que se proporcione un sessionID válido
    if (!sessionID || !sessions[sessionID]) {
        return res.status(404).json({
            message: "No se ha encontrado una sesión activa."
        });
    }

    // Eliminar la sesión del almacenamiento en memoria
    delete sessions[sessionID];

    // Intentar destruir la sesión activa
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: "Error al cerrar la sesión."
            });
        }

        // Confirmar el cierre exitoso de la sesión
        res.status(200).json({
            message: "Sesión cerrada exitosamente."
        });
    });
});


// Actualizacion de la Sesion
app.post("/update", (req,res)=>{
    

    const {sessionID, email, nickname }= req.body;
    if(!sessionID || !sessions[sessionID]){
        return res.status(404).json({message:" No existe una sesion activa"});
    }

    if(email) sessions[sessionID].email =email;
    if(nickname) sessions[sessionID].nickname = nickname;
   // sessions[sessionID].lastAccesed= new Date();

   //tiempo de inactividad reiniciarse solo cuando se actualize

    res.status(200).json({
        message:"La sesion se ha actualizado",
        sesion: sessions[sessionID]
    })
    console.log("Sesiones activas:", sessions);
console.log("SessionID proporcionado:", sessionID);

});


//Estatis de la Sesion
const tiemposeson = 2 * 60 * 1000; // 2 minutos en milisegundos
app.get("/status", (req, res) => {
    const sessionID = req.query.sessionID;
    if (!sessionID || !sessions[sessionID]) {
        return res.status(404).json({ message: "No hay sesión activa." });
    }

    const session = sessions[sessionID];
    const nowCDMX = moment().tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');
    const lastAccessed = moment(session.lastAccessed, 'YYYY-MM-DD HH:mm:ss');
    const now = moment();

    // Verificar si la sesión ha expirado
    if (now.diff(lastAccessed) > tiemposeson) {
        delete sessions[sessionID]; // Eliminar sesión vencida
        return res.status(408).json({ message: "La sesión ha expirado por inactividad." });
    }

    // Si la sesión es válida, actualizar la última vez que se accedió
    session.lastAccessed = now.format('YYYY-MM-DD HH:mm:ss');

    res.status(200).json({
        message: "Sesión activa",
        session: session,
        horaActualCDMX: nowCDMX,
        

    });
});

app.get('/',(req,res)=>{
    return res.status(200).json({
        message:"Bienvenido a la API de Control de sesiones",
        author:"Obed Guzman Flores"
    })
})


app.get('/sessions', (req, res) => {
    if (Object.keys(sessions).length === 0) {
        return res.status(404).json({
            message: 'No hay sesiones activas.',
        });
    }
    res.status(200).json({
        message: 'Sesiones activas',
        sessions: Object.values(sessions), 
    });
});





const getServerNetworkInfo = () => {
    const interfaces = os.networkInterfaces()
    for(const name in interfaces){
        for(const iface of interfaces[name]){
            if(iface.family === 'IPv4' && !iface.internal ){
                return{serverIP: iface.address, serverMac: iface.mac}
            }
        }
    }
}

app.listen(PORT, ()=>{
    console.log(`Servidor ejecutandose en http://localhost:${PORT}`);

 })






