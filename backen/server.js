import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { db } from "./config/db.js";
import { initDb } from "./config/initDb.js";
import { seedSuperAdmin } from "./config/seedSuperAdmin.js";
import { seedMasters } from "./config/seedMasters.js";
import { startPayrollScheduler } from "./modules/superAdmin/payroll/adminPayroll.service.js";

/* CREATE HTTP SERVER */

const server = http.createServer(app);

/* SOCKET SERVER */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET","POST"]
  }
});

/* SOCKET EVENTS */

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.conversationId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});


const startServer = async () => {
  try {

    await db.query("SELECT 1");
    console.log("MySQL Connected");

    await initDb();
    console.log("Database + tables ready");

    await seedSuperAdmin();
    await seedMasters();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startPayrollScheduler();
    });

  } catch (err) {
    console.error("Server start error FULL:", err);
    console.error("Error stack:", err.stack);
    process.exit(1);
  }
};

startServer();

