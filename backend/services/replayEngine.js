const Match = require('../models/Match');
const Delivery = require('../models/Delivery');
const Player = require('../models/Player');

/**
 * Format dismissal text for scorecards based on dismissal type and participants
 */
function formatDismissalNotation(wicket, bowlerName, primaryFielderName, assistantFielderName) {
  if (!wicket) return 'Not Out';
  const type = wicket.dismissalType;
  const bName = bowlerName || 'Bowler';
  const fName = primaryFielderName || '';
  const aName = assistantFielderName || '';

  switch (type) {
    case 'Bowled':
      return `b ${bName}`;
    case 'Caught':
      return fName ? `c ${fName} b ${bName}` : `c b ${bName}`;
    case 'Caught Behind':
      return fName ? `c †${fName} b ${bName}` : `c †WK b ${bName}`;
    case 'Caught & Bowled':
      return `c & b ${bName}`;
    case 'LBW':
      return `lbw b ${bName}`;
    case 'Stumped':
      return fName ? `st †${fName} b ${bName}` : `st †WK b ${bName}`;
    case 'Run Out':
      if (fName && aName) {
        return `run out (${fName} / ${aName})`;
      } else if (fName) {
        return `run out (${fName})`;
      }
      return 'run out';
    case 'Hit Wicket':
      return `hit wicket b ${bName}`;
    case 'Retired':
      return 'retired out';
    default:
      return 'Out';
  }
}

/**
 * Deterministically rebuilds an innings state from immutable delivery event stream
 */
async function rebuildInningsState(matchId, inningsNumber) {
  const match = await Match.findById(matchId).populate([
    { path: 'teamA.teamId' },
    { path: 'teamB.teamId' },
    { path: 'teamA.players' },
    { path: 'teamB.players' }
  ]);

  if (!match) {
    throw new Error('Match not found');
  }

  const targetInnings = match.innings.find(i => i.inningsNumber === inningsNumber);
  if (!targetInnings) {
    throw new Error(`Innings #${inningsNumber} not found`);
  }

  const deliveries = await Delivery.find({ matchId, inningsNumber })
    .sort({ createdAt: 1 })
    .populate('bowler striker nonStriker wicket.playerOut wicket.primaryFielder wicket.assistedBy');

  // Reset core innings stats
  targetInnings.totalRuns = 0;
  targetInnings.wickets = 0;
  targetInnings.extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
  targetInnings.fallOfWickets = [];

  // Reset batsmen stats runs and balls
  targetInnings.batsmenStats.forEach(b => {
    b.runs = 0;
    b.balls = 0;
    b.fours = 0;
    b.sixes = 0;
    b.isOut = false;
    b.dismissal = 'Not Out';
    b.bowler = null;
    b.fielder = null;
  });

  // Reset bowler stats
  targetInnings.bowlerStats.forEach(bw => {
    bw.ballsBowled = 0;
    bw.overs = 0.0;
    bw.runsConceded = 0;
    bw.wickets = 0;
    bw.maidens = 0;
  });

  let legalBalls = 0;
  // Track maiden overs: map of overNumber -> { bowlerId, legalBalls, runsConcededOffBowler }
  const overTracker = {};

  for (const del of deliveries) {
    const isWide = del.extraType === 'Wide';
    const isNoBall = del.extraType === 'NoBall';
    const isBye = del.extraType === 'Bye';
    const isLegBye = del.extraType === 'LegBye';
    const isIllegal = isWide || isNoBall;

    const totalBallRuns = (del.runsOffBat || 0) + (del.penaltyExtraRuns || 0) + (del.runningExtraRuns || 0);
    targetInnings.totalRuns += totalBallRuns;

    if (!isIllegal) {
      legalBalls++;
    }

    // Extras update
    if (isWide) {
      targetInnings.extras.wides += ((del.penaltyExtraRuns || 0) + (del.runningExtraRuns || 0));
    } else if (isNoBall) {
      targetInnings.extras.noBalls += (del.penaltyExtraRuns || 0);
      if (isBye) targetInnings.extras.byes += (del.runningExtraRuns || 0);
      if (isLegBye) targetInnings.extras.legByes += (del.runningExtraRuns || 0);
    } else if (isBye) {
      targetInnings.extras.byes += (del.runningExtraRuns || 0);
    } else if (isLegBye) {
      targetInnings.extras.legByes += (del.runningExtraRuns || 0);
    }

    // Find or create batsman stats
    let strikerStat = targetInnings.batsmenStats.find(b => 
      b.player.toString() === (del.striker._id ? del.striker._id.toString() : del.striker.toString()) &&
      !b.isOut
    );

    if (!strikerStat) {
      // Find latest entry for this player
      strikerStat = targetInnings.batsmenStats.find(b => 
        b.player.toString() === (del.striker._id ? del.striker._id.toString() : del.striker.toString())
      );
    }

    if (!strikerStat) {
      targetInnings.batsmenStats.push({
        player: del.striker._id || del.striker,
        inningsAttempt: 1,
        isOppositeHand: false,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissal: 'Not Out'
      });
      strikerStat = targetInnings.batsmenStats[targetInnings.batsmenStats.length - 1];
    }

    // Update batsman stats
    if (!isWide) {
      strikerStat.balls += 1;
    }
    if (del.runsOffBat > 0) {
      strikerStat.runs += del.runsOffBat;
      if (del.runsOffBat === 4) strikerStat.fours += 1;
      if (del.runsOffBat === 6) strikerStat.sixes += 1;
    }

    // Find or create bowler stats
    let bowlerStat = targetInnings.bowlerStats.find(bw => 
      bw.player.toString() === (del.bowler._id ? del.bowler._id.toString() : del.bowler.toString())
    );

    if (!bowlerStat) {
      targetInnings.bowlerStats.push({
        player: del.bowler._id || del.bowler,
        overs: 0.0,
        ballsBowled: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0
      });
      bowlerStat = targetInnings.bowlerStats[targetInnings.bowlerStats.length - 1];
    }

    // Bowler balls
    if (!isIllegal) {
      bowlerStat.ballsBowled += 1;
    }

    // Bowler runs conceded: Runs off bat + wide runs + no ball penalty/runs (Byes & LegByes are not charged to bowler)
    let bowlerRunsForBall = del.runsOffBat || 0;
    if (isWide) {
      bowlerRunsForBall += ((del.penaltyExtraRuns || 0) + (del.runningExtraRuns || 0));
    } else if (isNoBall) {
      bowlerRunsForBall += (del.penaltyExtraRuns || 0);
    }
    bowlerStat.runsConceded += bowlerRunsForBall;

    // Track for maiden calculation
    const currentOverIdx = del.overNumber;
    if (!overTracker[currentOverIdx]) {
      overTracker[currentOverIdx] = {
        bowlerId: del.bowler._id ? del.bowler._id.toString() : del.bowler.toString(),
        legalBalls: 0,
        runsConceded: 0
      };
    }
    if (!isIllegal) overTracker[currentOverIdx].legalBalls += 1;
    overTracker[currentOverIdx].runsConceded += bowlerRunsForBall;

    // Wicket processing
    if (del.isWicket && del.wicket) {
      targetInnings.wickets += 1;

      const playerOutId = del.wicket.playerOut._id 
        ? del.wicket.playerOut._id.toString() 
        : del.wicket.playerOut.toString();

      // Find playerOut in batsmanStats
      const outBatsmanStat = targetInnings.batsmenStats.find(b => 
        b.player.toString() === playerOutId && !b.isOut
      ) || targetInnings.batsmenStats.find(b => b.player.toString() === playerOutId);

      const bowlerName = del.bowler.name || '';
      const primaryFielderName = del.wicket.primaryFielder ? del.wicket.primaryFielder.name : '';
      const assistantFielderName = del.wicket.assistedBy ? del.wicket.assistedBy.name : '';

      if (outBatsmanStat) {
        outBatsmanStat.isOut = true;
        outBatsmanStat.dismissal = formatDismissalNotation(del.wicket, bowlerName, primaryFielderName, assistantFielderName);
        outBatsmanStat.bowler = del.bowler._id || del.bowler;
        outBatsmanStat.fielder = del.wicket.primaryFielder ? (del.wicket.primaryFielder._id || del.wicket.primaryFielder) : null;
      }

      if (del.wicket.bowlerCredit) {
        bowlerStat.wickets += 1;
      }

      // Add to Fall of Wickets
      const currentOversFormatted = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
      targetInnings.fallOfWickets.push({
        wicketNumber: targetInnings.wickets,
        score: targetInnings.totalRuns,
        overs: currentOversFormatted,
        playerOut: del.wicket.playerOut._id || del.wicket.playerOut
      });
    }
  }

  // Finalize bowler overs and calculate maidens
  targetInnings.bowlerStats.forEach(bw => {
    const bowlerIdStr = bw.player.toString();
    bw.overs = parseFloat(`${Math.floor(bw.ballsBowled / 6)}.${bw.ballsBowled % 6}`);

    // Count maidens (completed overs of 6 legal balls with 0 runs conceded)
    let maidens = 0;
    Object.values(overTracker).forEach(ov => {
      if (ov.bowlerId === bowlerIdStr && ov.legalBalls >= 6 && ov.runsConceded === 0) {
        maidens++;
      }
    });
    bw.maidens = maidens;
  });

  // Calculate overall team overs
  targetInnings.overs = parseFloat(`${Math.floor(legalBalls / 6)}.${legalBalls % 6}`);

  // Determine current bowler if deliveries exist (cleared if over complete)
  if (deliveries.length > 0) {
    const lastDel = deliveries[deliveries.length - 1];
    const isLastOverFinished = legalBalls > 0 && (legalBalls % 6 === 0);
    targetInnings.currentBowler = isLastOverFinished ? null : (lastDel.bowler._id || lastDel.bowler);
  }

  await match.save();
  return { match, deliveries };
}

module.exports = {
  rebuildInningsState,
  formatDismissalNotation
};
