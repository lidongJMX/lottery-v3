const express = require('express');
const multer = require('multer');
const router = express.Router();

const auth = require('../middlewares/auth');
const adminController = require('../controllers/adminController');
const lotteryController = require('../controllers/lotteryController');
const awardController = require('../controllers/awardController');
const participantController = require('../controllers/participantController');
const winnerController = require('../controllers/winnerController');
const prizeController = require('../controllers/prizeController');

// 文件上传配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

// 管理员路由
router.post('/admin/login', adminController.login);

// 抽奖路由
router.post('/lottery/start', auth, lotteryController.start);
router.post('/lottery/stop', lotteryController.stop);
router.post('/lottery/reset', auth, lotteryController.reset);
router.post('/lottery/clearAllData', auth, lotteryController.clearAllData);

router.get('/lottery/winners/latest-round', lotteryController.getLatestWinners);

// 奖项路由
router.get('/awards', awardController.getAll);
router.get('/awards/:id', awardController.getById);
router.post('/awards', awardController.create);
router.put('/awards/:id', awardController.update);
router.delete('/awards/:id', awardController.delete);

// 奖品路由
router.get('/prizes', prizeController.getAll);
router.get('/prizes/:id', prizeController.getById);
router.post('/prizes', prizeController.create);
router.put('/prizes/:id', prizeController.update);
router.delete('/prizes/:id', prizeController.delete);

// 人员路由
router.get('/participants', participantController.getAll);
router.post('/participants/import', participantController.import);
router.get('/participants/lottery', participantController.getLotteryParticipants);


// 中奖记录路由
router.get('/winners', auth, winnerController.getAll);
router.get('/winners/export', winnerController.exportWinners);
router.delete('/winners/:id', winnerController.delete);

module.exports = router;