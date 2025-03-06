const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8081 }, () => {
    console.log("Signalling server is now listening on port 8081");
});

// Fonction de broadcast qui s'assure d'envoyer du JSON correctement formaté
wss.broadcast = (ws, data) => {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            try {
                const messageString = typeof data === "string" ? data : JSON.stringify(data);
                client.send(messageString);
            } catch (error) {
                console.error("Erreur lors de l'envoi du message:", error);
            }
        }
    });
};

wss.on('connection', ws => {
    console.log(`Client connecté. Total clients connectés: ${wss.clients.size}`);

    ws.on('message', message => {
        try {
            const msg = JSON.parse(message); // Vérifie si le message reçu est bien un JSON
            console.log("Message reçu:", msg);

            wss.broadcast(ws, msg); // Envoie les données en JSON stringifié
        } catch (error) {
            console.error("Erreur de parsing JSON:", error);
        }
    });

    ws.on('close', () => {
        console.log(`Client déconnecté. Total clients connectés: ${wss.clients.size}`);
    });

    ws.on('error', error => {
        console.error("Erreur WebSocket:", error);
    });
});
