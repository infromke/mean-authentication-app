import app from './app.js'
import env from './config/env.js'

const PORT = env.SERVER_PORT

app.listen(PORT, () => console.log(`[SERVER] up and running at http://localhost:${PORT}`))
