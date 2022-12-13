const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const express = require('express'); // added this line
const port = process.env.PORT || 3000;

app.use(express.static('public')); // used express.static instead of app.static

io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });
});

app.post('/action', async (req, res) => {
  // await 63 secondd
  await new Promise(resolve => setTimeout(resolve, 63000));

  res.send('POST request to the homepage');
})

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});