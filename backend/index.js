const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const waitingPlayers = [];
const activeRooms = {};

// Function to generate a random 6-digit Game ID
function generateGameID() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit random number
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle matchmaking
  socket.on("find_game", () => {
    if (waitingPlayers.length > 0) {
      const opponentSocket = waitingPlayers.pop();
      const room = `room_${opponentSocket.id}_${socket.id}`;
      const gameID = generateGameID(); // Generate a unique Game ID

      activeRooms[room] = {
        players: [opponentSocket.id, socket.id],
        board: Array(81).fill(""),
        gameID, // Store Game ID in the room data
      };

      socket.join(room);
      opponentSocket.join(room);

      io.to(room).emit("match_found", { room, symbol: "O", gameID });
      io.to(opponentSocket.id).emit("match_found", { room, symbol: "X", gameID });

      console.log(`Match started in room: ${room}, Game ID: ${gameID}`);
    } else {
      waitingPlayers.push(socket);
    }
  });

  // Handle move updates
  socket.on("move", ({ room, board, nextPlayer, lastIndex, forcedBoard, playedIndex }) => {
    if (activeRooms[room]) {
      activeRooms[room].board = board;
  
      io.to(room).emit("update_board", { 
        board, 
        nextPlayer, 
        lastIndex, 
        forcedBoard, 
        playedIndex // Send exact played cell index
      });
    }
  });
  

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    const index = waitingPlayers.findIndex((player) => player.id === socket.id);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
    }

    for (const room in activeRooms) {
      if (activeRooms[room].players.includes(socket.id)) {
        const opponentId = activeRooms[room].players.find((id) => id !== socket.id);
        io.to(opponentId).emit("opponent_left");
        delete activeRooms[room];
        break;
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
