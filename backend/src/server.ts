import app from './app.js'

const PORT = process.env.SERVER_PORT || 3001

app.listen(PORT, () =>
  console.log(`[SERVER] up and running at http://localhost:${PORT}`)
)
