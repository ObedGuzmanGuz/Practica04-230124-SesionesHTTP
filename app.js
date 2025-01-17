import express from 'express';
import session from 'express-session';
import moment  from 'moment-timezone';

const app= express(); //HABILITA EL USO DE LOS VERBOS HTTP, GET, PST, PATHC,DELETE, ECT

//La configuracion de las sesiones
app.use(
    session({
        secret:'p3-Obed#OBGF-sessiionespersistentes',
        resave: false, //permite desabilitar los cambios 
        saveUninitialized: true,  //si no esta inicializada que se inicialize
        cookie: {maxAge: 24*60*60*100}
    })
)


//Ruta para inicializar la sesion
app.get('/iniciar-sesion', (req,res)=>{
    if(!req.session.inicio){
        req.session.inicio= new Date(); //Fecha de inicio de sesion
        req.session.ultimoacceso= new Date(); //Ultima consulta inicial
        res.send('Sesion iniciada')
        
    }else{
        res.send('La sesion ya esta activa')
    }
});


// Ruta para actulizar la fecha de última consulta
app.get('/actualizar', (req,res )=>{
    if(req.session.inicio){
        req.session.ultimoAcceso = new Date();
        res.send('Fecha de última consulta actualizada');
    }else{
        res.send('No hay una sesion activa');

    }

})


 // Duración máxima de inactividad (en milisegundos)
 const TIEMPO_INACTIVIDAD_MAX = 5 * 60 * 1000; // 5 minutos
 

 // Middleware para controlar inactividad
 app.use((req, res, next) => {
   const ahora = Date.now();
 
   // Si no hay registro de actividad previa, inicializarlo
   if (!req.session.ultimaActividad) {
     req.session.ultimaActividad = ahora;
     return next();
   }
 
   // Calcular tiempo de inactividad
   const tiempoInactivo = ahora - req.session.ultimaActividad;
 
   // Si excede el tiempo máximo permitido, destruir la sesión
   if (tiempoInactivo > TIEMPO_INACTIVIDAD_MAX) {
     req.session.destroy(err => {
       if (err) {
         return res.status(500).send('Error al cerrar sesión por inactividad.');
       }
       return res.status(401).send('Sesión cerrada por inactividad.');
     });
   } else {
     // Si no excede, actualizar el tiempo de última actividad
     req.session.ultimaActividad = ahora;
     next();
   }
 });
 

//Ruta para ver el estado de la sesion 
app.get('/estado-sesion', (req,res)=>{

    if(req.session.inicio){
        const inicio = new Date(req.session.inicio);
        const ultimoAcceso = new Date(req.session.ultimoAcceso);
        const ahora = new Date();

        // Calcular la antiguedad de la SESION
        const antiguedadMS= ahora - inicio;
        const horas= Math.floor(antiguedadMS/(1000*60*60));
        const minutos=Math.floor(antiguedadMS%(1000*60*60)/(1000*60));
        const segundos =Math.floor(antiguedadMS%(1000*60)/1000);
     
        //Convertimos las fechas al huso horario CDMX
        const inicioCDMX= moment(inicio).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');
        const ultimoCDMX= moment(ultimoAcceso).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');
        

        res.json({
            mensaje: 'Estado de la sesion',
            sesionID: req.sessionID,
            Fehca_inicio_Sesion: inicioCDMX,
            ultimoAcceso: ultimoCDMX,
            Duracion_dela_sesion_: `${horas} horas, ${minutos} minutos, ${segundos} segundos`
        });

    } else {
        res.send ('No hay una sesion activa.')
    }
});

// Ruta para cerrar la sesion
 app.get('/cerrar-sesion', (req,res)=>{
    if(req.session){
        req.session.destroy((err)=>{
            if(err){
                return res.status(500).send('Error al cerrar ka sesion.');
            }
            res.send('Sesion cerrada correctamente.');
        });
    }else {
        res.send('No hay una sesion activa para cerrar.');
    }
 }); 

 //inicializar el servidor

 const PORT = 3000;

 app.listen(PORT, ()=>{
    console.log(`Servidor ejecutandose en http://localhost:${PORT}`);



 })
