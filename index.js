const cheerio = require('cheerio')
const axios = require('axios')
const invarient = require('invariant')
const minRaceNum = 1
const maxRaceNum = 11
invarient(process.argv.length === 3 && process.argv[2], 'date is a required argument. e.g. 2019/07/10')
const date = process.argv[2]
const apiUrl = 'https://racing.hkjc.com/racing/information/Chinese/Racing/LocalResults.aspx?RaceDate={date}&RaceNo={raceNum}'
  .replace('{date}', date)
const requestHeaders = {
  'Content-Type': 'text/html; charset=utf-8'
}

const main = async () => {
  const iter = Array.from(Array(maxRaceNum).keys())
  for (let i of iter) {
    const url = apiUrl.replace('{raceNum}', i + 1)
    const response = await axios.get(url, { headers: requestHeaders })
    const headers = await getHeaders(response.data)
    const rows = await getRows(response.data)
    const cols = await getColumns(rows)
    console.log(`${i+1}\n`)
    console.log(generateCSV({ headers, cols }))
  }
}

const getHeaders = async (html) => {
  const $ = cheerio.load(html)
  const $headers = $('div.performance > table > thead > tr')
  return $headers.children('td').map(function (i, elem) { return $(this).text() }).get()
}

const getRows = async (html) => {
  const $ = cheerio.load(html)
  const $rows = $('div.performance > table > tbody')
  return $rows.children('tr').map(function (i, elem) { return $(this) }).get()
}

const getColumns = async (rows) => {
  return rows.map((row, i) => {
    const tds = row.children('td').map(function (i, td) {
      return cheerio(td).text().trim()
    }).get()
    if (tds[9]) {
      tds[9] = tds[9].split('\n')
        .map(e => e.trim())
        .filter(e => (e !== '' && e !== undefined && e !== null))
        .join('-')
    }
    return tds
  })
}

const generateCSV = ({ headers, cols }) => {
  let csv = ''
  csv += headers.join(',')
  csv += '\n'
  cols.forEach(col => {
    csv += col.join(',')
    csv += '\n'
  })
  return csv
}

main().then().catch(err => console.log(err))
