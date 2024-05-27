import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import { Chess } from 'chess.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const chess = new Chess()
let players = {}
let currentPlayer = 'w'

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.render('index', { title: 'chess.com' })
})

io.on('connection', (socket) => {
  console.log('connected:', socket.id)

  if (!players.white) {
    players.white = socket.id
    socket.emit('playerRole', 'w')
  } else if (!players.black) {
    players.black = socket.id
    socket.emit('playerRole', 'b')
  } else {
    socket.emit('spectatorRole', 'spectator')
  }

  socket.on('disconnect', () => {
    if (socket.id === players.white) {
      delete players.white
    } else if (socket.id === players.black) {
      delete players.black
    }
    console.log('disconnected:', socket.id)
  })

  socket.on('move', (move) => {
    try {
      if (chess.turn() === 'w' && socket.id !== players.white) {
        return
      }
      if (chess.turn() === 'b' && socket.id !== players.black) {
        return
      }

      const result = chess.move(move)
      if (result) {
        currentPlayer = chess.turn()
        io.emit('move', move)
        io.emit('boardState', chess.fen())
      } else {
        console.log('Invalid move: ', move)
        socket.emit('invalidMove', move)
      }
    } catch (err) {
      console.log('Error handling move:', err)
      socket.emit('invalidMove', move)
    }
  })
})

server.listen(3000, () => {
  console.log('Server listening on port 3000')
})
