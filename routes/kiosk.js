require('dotenv').config();

const router = require('express').Router({ mergeParams: true });
const db = require('../controllers/db');
const challonge = require('../controllers/challonge');

/***********************************************
Kiosk
***********************************************/
router.get('/', async (req, res) => {
	const tournamentID = req.params.id;
	let tournament, participants;
	try {
		[t, p] = await Promise.all([
			challonge.tournaments.show(tournamentID),
			challonge.participants.index(tournamentID),
		]);
		tournament = t;
		participants = p;
	} catch (error) {
		console.error(error);
	}
	if (!tournament) {
		res.sendStatus(404);
	} else {
		participants = filterParticipants(participants);
		console.log(participants);
		res.render('kiosk', {
			ID: req.session.userID,
			username: req.session.username,
			tournament: tournament.tournament,
			participants: participants,
			role: req.session.role,
		});
	}
});

function filterParticipants(participants) {
	let temp = Object.values(participants).map((p) => p.participant);
	temp = temp.filter((p) => !p.checkedIn);
	return temp;
}

module.exports = router;
