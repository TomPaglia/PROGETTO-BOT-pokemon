const axios= require("axios");
const fs = require('fs');
require('dotenv').config();
//------------------------------------------PARTE EXPRESS/EJS-------------------------------------
const ejs=require('ejs');
const express=require('express');
const app=express();
const port=3000;

app.use(express.urlencoded({
    extended:true
}));

app.use(express.static(__dirname));
app.set("view engine","ejs");

//VARIABILE GLOBALE, LA IMPOSTO IN GETPOKEBYNOMEEJS
let miopokemon={
    nome:"",
    foto:"",
    abilita:"",
    tipo:""
};

app.get("/",function(req,res){
    res.render("pokemon", {pokemon:miopokemon});
});

app.post("/",function(req,res){
    GetPokeDalNomeEJS(req.body.nome)
    res.redirect("/");
});
app.listen(port,()=> console.log(`Attivo sulla porta ${port}`));

//----------------------------------------PARTE COMMANDER----------------------------------------
var program=require('commander');
program
    .version('0.1.0')
    .option('-a, --ability','Trova informazioni sulle abilità')
    .option('-c, --comandi','Elenco comandi DEL BOT NON DEL COMMANDER')
    .parse(process.argv);
const options= program.opts();

console.log("Puoi provare una demo del bot da qui! Inserisci un comando...");
if(options.ability)console.log("Hai scelto abilità");
if(options.comandi) console.log(" \n trova - [nome pokemon] \n mossa - [nome mossa] \n ability - [nome abilità] \n tipo - [nome tipo] elenco pokemon di un certo tipo \n info_tipo - [nome tipo] dettagli del tipo cercato \n pokedex - [nome pokedex] se inserito il nome del pokedex stampa i pokemon di quel pokedex, sennò stampa tutti i nomi dei pokedex \n statistiche_pokemon - [nome pokemon] restituisce il numero di volte che il pokemon è stato cercato \n bacca - [nome bacca/ vuoto per stampare tutte le bacche]");

//-------------------------------------------------------PARTE BOT-------------------------------------------------------
const Telegram_Bot= require("node-telegram-bot-api");
const exp = require("constants");
const token=process.env.token;
url="https://pokeapi.co/api/v2/pokemon/";

const bot = new Telegram_Bot(token,{
    polling:true
});

//------------------------------COMANDI-----------------------------

bot.onText(/\/start/,(msg)=>{
    bot.sendPhoto(msg.chat.id,"C:/Users/133098/Downloads/wllp.jpg",{
        caption: "Benvenuto allenatore! \nScopri il nuovo bot sui Pokemon! Per iniziare prova il comando /trova"
    });
});

bot.onText(/\/trova/,(msg)=>{
    if(msg.text.toString().length>6){
        let nome= msg.text.toString().substring(7).toLowerCase();
        GetPokeDalNome(msg.chat.id, nome);
    } else{ bot.sendMessage(msg.chat.id, "SINTASSI ERRATA");}
});

bot.onText(/\/ability/,(msg)=>{
    if(msg.text.toString().length>8){
        let nome_ab= msg.text.toString().substring(9).toLowerCase();
        GetAbility(msg.chat.id, nome_ab );
    }else{ bot.sendMessage(msg.chat.id, "SINTASSI ERRATA");}
});

bot.onText(/\/tipo/,(msg)=>{
    if(msg.text.toString().length>5){
        let nome_tipo= msg.text.toString().substring(6).toLowerCase();
        GetPokemonByType(msg.chat.id, nome_tipo );
    }else{ bot.sendMessage(msg.chat.id, "SINTASSI ERRATA");}
});

bot.onText(/\/mossa/,(msg)=>{
    if(msg.text.toString().length>6){
        let nome_mossa= msg.text.toString().substring(7).toLowerCase();
        GetMove(msg.chat.id, nome_mossa );
    }else{ bot.sendMessage(msg.chat.id, "SINTASSI ERRATA");}
});

bot.onText(/\/info_tipo/,(msg)=>{
    if(msg.text.toString().length>10){
        let nome_tipo= msg.text.toString().substring(11).toLowerCase();
        GetInfoTipo(msg.chat.id, nome_tipo );
    }else{ bot.sendMessage(msg.chat.id, "SINTASSI ERRATA");}
});

bot.onText(/\/pokedex/,(msg)=>{
    if(msg.text.toString().length>8){
        let regione= msg.text.toString().substring(9).toLowerCase();
        GetPokedex(msg.chat.id, regione );
    } else { ListPokedex(msg.chat.id);}
});

bot.onText(/\/statistiche_pokemon/,(msg)=>{
    if(msg.text.toString().length>20){
        let nome= msg.text.toString().substring(21).toLowerCase();
        bot.sendMessage(msg.chat.id, nome+" è stato cercato " + GetViewedPokemon(nome)+ " volte");
    }else{ bot.sendMessage(msg.chat.id, "SINTASSI ERRATA");}
})

bot.onText(/\/bacca/,(msg)=>{
    if(msg.text.toString().length>6){
        let bacca= msg.text.toString().substring(7).toLowerCase();
        GetBerry(msg.chat.id,bacca);
    }else{ListBerries(msg.chat.id); }
})

//----------------------------VARIABILI GLOBALI PER LA PAGINAZIONE E CALLBACK_QUERY------------------------------
var Pagine;
var array;
var pagina;
var messaggio;
bot.on('callback_query', function (message) {
    var msg = message.message;
    var editOptions = Object.assign({}, getPagination(parseInt(message.data),Pagine.toFixed(0)), { chat_id: msg.chat.id, message_id: msg.message_id});
    bot.editMessageText(messaggio+array.slice(pagina*10, (pagina*10)+10).join(' '), editOptions);
});

//VEDO GLI ERRORI
bot.on("polling_error", console.log);

//----------------------------METODI DEL BOT ED EJS------------------------------

//CREATO AD HOC PER IL FILE EJS
async function GetPokeDalNomeEJS(nome){
    
    const url="https://pokeapi.co/api/v2/pokemon/";
    const new_url=url.concat(nome);
    let res= await axios.get(new_url);
    let dati= res.data;

    //CREO IL POKEMON DA MANDARE NELL'EJS
    miopokemon={
        nome:dati.name,
        foto:dati.sprites.other.home.front_default,
        abilita:dati.abilities[0].ability.name,
        tipo:dati.types[0].type.name
    };
    
    //AGGIORNO FILE JSON
    var data = fs.readFileSync('json/pokemon.json');
    var myObject= JSON.parse(data);
    
    //AGGIUNGO IL MIO NUOVO RECORD AL FILE JSON
    let AddData={"nome": dati.name};
    myObject.push(AddData);
    newMyObj=JSON.stringify(myObject);
    fs.writeFileSync('json/pokemon.json',newMyObj);
    
}

//INFO POKEMON DAL SUO NOME
async function GetPokeDalNome(id,nome){
    
    const url="https://pokeapi.co/api/v2/pokemon/";
    const new_url=url.concat(nome);
    let res= await axios.get(new_url);
    let dati= res.data;
    //VERIFICO SE L'IMMAGINE ESISTA
    if(dati.sprites.other.home.front_default != null)
    {
        bot.sendPhoto(id, dati.sprites.other.home.front_default,{
            caption: "<b>INFO CARTA:</b> \n \n <pre><b>NAME:</b> "+dati.name+" </pre> \n \n <pre><b>ABILITY:</b> <i>"+dati.abilities[0].ability.name+"</i> </pre> \n \n <pre><b>TYPE:</b> "+dati.types[0].type.name+"</pre>\n \n <pre><b>PESO:</b> "+dati.weight/10+"kg</pre> \n \n <pre><b>ALTEZZA:</b> "+dati.height/10+"m</pre>",
            parse_mode:"HTML"
        });
        bot.sendMessage(id, "Usa il comando /ability per scoprire di più sull'abilità di "+dati.name+"!");
    }else 
    {   
        bot.sendMessage(id," IMMAGINE NON TROVATA :( \n \n<b>INFO CARTA:</b> \n \n <pre><b>NAME:</b> "+dati.name+" </pre> \n \n <pre><b>ABILITY:</b> <i>"+dati.abilities[0].ability.name+"</i> </pre> \n \n <pre><b>TYPE:</b> "+dati.types[0].type.name+"</pre>\n \n <pre><b>PESO:</b> "+dati.weight/10+"kg</pre> \n \n <pre><b>ALTEZZA:</b> "+dati.height/10+"m</pre>",
        {parse_mode:"HTML"})
    }
    
    /*AGGIORNO FILE JSON*/
    var data = fs.readFileSync('json/pokemon.json');
    var myObject= JSON.parse(data);
    
    /*AGGIUNGO IL MIO NUOVO RECORD AL FILE JSON*/
    let AddData={"nome": dati.name};
    myObject.push(AddData);
    newMyObj=JSON.stringify(myObject);
    fs.writeFileSync('json/pokemon.json',newMyObj);
    
}

//INFO ABILITY DAL NOME
async function GetAbility(id,nome_abilità)
{
    const url="https://pokeapi.co/api/v2/ability/";
    const new_url=url.concat(nome_abilità);
    let res= await axios.get(new_url);
    let dati= res.data;
    
    //VERIFICO CHE L'EFFETTO SIA IN INGLESE 
    dati.effect_entries.forEach(val => {
        if(val.language.name=="en")
        effetto_ing=val;
    });
    
    bot.sendMessage(id, "<b>DETTAGLI ABILITÀ "+dati.name.toUpperCase()+"</b> \n \n <pre>EFFETTO: "+effetto_ing.effect +"</pre>\n \n <pre>GENERAZIONE D' USCITA: "+dati.generation.name +"</pre>", {parse_mode:"HTML"});

    //AGGIORNO FILE JSON
    var data = fs.readFileSync('json/abilita.json');
    var myObject= JSON.parse(data);
    
    //AGGIUNGO IL MIO NUOVO RECORD AL FILE JSON
    let AddData={"nome": dati.name};
    myObject.push(AddData);
    newMyObj=JSON.stringify(myObject);
    fs.writeFileSync('json/abilita.json',newMyObj);
}

// DETTAGLI DI UNA MOSSA
async function GetMove(id,move_name){
    
    const url="https://pokeapi.co/api/v2/move/";
    const new_url=url.concat(move_name);
    let res= await axios.get(new_url);
    let dati= res.data;
//VERIFICO EFFETTO IN INGLESE
dati.effect_entries.forEach(val => {
    if(val.language.name=="en")
    effetto_ing=val;
});

bot.sendMessage(id, "<b>DETTAGLIO MOSSA " +dati.name.toUpperCase() +"</b> \n \n<pre> Effetto: " +effetto_ing.short_effect +"</pre> \n \n<pre> Accuratezza: " +dati.accuracy +"%</pre> \n \n<pre> Tipo: " +dati.type.name +"</pre> \n \n<pre> Generazione d'uscita: " +dati.generation.name +"</pre>",{parse_mode:"HTML"});
//AGGIORNO FILE JSON
var data = fs.readFileSync('json/mosse.json');
var myObject= JSON.parse(data);

//AGGIUNGO IL MIO NUOVO RECORD AL FILE JSON
let AddData={"nome": dati.name};
myObject.push(AddData);
newMyObj=JSON.stringify(myObject);
fs.writeFileSync('json/mosse.json',newMyObj);    
}

//ELENCO DEI POKEMON DI UN CERTO TIPO 
async function GetPokemonByType(id,type){
    
    const url="https://pokeapi.co/api/v2/type/";
    const new_url=url.concat(type);
    let res= await axios.get(new_url);
    let dati= res.data;
    //CREO ELENCO
    let elenco=[];
    dati.pokemon.forEach(nome => {
        elenco.push("\n"+nome.pokemon.name+"\n")
    });
    Pagine=elenco.length/10;
    array=elenco;
    messaggio= "ELENCO POKEMON TIPO " +dati.name.toUpperCase() +"\n \n"; //MESSAGGIO PER PAGINATION
    bot.sendMessage(id, "ELENCO POKEMON TIPO " +dati.name.toUpperCase() +"\n \n" +elenco.slice(0,10).join(' '),getPagination(1,Pagine.toFixed(0)));
    bot.sendMessage(id, "Usa il comando /info_tipo per scoprire di più sul tipo "+dati.name+"!");

}

//DETTAGLI RELATIVI A UN TIPO PARTICOLARE
async function GetInfoTipo(id,type){
    
    const url="https://pokeapi.co/api/v2/type/";
    const new_url=url.concat(type);
    let res= await axios.get(new_url);
    let dati= res.data;
    //CREO IL MIO ELENCO
    let elenco=" ";
    dati.pokemon.forEach(nome => {
        elenco=elenco+"\n"+nome.pokemon.name+"\n";
    });
    bot.sendMessage(id, "<b>DETTAGLI TIPO " +dati.name.toUpperCase() +"</b>\n \n<pre> Poco efficace contro tipo " +dati.damage_relations.half_damage_to[0].name.toUpperCase() +"</pre> \n \n<pre> Superefficace contro tipo " +dati.damage_relations.double_damage_to[0].name.toUpperCase() +
    "</pre>\n \n<pre> Danno di tipo " +dati.move_damage_class.name.toUpperCase() +"</pre>",{parse_mode:"HTML"});
    
}

//ELENCO POKEDEX ESISTENTI
async function ListPokedex(id){
    
    const url="https://pokeapi.co/api/v2/pokedex";
    let res= await axios.get(url);
    let dati= res.data;
    //CREO ELENCO POKEDEX
    var elenco=[];
    dati.results.forEach(poke => {
        elenco.push(poke.name+"\n");
    });
    Pagine=elenco.length/10;
    array=elenco;
    messaggio="\n POKEDEX DISPONIBILI: \n \n"; //PREPARO IL MESS. X PAGINATION
    bot.sendMessage(id,"\n POKEDEX DISPONIBILI:\n \n "+elenco.slice(0,10).join(' '), getPagination(1,Pagine.toFixed(0)));
    bot.sendMessage(id, "<b>ABBINALI AL COMANDO /pokedex PER OTTENERE DETTAGLI SUI POKEDEX REGIONALI!</b>",{parse_mode:"HTML"});
    
}

//ELENCO POKEMON DI UN CERTO POKEDEX
async function GetPokedex(id,regione){
    
    const url="https://pokeapi.co/api/v2/pokedex/";
    const new_url=url.concat(regione);
    let res= await axios.get(new_url);
    let dati= res.data;
    //PREPARO ELENCO
    let elenco=[];
    dati.pokemon_entries.forEach(poke => {
        elenco.push("\n"+"#"+poke.entry_number+" "+poke.pokemon_species.name+"\n");
    });
    Pagine=elenco.length/10;
    array=elenco;
    messaggio="POKEDEX DELLA REGIONE DI " +dati.name.toUpperCase(); //MESSAGGIO PAGINATION
    bot.sendMessage(id, "POKEDEX DELLA REGIONE DI " +dati.name.toUpperCase() +", GIOCO POKEMON "+dati.version_groups[0].name.toUpperCase()+"\n \n " +elenco.slice(0,10).join(' '),getPagination(1,Pagine.toFixed(0)));
}

//QUANTE VOLTE UN POKEMON VIENE CERCATO ALL TIME
function GetViewedPokemon(nomepokemon){

    //CERCO NEL MIO FILE IL NOME DEL POKEMON
    var data = fs.readFileSync('json/pokemon.json');
    var myObject= JSON.parse(data);
    let count=0;
    myObject.forEach(nome => {
        if(nome.nome==nomepokemon){
            count++;
        }
    });
    return count;
}

//DETTAGLI BACCA
async function GetBerry(id,bacca)
{
    const url="https://pokeapi.co/api/v2/berry/";
    const new_url=url.concat(bacca);
    let res= await axios.get(new_url);
    let dati= res.data;
    
    bot.sendMessage(id, "<b>DETTAGLI BACCA "+dati.name.toUpperCase()+"</b> \n \n <pre>CONSISTENZA: "+dati.firmness.name +"</pre>\n \n <pre>TEMPO DI CRESCITA: "+dati.growth_time +" ore</pre> \n \n <pre>SAPORE: "+dati.flavors[0].flavor.name +"</pre>", 
    {parse_mode:"HTML"});
}

//LISTA BACCHE ESISTENTI 
async function ListBerries(id)
{
    const url="https://pokeapi.co/api/v2/berry/";
    let res= await axios.get(url);
    let dati= res.data;
    //PAGINAZIONE COME IN PRECEDENZA
    var elenco=[];
    dati.results.forEach(bacca => {
        elenco.push(bacca.name+"\n");
    });
    Pagine=elenco.length/10;
    array=elenco;
    messaggio="\n ELENCO BACCHE: \n \n";
    bot.sendMessage(id, "\n ELENCO BACCHE: \n \n "+ elenco.slice(0,10).join(' '), getPagination(1,Pagine.toFixed(0)));
}

//PAGINAZIONE
function getPagination( current, maxpage ) {
var keys = [];
if (current>1) {keys.push({ text: `«1`, callback_data: '1' })};
if (current>2) {keys.push({ text: `<${current-1}`, callback_data: (current-1).toString() })}
keys.push({ text: `-${current}-`, callback_data: current.toString() }); pagina=current-1;
if (current<maxpage-1) {keys.push({ text: `${current+1}>`, callback_data: (current+1).toString() })}
if (current<maxpage) {keys.push({ text: `${maxpage}>`, callback_data: maxpage.toString() })}
return {
    reply_markup: JSON.stringify({
        inline_keyboard: [ keys ]
    })
};
}
