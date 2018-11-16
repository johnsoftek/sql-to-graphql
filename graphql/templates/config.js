'use strict'
module.exports = opts => {
    const typeDefJS = `module.exports = {
  client: '${opts.backend}',
  connection: {
  ${
      opts.backend === 'sqlite'
          ? `      filename: ${opts['db-filename']}`
          : `host: ${opts.host},
  user: ${opts.user},
  password: ${opts.password},
  database: ${opts.db}
`
  }
  }
}`

    return typeDefJS
}