const Match = require('../models/Match');
const Delivery = require('../models/Delivery');
const Player = require('../models/Player');
const { rebuildInningsState } = require('./replayEngine');

/**
 * Check if match is finished and compute winner
 */
function checkMatchConclusion(match) {
  if (match.innings.length < 2) return;

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  const target = inn1.totalRuns + 1;
  const isSecondInningsAllOut = inn2.wickets >= inn2.maxWicketsForInnings;
  const isSecondInningsOversDone = inn2.overs >= match.totalOvers;
  const targetChased = inn2.totalRuns >= target;

  if (targetChased) {
    match.status = 'Completed';
    match.result = {
      winner: inn2.battingTeam,
      margin: `${inn2.maxWicketsForInnings - inn2.wickets} wickets`,
      winType: 'wickets'
    };
  } else if (isSecondInningsAllOut || isSecondInningsOversDone) {
    match.status = 'Completed';
    if (inn2.totalRuns === inn1.totalRuns) {
      match.result = {
        winner: null,
        margin: 'Match Tied',
        winType: 'tie'
      };
    } else if (inn2.totalRuns < inn1.totalRuns) {
      match.result = {
        winner: inn1.battingTeam,
        margin: `${inn1.totalRuns - inn2.totalRuns} runs`,
        winType: 'runs'
      };
    }
  }
}

/**
 * Record a ball delivery in real-time
 */
async function recordBall(matchId, payload) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');

  if (match.status === 'Completed') {
    throw new Error('Match has already completed');
  }

  const inningsNumber = payload.inningsNumber || match.currentInningsNumber;
  let currentInnings = match.innings.find(i => i.inningsNumber === inningsNumber);

  if (!currentInnings) {
    throw new Error(`Innings ${inningsNumber} is not active`);
  }

  const {
    runsOffBat = 0,
    extraType = 'None',
    runningExtraRuns = 0,
    isWicket = false,
    wicket = null,
    bowlerId,
    strikerId,
    nonStrikerId,
    customPenaltyRuns
  } = payload;

  const striker = strikerId || currentInnings.striker;
  const nonStriker = nonStrikerId || currentInnings.nonStriker;
  const bowler = bowlerId || currentInnings.currentBowler;

  if (!striker || !bowler) {
    throw new Error('Striker and Bowler must be selected before scoring a delivery');
  }

  // Calculate penalty extra runs based on MSCA Custom Rules
  let penaltyExtraRuns = 0;
  if (extraType === 'Wide') {
    penaltyExtraRuns = customPenaltyRuns !== undefined 
      ? customPenaltyRuns 
      : (match.customRules?.widePenaltyRuns ?? 1);
  } else if (extraType === 'NoBall') {
    penaltyExtraRuns = customPenaltyRuns !== undefined 
      ? customPenaltyRuns 
      : (match.customRules?.noBallPenaltyRuns ?? 1);
  }

  // Get current over and ball counts from existing deliveries
  const existingDeliveries = await Delivery.find({ matchId, inningsNumber }).sort({ createdAt: 1 });
  let legalBallsInInnings = 0;
  existingDeliveries.forEach(d => {
    if (d.extraType !== 'Wide' && d.extraType !== 'NoBall') {
      legalBallsInInnings++;
    }
  });

  // Consecutive over check: if starting a new over, same bowler cannot bowl consecutive overs if squad > 1
  if (legalBallsInInnings > 0 && legalBallsInInnings % 6 === 0 && existingDeliveries.length > 0) {
    const lastDelivery = existingDeliveries[existingDeliveries.length - 1];
    const lastBowlerId = lastDelivery?.bowler?._id ? lastDelivery.bowler._id.toString() : lastDelivery?.bowler?.toString();
    const currentBowlerId = bowler._id ? bowler._id.toString() : bowler.toString();

    const isTeamABatting = match.teamA.teamId.toString() === currentInnings.battingTeam.toString();
    const fieldingPlayers = isTeamABatting ? match.teamB.players : match.teamA.players;

    if (fieldingPlayers && fieldingPlayers.length > 1 && lastBowlerId && currentBowlerId === lastBowlerId) {
      throw new Error('A bowler cannot bowl two consecutive overs. Please select a different bowler.');
    }
  }

  const overNumber = Math.floor(legalBallsInInnings / 6);
  const ballNumber = (legalBallsInInnings % 6) + 1;

  // Create immutable delivery record
  const delivery = new Delivery({
    matchId,
    inningsNumber,
    overNumber,
    ballNumber,
    bowler,
    striker,
    nonStriker,
    runsOffBat,
    extraType,
    penaltyExtraRuns,
    runningExtraRuns,
    isWicket,
    wicket: isWicket && wicket ? {
      dismissalType: wicket.dismissalType || 'Bowled',
      playerOut: wicket.playerOut || striker,
      bowlerCredit: wicket.bowlerCredit !== undefined ? wicket.bowlerCredit : !['Run Out', 'Retired'].includes(wicket.dismissalType),
      primaryFielder: wicket.primaryFielder || null,
      assistedBy: wicket.assistedBy || null
    } : null
  });

  await delivery.save();

  // Rebuild state deterministically
  const { match: updatedMatch } = await rebuildInningsState(matchId, inningsNumber);
  const targetInnings = updatedMatch.innings.find(i => i.inningsNumber === inningsNumber);

  // Compute strike rotation
  const isLegalBall = extraType !== 'Wide' && extraType !== 'NoBall';
  const newLegalCount = legalBallsInInnings + (isLegalBall ? 1 : 0);
  const isOverComplete = isLegalBall && (newLegalCount % 6 === 0);

  // Physical runs taken by running between wickets
  const physicalRuns = (runsOffBat || 0) + (runningExtraRuns || 0);
  const shouldSwapForRuns = physicalRuns % 2 !== 0;

  let currentStriker = striker;
  let currentNonStriker = nonStriker;

  // Swap strike if odd runs were run
  if (shouldSwapForRuns && currentNonStriker) {
    const temp = currentStriker;
    currentStriker = currentNonStriker;
    currentNonStriker = temp;
  }

  // If over ended, swap strike for the new over
  if (isOverComplete && currentNonStriker) {
    const temp = currentStriker;
    currentStriker = currentNonStriker;
    currentNonStriker = temp;
  }

  // If wicket occurred, handle dismissal
  if (isWicket && wicket) {
    const playerOutId = wicket.playerOut ? wicket.playerOut.toString() : striker.toString();
    if (currentStriker && currentStriker.toString() === playerOutId) {
      currentStriker = null; // Scorer will choose next batsman or double-batting player
    } else if (currentNonStriker && currentNonStriker.toString() === playerOutId) {
      currentNonStriker = null;
    }
  }

  targetInnings.striker = currentStriker;
  targetInnings.nonStriker = currentNonStriker;
  // Clear currentBowler at end of over so new bowler must be selected
  targetInnings.currentBowler = isOverComplete ? null : bowler;

  // Check innings end condition
  const maxWickets = targetInnings.maxWicketsForInnings || (match.customRules?.allOutThresholdType === 'AllPlayersOut' ? 10 : 9);
  const isAllOut = targetInnings.wickets >= maxWickets;
  const isOversFinished = targetInnings.overs >= match.totalOvers;

  if (inningsNumber === 1 && (isAllOut || isOversFinished)) {
    updatedMatch.status = 'Innings Break';
  } else if (inningsNumber === 2) {
    checkMatchConclusion(updatedMatch);
  }

  await updatedMatch.save();

  // Populate references for rich response
  const finalMatch = await Match.findById(matchId).populate([
    { path: 'teamA.teamId' },
    { path: 'teamB.teamId' },
    { path: 'teamA.players' },
    { path: 'teamB.players' },
    { path: 'innings.striker' },
    { path: 'innings.nonStriker' },
    { path: 'innings.currentBowler' },
    { path: 'innings.batsmenStats.player' },
    { path: 'innings.bowlerStats.player' },
    { path: 'innings.fallOfWickets.playerOut' }
  ]);

  return { match: finalMatch, delivery };
}

/**
 * Undo the most recent ball in the current innings
 */
async function undoLastBall(matchId, inningsNumber) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');

  const innNum = inningsNumber || match.currentInningsNumber;
  const lastDelivery = await Delivery.findOne({ matchId, inningsNumber: innNum }).sort({ createdAt: -1 });

  if (!lastDelivery) {
    throw new Error('No deliveries to undo in this innings');
  }

  await Delivery.findByIdAndDelete(lastDelivery._id);

  // Rebuild state deterministically
  const { match: rebuiltMatch } = await rebuildInningsState(matchId, innNum);

  // Restore striker / bowler from the previous delivery if available
  const prevDelivery = await Delivery.findOne({ matchId, inningsNumber: innNum }).sort({ createdAt: -1 });
  const targetInnings = rebuiltMatch.innings.find(i => i.inningsNumber === innNum);

  if (prevDelivery) {
    const allRemainingDels = await Delivery.find({ matchId, inningsNumber: innNum }).sort({ createdAt: 1 });
    let legalB = 0;
    allRemainingDels.forEach(d => {
      if (d.extraType !== 'Wide' && d.extraType !== 'NoBall') legalB++;
    });
    const isPrevOverFinished = legalB > 0 && (legalB % 6 === 0);

    targetInnings.striker = prevDelivery.striker;
    targetInnings.nonStriker = prevDelivery.nonStriker;
    targetInnings.currentBowler = isPrevOverFinished ? null : prevDelivery.bowler;
  }

  if (rebuiltMatch.status === 'Completed' || rebuiltMatch.status === 'Innings Break') {
    rebuiltMatch.status = 'Live';
    rebuiltMatch.result = { winner: null, margin: '', winType: '' };
  }

  await rebuiltMatch.save();

  const finalMatch = await Match.findById(matchId).populate([
    { path: 'teamA.teamId' },
    { path: 'teamB.teamId' },
    { path: 'teamA.players' },
    { path: 'teamB.players' },
    { path: 'innings.striker' },
    { path: 'innings.nonStriker' },
    { path: 'innings.currentBowler' },
    { path: 'innings.batsmenStats.player' },
    { path: 'innings.bowlerStats.player' },
    { path: 'innings.fallOfWickets.playerOut' }
  ]);

  return { match: finalMatch, undoneDelivery: lastDelivery };
}

/**
 * Edit a specific historical delivery and replay state from scratch
 */
async function editDelivery(deliveryId, updateData) {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new Error('Delivery not found');

  // Update allowed fields
  if (updateData.runsOffBat !== undefined) delivery.runsOffBat = updateData.runsOffBat;
  if (updateData.extraType !== undefined) delivery.extraType = updateData.extraType;
  if (updateData.penaltyExtraRuns !== undefined) delivery.penaltyExtraRuns = updateData.penaltyExtraRuns;
  if (updateData.runningExtraRuns !== undefined) delivery.runningExtraRuns = updateData.runningExtraRuns;
  if (updateData.isWicket !== undefined) delivery.isWicket = updateData.isWicket;
  if (updateData.wicket !== undefined) delivery.wicket = updateData.wicket;
  if (updateData.bowler) delivery.bowler = updateData.bowler;
  if (updateData.striker) delivery.striker = updateData.striker;
  if (updateData.nonStriker) delivery.nonStriker = updateData.nonStriker;

  await delivery.save();

  const { match } = await rebuildInningsState(delivery.matchId, delivery.inningsNumber);

  const populatedMatch = await Match.findById(delivery.matchId).populate([
    { path: 'teamA.teamId' },
    { path: 'teamB.teamId' },
    { path: 'teamA.players' },
    { path: 'teamB.players' },
    { path: 'innings.striker' },
    { path: 'innings.nonStriker' },
    { path: 'innings.currentBowler' },
    { path: 'innings.batsmenStats.player' },
    { path: 'innings.bowlerStats.player' },
    { path: 'innings.fallOfWickets.playerOut' }
  ]);

  return { match: populatedMatch, delivery };
}

/**
 * Swap strike between Striker and Non-Striker
 */
async function swapStrike(matchId, inningsNumber) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');

  const innNum = inningsNumber || match.currentInningsNumber;
  const targetInnings = match.innings.find(i => i.inningsNumber === innNum);
  if (!targetInnings) throw new Error('Innings not found');

  const temp = targetInnings.striker;
  targetInnings.striker = targetInnings.nonStriker;
  targetInnings.nonStriker = temp;

  await match.save();

  return Match.findById(matchId).populate([
    { path: 'teamA.teamId' },
    { path: 'teamB.teamId' },
    { path: 'teamA.players' },
    { path: 'teamB.players' },
    { path: 'innings.striker' },
    { path: 'innings.nonStriker' },
    { path: 'innings.currentBowler' },
    { path: 'innings.batsmenStats.player' },
    { path: 'innings.bowlerStats.player' }
  ]);
}

/**
 * Set incoming batsman (Supports Double Batting with opposite hand)
 */
async function setIncomingBatsman(matchId, { playerId, position = 'striker', isOppositeHand = false, inningsAttempt = 1 }) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');

  const innNum = match.currentInningsNumber;
  const targetInnings = match.innings.find(i => i.inningsNumber === innNum);
  if (!targetInnings) throw new Error('Innings not found');

  if (position === 'striker') {
    targetInnings.striker = playerId;
  } else {
    targetInnings.nonStriker = playerId;
  }

  // Check if player has already batted in this innings
  const existingStat = targetInnings.batsmenStats.find(b => 
    b.player.toString() === playerId.toString() && b.inningsAttempt === inningsAttempt
  );

  if (!existingStat) {
    targetInnings.batsmenStats.push({
      player: playerId,
      inningsAttempt: inningsAttempt || 1,
      isOppositeHand: !!isOppositeHand,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissal: 'Not Out'
    });
  }

  await match.save();

  return Match.findById(matchId).populate([
    { path: 'teamA.teamId' },
    { path: 'teamB.teamId' },
    { path: 'teamA.players' },
    { path: 'teamB.players' },
    { path: 'innings.striker' },
    { path: 'innings.nonStriker' },
    { path: 'innings.currentBowler' },
    { path: 'innings.batsmenStats.player' },
    { path: 'innings.bowlerStats.player' }
  ]);
}

/**
 * Set active bowler for the over
 */
async function setActiveBowler(matchId, bowlerId) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');

  const innNum = match.currentInningsNumber;
  const targetInnings = match.innings.find(i => i.inningsNumber === innNum);
  if (!targetInnings) throw new Error('Innings not found');

  targetInnings.currentBowler = bowlerId;

  // Ensure bowler has stats entry
  const existingStat = targetInnings.bowlerStats.find(bw => bw.player.toString() === bowlerId.toString());
  if (!existingStat) {
    targetInnings.bowlerStats.push({
      player: bowlerId,
      overs: 0.0,
      ballsBowled: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0
    });
  }

  await match.save();

  return Match.findById(matchId).populate([
    { path: 'teamA.teamId' },
    { path: 'teamB.teamId' },
    { path: 'teamA.players' },
    { path: 'teamB.players' },
    { path: 'innings.striker' },
    { path: 'innings.nonStriker' },
    { path: 'innings.currentBowler' },
    { path: 'innings.batsmenStats.player' },
    { path: 'innings.bowlerStats.player' }
  ]);
}

module.exports = {
  recordBall,
  undoLastBall,
  editDelivery,
  swapStrike,
  setIncomingBatsman,
  setActiveBowler,
  checkMatchConclusion
};
