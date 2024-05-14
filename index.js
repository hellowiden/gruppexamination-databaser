// Importera express-modulen
const express = require('express');
// Skapa en Express.js-app
const app = express();
// Ange porten att lyssna på
const port = 3000;

// Definiera en enkel rout för rotvägen
app.get('/', (req, res) => {
    res.send('Välkommen till mitt Express.js-projekt!');
});

// Starta servern och lyssna på den angivna porten
app.listen(port, () => {
    console.log(`Servern är igång och lyssnar på port ${port}`);
});
