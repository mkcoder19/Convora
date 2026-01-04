let IS_PROD = true;
const servers = IS_PROD ?
"https://convorabackend.onrender.com" :
    "http://localhost:8080" 


export default servers;