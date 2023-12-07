require('dotenv').config();

const router = require('express').Router({ mergeParams: true });
const db = require('../controllers/db');
const pool = require('../config/database');
const challonge = require('../controllers/challonge');

/***********************************************
 * Retrieve a tournament's match list.
 ***********************************************/
router.get('/', async (req, res) => {
	const { id } = req.params;
	try {
		const matches = await challonge.matches.index(id);
		// Prints list of participants for tournament being viewed
		console.log('\nMatches List Summary');
		for (let i = 0; i < Object.keys(matches).length; i++) {
			console.log(
				matches[i].match.id,
				matches[i].match.player1Id,
				matches[i].match.player2Id
			);
		}
		res.send(
			`<script>alert("Match list retrieved."); window.location.href = "/tournaments/${id}"; </script>`
		);
	} catch (error) {
		console.error(error);
		res.sendStatus(422);
	}
});

/***********************************************
 * Retrieve a single match record.
 ***********************************************/
router.get('/:matchID', async (req, res) => {
	const { id, matchID } = req.params;
	try {
		const match = await challonge.matches.show(id, matchID);
		console.log(match);
		res.send(
			`<script>alert("Match retrieved."); window.location.href = "/tournaments/${id}"; </script>`
		);
	} catch (error) {
		console.error(error);
		res.sendStatus(422);
	}
});

/***********************************************
 * Update/submit the score(s) for a match.
 ***********************************************/
router.post('/:matchID', async (req, res) => {
	const { id, matchID } = req.params;

	m = await challonge.matches.show(id, matchID);
	c = await challonge.participants.index(id);

	const { winnerID, player1Score, player2Score } = req.body;
	const scoresCsv = `${player1Score}-${player2Score}`;

	for (let i = 0; i < Object.keys(c).length; i++) {
		console.log(c[i].participant.id, c[i].participant.displayName);
		if (c[i].participant.id === m.match.player1Id) {
			player1Name = c[i].participant.displayName;
		}
		if (c[i].participant.id === m.match.player2Id) {
			player2Name = c[i].participant.displayName;
		}
	}

	var play1Rank = await db.getMemberRank(player1Name);
	var play2Rank = await db.getMemberRank(player2Name);

	var newplay1 = play1Rank[0].member_ranking;
	var newplay2 = play2Rank[0].member_ranking;

	var R1 = Math.pow(10, newplay1 / 400);
	var R2 = Math.pow(10, newplay2 / 400);

	var E1 = R1 / (R1 + R2);
	var E2 = R2 / (R1 + R2);

	var S1;
	var S2;

	if (winnerID == m.match.player1Id) {
		S1 = 1;
		S2 = 0;
	} else {
		S1 = 0;
		S2 = 1;
	}

	var player1elo = newplay1 + Math.floor(32 * (S1 - E1));
	var player2elo = newplay2 + Math.floor(32 * (S2 - E2));

	var play1wins = 0 + player1Score;
	var play1loss = 3 - player1Score;
	var play2wins = 0 + player2Score;
	var play2loss = 3 - player2Score;

	try {
		var sql =
			'UPDATE member SET member_wins = member_wins + ?, member_losses = member_losses + ?,member_ranking =  ? WHERE member_username = ?';
		pool.query(
			sql,
			[play1wins, play1loss, player1elo, player1Name],
			function (err, data) {
				if (err) throw err;
				console.log(player1Name + ' updated');
			}
		);
		pool.query(
			sql,
			[play2wins, play2loss, player2elo, player2Name],
			function (err, data) {
				if (err) throw err;
				console.log(player2Name + ' updated');
			}
		);
		const response = await challonge.matches.update(
			id,
			matchID,
			scoresCsv,
			winnerID
		);
		const { match } = response;
		insertGame(match);
		res.send(
			`<script>alert("Success! Updated match results."); window.location.href = "/tournaments/${id}"; </script>`
		);
	} catch (error) {
		console.error(error);
		res.send(
			`<script>alert("Error! Unable to update match results, please try again later."); window.location.href = "/tournaments/${id}"; </script>`
		);
	}
});

async function insertGame(match) {
	console.log('\nMatch to be inserted into DB:');
	console.log(match);
	try {
		[fighter1, fighter2] = await Promise.all([
			db.getMemberAndFighterIDByChallongeParticipantID(match.player1Id),
			db.getMemberAndFighterIDByChallongeParticipantID(match.player2Id),
		]);
		db.insertGame(
			match.state,
			fighter1[0].member_id,
			fighter1[0].member_fighter_id,
			fighter2[0].member_id,
			fighter2[0].member_fighter_id,
			match.winnerId,
			match.loserId,
			match.tournamentId
		);
	} catch (error) {
		console.error(error);
	}
}

/***********************************************
 * Reopen a match.
 ***********************************************/
router.post('/:matchID/reopen', async (req, res) => {
	const { id, matchID } = req.params;
	try {
		await challonge.matches.reopen(id, matchID);
		res.send(
			`<script>alert("Match reopened."); window.location.href = "/tournaments/${tournamentID}"; </script>`
		);
	} catch (error) {
		console.error(error);
		res.sendStatus(422);
	}
});

/***********************************************
 * Mark a match as underway.
 * (Sets "underway_at" to the current time and highlights the match in the bracket)
 ***********************************************/
router.post('/:matchID/mark_as_underway', async (req, res) => {
	const { id, matchID } = req.params;
	try {
		await challonge.matches.markAsUnderway(id, matchID);
		res.send(
			`<script>alert("Match underway."); window.location.href = "/tournaments/${tournamentID}"; </script>`
		);
	} catch (error) {
		console.error(error);
		res.sendStatus(422);
	}
});

/***********************************************
 * Unmark a match as underway.
 * (Clears "underway_at" and unhighlights the match in the bracket)
 ***********************************************/
router.post('/:matchID/unmark_as_underway', async (req, res) => {
	const { id, matchID } = req.params;
	try {
		await challonge.matches.unmarkAsUnderway(id, matchID);
		res.send(
			`<script>alert("Match unmarked underway."); window.location.href = "/tournaments/${tournamentID}"; </script>`
		);
	} catch (error) {
		console.error(error);
		res.sendStatus(422);
	}
});

module.exports = router;
