const express = require('express');
const router = express.Router();

// POST /api/realtime/emit
// body: { event: 'name', data: {...}, room?: 'roomName' }
router.post('/emit', (req, res) => {
  const io = req.app.get('io');
  const { event = 'realtime-test', data = {}, room } = req.body || {};
  try{
    if(room && io) io.to(room).emit(event, data);
    else if(io) io.emit(event, data);
    return res.json({ success: true, message: 'Event emitted', event, room });
  }catch(err){
    console.error('Failed to emit event', err);
    return res.status(500).json({ success: false, message: 'Emit failed' });
  }
});

module.exports = router;
