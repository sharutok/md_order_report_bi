const express = require('express')
const { collect_data } = require('../Controller/report')
const router = express.Router()

router.route('/get-data').get(collect_data)

module.exports = router