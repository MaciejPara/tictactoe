const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const path = require("path");

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});

let moves = [];
let users = [];
let turn = 0;

const makeATurn = () => {
    turn++;
    if (turn >= users.length) turn = 0;
};

io.on("connection", (client) => {
    const checkMoves = (moves) => {
        const wins = ["012", "345", "678", "036", "147", "258", "048", "246"];
        const myMoves = moves.filter((move) => move.user.id === client.id);
        const hisMoves = moves.filter((move) => move.user.id !== client.id);
        console.log("myMoves :: ", myMoves);
        console.log("hisMoves :: ", hisMoves);
        const myRes = wins.find((numbers) =>
            numbers
                .split("")
                .every((i) => myMoves.find((m) => m.move.toString() === i))
        );
        const hisRes = wins.find((numbers) =>
            numbers
                .split("")
                .every((i) => hisMoves.find((m) => m.move.toString() === i))
        );

        const id = myRes
            ? client.id
            : hisRes
            ? moves.find((i) => i.user.id !== client.id)?.user.id
            : null;

        if (id) {
            io.emit("won", id);
            io.emit("wonPath", myRes || hisRes);
        }

        console.log("myRes :: ", myRes, "   hisRes :: ", hisRes, id);
    };

    client.on("play", (id, cb) => {
        if (users.length < 2) {
            users.push({ id: users.length, client: id });
            cb(true);
        } else {
            cb(false);
        }
        if (users[turn]) io.emit("turn", users[turn].client);
        io.emit("users", users.length);
    });

    client.on("move", (move) => {
        moves.push(move);

        io.emit("moves", moves);
        makeATurn();
        checkMoves(moves);
        io.emit("turn", users[turn].client);
    });

    client.on("disconnect", () => {
        users = users.filter(({ client: id }) => id !== client.id);
        moves = [];
    });
});

server.listen();
