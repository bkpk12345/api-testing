const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 4000
const corsOptions = {
	exposedHeaders: 'Authorization'
}
app.use(cors(corsOptions))
// app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

require('./routes/route')(app)
// DATABASE CONFIG
let server = app.listen(PORT, () => {
	console.log(`Server Starts...`)
})

module.exports = { app, server }
