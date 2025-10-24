const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config();
connectDB();
const app = express();

app.use(express.json()); // to accept json data

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------deployment------------------------------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}
// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

// NEW: Keep track of all online users' IDs
let onlineUsers = new Set();

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  // MODIFIED: Store user ID on the socket for easier disconnect handling
  // We removed the 'setupUserId' variable which was scoped inside the 'setup' event
  socket.on("setup", (userData) => {
    // NEW: Store the user's ID on the socket object itself
    socket.userId = userData._id;
    socket.join(userData._id);
    // NEW: Add user to our set of online users
    onlineUsers.add(userData._id);
    // NEW: Broadcast the updated list of online users to ALL clients
    io.emit("get online users", Array.from(onlineUsers));
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (data) => {
    if (!data || !data.room || !data.user) return;
    socket.in(data.room).emit("typing", data.user);
  });

  socket.on("stop typing", (data) => {
    if (!data || !data.room || !data.user) return;
    socket.in(data.room).emit("stop typing", data.user);
  });

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  // MODIFIED: Cleaned up disconnect logic
  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
    // NEW: Check if the user was properly set up
    if (socket.userId) {
      // NEW: Remove the user from the online set
      onlineUsers.delete(socket.userId);
      // NEW: Leave the user's personal room
      socket.leave(socket.userId);
      // NEW: Broadcast the updated list to ALL clients
      io.emit("get online users", Array.from(onlineUsers));
    }
  });
});