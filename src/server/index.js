const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const awardsRouter = require('./routes/awards')
const participantsRouter = require('./routes/participants')

const app = express()
const port = 8000

// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 路由
app.use('/api/awards', awardsRouter)
app.use('/api/participants', participantsRouter)

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '服务器内部错误' })
})

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`)
})