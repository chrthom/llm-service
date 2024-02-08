import express from 'express';
import cors from 'cors';
import config from 'config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import process from 'node:process';
import { MsgTypeInbound as MsgType } from './enums';
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

io.on(MsgType.Connect, socket => {
  console.log(`Client connected: ${socket.id}`);
  socket.on(MsgType.Disconnect, () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  socket.on(MsgType.Chat, (prompt: string) => {
    console.log(`Received prompt via Socket.io: ${prompt}`); ////
    llm.run(prompt, (token) => socket.emit(MsgType.Chat, token));
  });
});

app.use(express.text());
app.post('/chat', (req, res) => {
  const prompt = JSON.stringify(req.body);
  console.log(`Received prompt via REST: ${prompt}`); ////
  llm.runAndWait(prompt).then(response => {
    res.send(response);
  }, (rejectionReason) => 
    res.status(500).send(`An error occured: ${rejectionReason}\n`)
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
