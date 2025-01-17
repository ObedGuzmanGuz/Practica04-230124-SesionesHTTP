import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import moment  from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';


 const app= express();
 const PORT = 3500;
 app.use(express.json())

 app.use(express.urlencoded({extended:true}))
 
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
    return (
        req.headers['x-forwarded-for'] || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress || 
        req.connection.socket?.remoteAddress
        
    );
    
};

// Login endpoint

app.post("/login", (req,res)=> {
    console.log(req);
    const {email, nickname , macAddress} = req.body;

    if(!email || !nickname || !macAddress){
        return res.status(400).json({ message: "Se esperan campos requeridos"});
    }


    const sessionID= uuidv4();
    const now = new Date();
    
    session[sessionID]={
        sessionID,
        email,
        nickname,
        macAddress,
        ip:getClientIp(req),
        createAt: now,
        lastAccessed: now,

    };

    res.status(200).json({
    message:"Se ha logeado de manera exitosa",
    sessionID,

});

});


// Logout endpoint

app.get("/logout", (req,res)=>{
    const {sessionID }= req.body;

if(!sessionID || !session[sessionID]){
    return res.status(404).json({
        message: "No se ha encontrado una sesion activa."

    });
}




delete session[sessionID];
req.session.destroy((err) =>{
    if(err) {
        return res.status(500).send("Error al cerra la sesion");
    }


})

res.status(200).json({message: "Logout successful"});

});


// Actualizacion de la Sesion
app.put("/update", (req,res)=>{
    const {sessionID, email, nickname }= req.body;
    if(!sessionID || !session[sessionID]){
        return res.status(404).json({message:" No existe una sesion activa"});
    }

    if(email) session[sessionID].email =email;
    if(nickname) session[sessionID].nickname = nickname;
    session[sessionID].lastAccess= new Date();

    res.status(200).json({
        message:"La sesion se ha actualizado",
        sesion: session[sessionID]
    })

});


//Estatis de la Sesion
app.get("/status",(req,res)=>{
    const sessionID= req.query.sessionID;
    if(!sessionID || !session[sessionID]){
    return res.status(404).json({message:"No hay sesion activa."});

    }

    res.status(200).json({
        message:"Sesion Activa",
        session: session[sessionID]


    })
})

















app.listen(PORT, ()=>{
    console.log(`Servidor ejecutandose en http://localhost:${PORT}`);

 })






