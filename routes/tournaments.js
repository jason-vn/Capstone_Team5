require('dotenv').config();

const router = require('express').Router();
const { check, validationResult } = require('express-validator');
const db = require('../controllers/db');
const challonge = require('../controllers/challonge');
const moment = require('moment-timezone');

/***********************************************
Displaying Upcoming Tournaments Page
***********************************************/
router.get('/', async (req, res) => {
	let tournaments;
	try {
		console.log('Pulling tournaments from Challonge');
		tournaments = await challonge.tournaments.index();
	} catch (error) {
		console.error(error);
	}
	// Check if Challonge is responding otherwise failover and get tournaments from database
	if (tournaments) {
		tournaments = Object.values(tournaments).map((t) => t);
		tournaments = filterUpcomingTournaments(tournaments);
		res.render('tournaments', {
			tournaments: tournaments,
			db: false,
			ID: req.session.userID,
			role: req.session.role,
			username: req.session.username,
		});
	} else {
		// Pull tournaments from database
		try {
			console.log('Failover! Pulling tournaments from database');
			tournaments = await db.getUpcomingTournaments();
		} catch (error) {
			console.error(error);
			return res.sendStatus(500);
		}
		res.render('tournaments', {
			tournaments: tournaments,
			db: true,
			ID: req.session.userID,
			role: req.session.role,
			username: req.session.username,
		});
	}
});

// Sorting Upcoming Tournaments (ascending order - sooner tournaments shown first)
function filterUpcomingTournaments(arr) {
	return arr
		.filter((t) => {
			let start = t.tournament.startAt;
			start = new Date(start).toISOString().substring(0, 10);
			const now = new Date().toISOString().substring(0, 10);
			return start >= now ? true : false;
		})
		.sort((a, b) => {
			return a.tournament.startAt < b.tournament.startAt ? -1 : 1;
		});
}

/***********************************************
Rendering Create New Tournament Page
***********************************************/
router.get('/new', (req, res) => {
	// Not logged in -> send to login
	if (!req.session.userID) {
		res.redirect('../login');
	} else {
		// Logged in -> allow
		res.render('create_tournament', {
			ID: req.session.userID,
			username: req.session.username,
			role: req.session.role,
		});
	}
});

/***********************************************
Create New Tournament
***********************************************/
router.post(
	'/create',
	[
		check('tname').notEmpty().withMessage('Tournament name cannot be empty'),
		check('startdate')
			.notEmpty()
			.withMessage('Tournament start date cannot be empty'),
		check('starttime')
			.notEmpty()
			.withMessage('Tournament start time cannot be empty'),
		check('checkin')
			.notEmpty()
			.withMessage('Tournament check-in duration cannot be empty'),
	],
	async function (req, res) {
		if (!req.session.userID) {
			console.error('Session does not exist');
			res.redirect('/login');
		} else {
			// Store user input
			const { userID, username } = req.session;
			const { tname, format, checkin, startdate, starttime, timezone } =
				req.body;
			const checkIn = checkin === 'Do not require check-in' ? null : checkin;
			const startAt = `${startdate} ${starttime}`;
			// Convert tournament startAt to UTC for Challonge request, Central Time for DB
			const startAtUTC = moment.tz(startAt, timezone).utc().format();
			const startAtCentral = moment.tz(startAtUTC, 'America/Chicago').format();
			const startAtDB =
				startAtCentral.slice(0, 10) + ' ' + startAtCentral.slice(11, 19);
			console.log(
				`client startAt: ${startAt} ${timezone}\nUTC startAt: ${startAtUTC}\nCT startAt: ${startAtCentral}\nDB startAt:${startAtDB}`
			);
			// Validate start date is within current season
			let seasonID, seasonStart, seasonEnd;
			try {
				const result = await db.getCurrentSeason();
				seasonID = result[0].season_id;
				seasonStart = result[0].season_start.toISOString().substring(0, 10);
				seasonEnd = result[0].season_end.toISOString().substring(0, 10);
			} catch (error) {
				console.error(error);
				return res.redirect('/tournaments/new');
			}
			if (startdate < seasonStart || startdate > seasonEnd) {
				// Start date is not within current season
				console.error(
					`Tournament start date ${startAt} is not valid for current season ${seasonStart} to ${seasonEnd}`
				);
				return res.redirect('/tournaments/new');
			}
			try {
				const response = await challonge.tournaments.create(
					tname,
					startAtUTC,
					checkIn,
					format
				);
				if (!response.tournament) {
					// Failed creating challonge tournament
					console.error('Did not receive tournament response from Challonge.');
					res.redirect('/tournaments');
				} else {
					console.log('Challonge tournament created');
					// Send tournament to database
					const challongeID = response.tournament.id;
					const state = response.tournament.state;
					const result = await db.insertTournament(
						userID,
						format,
						tname,
						checkIn,
						state,
						startAtDB,
						seasonID,
						challongeID
					);
					console.log('Database tournament created');
					res.redirect(`/tournaments/${challongeID}`);
				}
			} catch (error) {
				// Unsuccessful -> Return to Tournament Creation page
				console.error('Unsuccessful tournament creation.\n', error);
				res.redirect('/tournaments/new');
			}
		}
	}
);

/***********************************************
 * Process Check-ins
 ***********************************************/
router.post('/:id/processCheckIns', async (req, res) => {
	const { id } = req.params;
	let state;
	try {
		const response = await challonge.tournaments.processCheckIns(id);
		state = response.tournament.state;
	} catch (error) {
		console.error(error);
		return res.sendStatus(422);
	}
	if (state) {
		try {
			// Update tournament state in database if tournament processCheckIns was successful
			await db.updateTournamentStateByChallongeID(state, id);
			res.send(
				`<script>alert("Processed check-ins."); window.location.href = "/tournaments/${id}"; </script>`
			);
		} catch (error) {
			console.error(error);
			res.sendStatus(500);
		}
	}
});

/***********************************************
 * Abort Check-ins
 ***********************************************/
router.post('/:id/abortCheckIn', async (req, res) => {
	const { id } = req.params;
	let state;
	try {
		const response = await challonge.tournaments.abortCheckIn(id);
		state = response.tournament.state;
	} catch (error) {
		console.error(error);
		return res.sendStatus(422);
	}
	if (state) {
		try {
			// Update tournament state in database if tournament aborCheckIn was successful
			await db.updateTournamentStateByChallongeID(state, id);
			res.send(
				`<script>alert("Check-in aborted."); window.location.href = "/tournaments/${id}"; </script>`
			);
		} catch (error) {
			console.error(error);
			res.sendStatus(500);
		}
	}
});

/***********************************************
Viewing specific tournament details page
***********************************************/
router.get('/:id', async (req, res) => {
	const tournamentID = req.params.id;
	const { userID, username } = req.session;
	const dashes = '----------------------------------------';
	console.log(dashes);
	console.log('Tournament ID:', tournamentID);
	let tournament, matches, participants, partID;
	let currentMatch = {};
	let pullFromDB = false;
	try {
		[t, m, p] = await Promise.all([
			challonge.tournaments.show(tournamentID),
			challonge.matches.index(tournamentID),
			challonge.participants.index(tournamentID),
		]);
		tournament = t;
		matches = m;
		participants = p;
		console.log('\nParticipants:');
		for (const p of Object.values(participants)) {
			console.log(p.participant.id, p.participant.name);
			// Match current session's username to existing participant and set partID to their Challonge participantID if matched
			if (p.participant.name == username) {
				partID = p.participant.id;
				console.log('Matched Unique ID = ', partID, p.participant.name);
			}
		}
		console.log('\nMatches:');
		for (const m of Object.values(matches)) {
			console.log(m.match.id, m.match.state);
			if (
				m.match.state === 'open' &&
				(m.match.player1Id === partID || m.match.player2Id === partID)
			) {
				currentMatch.id = m.match.id;
				currentMatch.player1Id = m.match.player1Id;
				currentMatch.player2Id = m.match.player2Id;
			}
		}
		console.log('\nCurrent Match:', currentMatch);
		if (!currentMatch || Object.keys(currentMatch) == 0) {
			// set currentMatch to null if user does not have any open matches or is not logged in
			currentMatch = null;
		} else {
			for (const p of Object.values(participants)) {
				if (p.participant.id === currentMatch.player1Id) {
					currentMatch.player1Name = p.participant.name;
					console.log(
						'Matched Player 1 ID:',
						p.participant.id,
						'Name:',
						p.participant.name
					);
				}
				if (p.participant.id === currentMatch.player2Id) {
					currentMatch.player2Name = p.participant.name;
					console.log(
						'Matched Player 2 ID:',
						p.participant.id,
						'Name:',
						p.participant.name
					);
				}
			}
			console.log('\nUpdated Current Match:', currentMatch);
		}
	} catch (error) {
		console.error(error);
		tournament = null;
		pullFromDB = true;
	}
	console.log(dashes);
	// Failover attempt to pull tournament details from DB
	if (pullFromDB) {
		try {
			console.log(`Failover! Pulling tournament ${tournamentID} from database`);
			req.params.db = true;
			tournament = await db.getTournamentByChallongeID(tournamentID);
			participants = await db.getParticipants(tournamentID);
			entrants = Object.keys(participants).length;
			tournament[0].participants_count = entrants;
		} catch (error) {
			console.error(error);
			return res.send(
				`<script>alert("Error! Unable to get tournament details, please try again later."); window.location.href = "/tournaments"; </script>`
			);
		}
	}
	if (!tournament) {
		// Tournament not found
		return res.send(
			`<script>alert("Error! Tournament not found."); window.location.href = "/tournaments"; </script>`
		);
	}
	// Tournament details found
	res.render('show_tournament', {
		uniqueID: partID,
		tournament: tournament,
		match: currentMatch,
		db: req.params.db,
		ID: req.session.userID,
		role: req.session.role,
		username: req.session.username,
		role: req.session.role,
	});
});

/***********************************************
 * Delete Tournament (Sends StatusCode)
 ***********************************************/
router.delete('/:id', async (req, res) => {
	if (!req.session.userID) {
		console.error('Session does not exist, redirecting to login page');
		return res.redirect('/login');
	}
	const { id } = req.params;
	let tournament;
	try {
		tournament = await challonge.tournaments.show(id);
		if (Object.keys(tournament).length == 0) {
			console.error(`Unable to find tournament ${id}`);
			return res.sendStatus(404);
		}
		// delete from Challonge
		await challonge.tournaments.destroy(id),
			console.log(`Deleted tournament ${id} from Challonge`);
		res.sendStatus(200);
	} catch (error) {
		console.error(error);
		return res.sendStatus(422);
	}
	// delete from database
	try {
		await Promise.all([
			db.deleteTournamentByChallongeID(id),
			db.deleteParticipantsByChallongeTournamentID(id),
			db.deleteGamesByTournamentID(id),
		]);
		console.log(`Deleted tournament ${id} from database`);
	} catch (error) {
		console.error(error);
	}
});

/***********************************************
Start Tournament
----------------
Creates client connection and sends start call to challonge API
Will change status of tournament to "Underway". May need to add processCheckIn call
to handle registered players not currently checked in.
***********************************************/
router.post('/:id/start', async (req, res) => {
	const { id } = req.params;
	try {
		const participants = await challonge.participants.index(id);
		if (Object.keys(participants).length < 2) {
			console.log('[ERROR]', 'Not Enough Participants to begin');
			res.send(
				`<script>alert("Not enough participants to begin."); window.location.href = "/tournaments/${id}"; </script>`
			);
			return res.sendStatus(422);
			
		}
	} catch (error) {
		console.error(error);
		return res.sendStatus(500);
	}
	let state;
	try {
		const response = await challonge.tournaments.start(id);
		state = response.tournament.state;
	} catch (error) {
		console.error(error);
		res.send(
			`<script>alert("Please Process check-ins before starting tournament."); window.location.href = "/tournaments/${id}"; </script>`
		);
		return res.sendStatus(500);
	}
	if (state) {
		try {
			// Update tournament state in database if tournament start was successful
			await db.updateTournamentStateByChallongeID(state, id);
			res.send(
				`<script>alert("Tournament is Now Underway!"); window.location.href = "/tournaments/${id}"; </script>`
			);
		} catch (error) {
			console.error(error);
			res.sendStatus(500);
		}
	}
});

/***************************************************************
Finish Tournament
----------------
Finalize all tournament results and closes out tournament.
All match results must be submitted this finalize call will then 
push results and make them permanent
***************************************************************/
router.post('/:id/finalize', async (req, res) => {
	const { id } = req.params;
	let state;
	try {
		const response = await challonge.tournaments.finalize(id);
		state = response.tournament.state;
	} catch (error) {
		console.error('Finalize Error:', error);
		return res
			.send(
				`<script>alert("Finalize did not work. Please ensure all matches have been played and recorded."); window.location.href = "/tournaments/${id}"; </script>`
			)
			.sendStatus(500);
	}
	if (state) {
		try {
			// Update tournament state in database if tournament finalize was successful
			await db.updateTournamentStateByChallongeID(state, id);
			updateTournamentWinner(id);
			res.send(
				`<script>alert("Tournament Has Been Finalized!"); window.location.href = "/tournaments/${id}"; </script>`
			);
		} catch (error) {
			console.error(error);
			res.sendStatus(500);
		}
	}
});

async function updateTournamentWinner(tournamentID) {
	let winner;
	try {
		const participants = await challonge.participants.index(tournamentID);
		for (const p of Object.values(participants)) {
			console.log(p.participant.name, p.participant.finalRank);
			if (p.participant.finalRank == 1) {
				winner = p.participant.name;
			}
		}
	} catch (error) {
		console.error(error);
	}
	if (winner) {
		try {
			const member = await db.getMemberByUsername(winner);
			await db.updateTournamentWinnerByChallongeID(
				member[0].member_id,
				tournamentID
			);
			await db.updateTournamentWinsByUsername(member[0].member_username);
		} catch (error) {
			console.error(error);
		}
	}
}

module.exports = router;
