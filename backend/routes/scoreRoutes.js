const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Match = require('../models/Match');
const {
  recordBall,
  undoLastBall,
  editDelivery,
  swapStrike,
  setIncomingBatsman,
  setActiveBowler
} = require('../services/scorerService');
const { rebuildInningsState } = require('../services/replayEngine');
const { broadcastMatchUpdate } = require('../socket/socketHandler');
const { recalculateSeriesPointsTable, syncGlobalPlayerStats } = require('../services/statsService');

// Get all deliveries for a match
router.get('/:matchId/deliveries', async (req, res) => {
  try {
    const { inningsNumber } = req.query;
    const query = { matchId: req.params.matchId };
    if (inningsNumber) query.inningsNumber = parseInt(inningsNumber, 10);

    const deliveries = await Delivery.find(query)
      .sort({ createdAt: 1 })
      .populate('bowler striker nonStriker wicket.playerOut wicket.primaryFielder wicket.assistedBy');

    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record a new ball delivery
router.post('/:matchId/ball', async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await recordBall(matchId, req.body);

    // Broadcast live update to room
    broadcastMatchUpdate(matchId, 'score_updated', {
      match: result.match,
      delivery: result.delivery
    });

    // If match ended after this ball, sync series & player stats
    if (result.match.status === 'Completed') {
      if (result.match.seriesId) {
        await recalculateSeriesPointsTable(result.match.seriesId);
      }
      await syncGlobalPlayerStats();
      broadcastMatchUpdate(matchId, 'match_completed', result.match);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Record ball error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Undo the last ball delivery
router.post('/:matchId/undo', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { inningsNumber } = req.body;
    const result = await undoLastBall(matchId, inningsNumber);

    broadcastMatchUpdate(matchId, 'ball_undone', {
      match: result.match,
      undoneDelivery: result.undoneDelivery
    });

    res.json(result);
  } catch (error) {
    console.error('Undo ball error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Edit historical delivery and replay state
router.put('/delivery/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const result = await editDelivery(deliveryId, req.body);

    broadcastMatchUpdate(result.delivery.matchId.toString(), 'delivery_edited', {
      match: result.match,
      delivery: result.delivery
    });

    res.json(result);
  } catch (error) {
    console.error('Edit delivery error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Manually swap batsman strike
router.post('/:matchId/swap-strike', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { inningsNumber } = req.body;
    const match = await swapStrike(matchId, inningsNumber);

    broadcastMatchUpdate(matchId, 'strike_swapped', match);
    res.json(match);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Set incoming batsman (Supports Double Batting with opposite hand)
router.post('/:matchId/set-batsman', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { playerId, position, isOppositeHand, inningsAttempt } = req.body;

    if (!playerId) {
      return res.status(400).json({ message: 'Player ID is required' });
    }

    const match = await setIncomingBatsman(matchId, {
      playerId,
      position: position || 'striker',
      isOppositeHand: !!isOppositeHand,
      inningsAttempt: inningsAttempt || 1
    });

    broadcastMatchUpdate(matchId, 'batsman_set', match);
    res.json(match);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Set active bowler for current over
router.post('/:matchId/set-bowler', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { bowlerId } = req.body;

    if (!bowlerId) {
      return res.status(400).json({ message: 'Bowler ID is required' });
    }

    const match = await setActiveBowler(matchId, bowlerId);

    broadcastMatchUpdate(matchId, 'bowler_set', match);
    res.json(match);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deterministic rebuild of innings state
router.post('/:matchId/rebuild', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { inningsNumber = 1 } = req.body;

    const result = await rebuildInningsState(matchId, parseInt(inningsNumber, 10));
    broadcastMatchUpdate(matchId, 'state_rebuilt', result.match);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
