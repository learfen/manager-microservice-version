var express = require('express');
var app = express();
var fs = require('fs');
var Zip = require("machinepack-zip");
const fileUpload = require('express-fileupload');
const childProcess = require('child_process');
let appUrl = __dirname+"/app"

class Version{
    constructor(meta){
        this.meta = meta
    }
    metaSetter(obj){
        for(let a in obj){
            this.meta[a] = obj[a]
        }
        this.metaSave(this.meta)
    }
    metaSave(meta){
        let metaText = JSON.stringify(meta)
        fs.writeFile('remote.json', metaText, 'utf8', ()=>{
            
        });
    }
    back(res){
        this.active(res, this.meta.prev)
    }
    active(res, version){
        let meta = managerVersion.meta
        const vsetter = ()=>{
            this.metaSetter({"prev": meta.active, "active": version})
        }
        if(version != meta.active && fs.existsSync(__dirname+"/"+version) == true){
            fs.rename(appUrl, __dirname+"/"+meta.active, function(err) {
                if ( err ){
                    remoteHTML.render(res,{"alert":'ERROR: ' + err}); 
                }else{
                    fs.rename(__dirname+"/"+version, appUrl, function(err) { 
                        if ( err ) {
                            remoteHTML.render(res,{"alert":"Error "+err});
                        }else{
                            vsetter()
                            remoteHTML.render(res,{"alert":"Version activada "+version+"..."});
                        }
                    });
                }
            });
        }else{
            remoteHTML.render(res,{"alert":"La version no existe o es esta activa actualmente"});
        }
    }
    static routes(app){
        app.get('/version-active/:v', (req, res)=>{
            managerVersion.active(res, req.params.v)
        })
        
        app.get('/version-back/', (req, res)=>{
            managerVersion.back(res)
        })
        
        app.get('/version-up', (req, res)=>{
            remoteHTML.render(res)
        })
    }
}

class proccessServer{
    constructor(){
        this.server = null
        this.pdi=23104
        this.serversPort = [] 
    }
    start(name, res){
        //let serviceMeta = fs.readFileSync(`./services/${name}/env.json`)
        //JSON.parse(serviceMeta)
        //fs.writeFileSync("./service/env.json", JSON.stringify( {port:3001}) )
        this.server = childProcess.exec(`nodemon ./services/${name}/index.js  --ignore ['node_modules/'] --exec babel-node`,
            (err, stdout, stderr)=>{
                console.log({err, stdout, stderr})
            }
        )
        
        let serviceMeta = JSON.parse( fs.readFileSync(`./services/${name}/env.json`) )
        serviceMeta.pid = this.server.pid
        
        fs.writeFileSync("./service/env.json", JSON.stringify( serviceMeta ) )
        
        setTimeout(()=>{
            remoteHTML.render(res,{"alert":"El server fue encendido<hr>"})
        }, 3000)
    }
    stop(name){
        let serviceMeta = JSON.parse( fs.readFileSync(`./services/${name}/env.json`) )
        childProcess.exec("kill "+serviceMeta.pdi)
        remoteHTML.render(res,{"alert":"El server fue apagado"})
    }
}

let data = fs.readFileSync('remote.json', 'utf8')
var meta = JSON.parse(data); //now it an object
var managerVersion = new Version(meta)
var managerProccess = new proccessServer()

let remoteHTML = {text:fs.readFileSync('remote.html', 'utf8'),
    render(res, p){
        p = p == undefined ? {} : p
        let add = {alert:"", versiones:managerVersion.meta.list, versionActiva:managerVersion.meta.active}
        let d = childProcess.exec("lsof -Pi | grep LISTEN",
            (err, stdout, stderr)=>{
                add.listeners = stdout
                let text = remoteHTML.text
                for(let a in add){
                    add[a]  = p[a] != undefined ? p[a] : add[a]
                }
                for(let a in add){
                    text = text.replace(`$${a}`, add[a])            
                }
                res.send(text)
            }
        )
    }
}

app.get('/', (req, res)=>{
    remoteHTML.render(res)
})

app.get('/services', (req, res)=>{
    // listar servicios  
    res.json()
})

app.get('/server/start/:microservice', (req, res)=>{
    managerProccess.start(req.params.microservice,res)
})
app.get('/server/stop/:pdi', (req, res)=>{
    managerProccess.stop(res, req.params.pdi)
})


app.use(fileUpload());

Version.routes(app)

app.listen(3000, function () {

  console.log('Example app listening on port 3000!');
  
});