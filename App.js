const app = require('express')()
const morgan = require('morgan')
require('dotenv').config('.env')
const cors = require("cors");

const router = require('./Router/router')
app.use(cors());

app.use(morgan('dev'))

app.use('/app/v1/', router)

module.exports = app