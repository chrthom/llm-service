import express from 'express';
import cors from 'cors';
import config from 'config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import process from 'node:process';
import { MsgTypeInbound } from './enums';
import LLMModel from './llm';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['PUT', 'GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: false
  }
});

const llm = new LLMModel();

io.on(MsgTypeInbound.Connect, socket => {
  console.log(`Client connected: ${socket.id}`);
  socket.on(MsgTypeInbound.Disconnect, () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  socket.on(MsgTypeInbound.Chat, (prompt: string) => {
    console.log(`Received prompt via Socket.io: ${prompt}`); ////
  });
});

app.use(express.text());
app.post('/chat', (req, res) => {
  const prompt = JSON.stringify(req.body);
  console.log(`Received prompt via REST: ${prompt}`); ////
  llm.run(prompt).then(response => {
    console.log(`Responding with: ${response}`); ////
    res.send(response);
  }, (rejectionReason) => 
    res.status(500).send(`I am having problems right now: ${rejectionReason}\n`)
  );
});

httpServer.listen(config.get<number>('server.port'), () => {
  console.log(`Server started on stage ${config.get('stage')}`);
});

if (!config.get<boolean>('terminate_on_error')) {
  process.on('uncaughtException', err => {
    console.log(`ERROR: Caught exception: ${err.name} -> ${err.message}${err.stack ? '\n' + err.stack : ''}`);
  });
}
