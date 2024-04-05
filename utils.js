const current_year = new Date().getFullYear()
const _month = {
    "01": 31,
    "02": (current_year % 4 === 0 || current_year % 100 === 0 || current_year % 400 === 0) ? 29 : 28,
    "03": 31,
    "04": 30,
    "05": 31,
    "06": 30,
    "07": 31,
    "08": 31,
    "09": 30,
    "10": 31,
    "11": 30,
    "12": 31,
}

module.exports = _month