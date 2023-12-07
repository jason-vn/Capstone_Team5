require('dotenv').config();

const router = require('express').Router({ mergeParams: true });
const db = require('../controllers/db');
const challonge = require('../controllers/challonge');

/***********************************************
Add Participant to Tournament
***********************************************/
router.post('/', async (req, res) => {
	if (!req.session.username) {
		console.error('Session does not exist');
		return res.send(
			`<script>alert("Please login to register for a tournament."); window.location.href = "/login"; </script>`
		);
	} else if (req.params.id < 1000) {
		console.error('Tournament id is not from Challonge');
		return res.send(
			`<script>alert("Unable to register at this time."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	} else {
		const memberID = req.session.userID;
		const username = req.session.username;
		const tournamentID = req.params.id;
		let participants;
		try {
			participants = await challonge.participants.index(tournamentID);
		} catch (error) {
			console.error(error);
		}
		let isRegistered = false;
		// Check if user is already registered
		if (Object.keys(participants).length > 0) {
			participants = Object.entries(participants).map((p) => p[1]);
			participants.forEach((p) => {
				console.log(`Checking if ${p.participant.name} is already registered`);
				if (p.participant.name == username) {
					isRegistered = true;
				}
			});
		}
		// if user is already registered, redirect to tournament page
		if (isRegistered) {
			console.error(
				`${username} is already registered to tournament ${tournamentID}`
			);
			res.send(
				`<script>alert("You have already registered to this tournament."); window.location.href = "/tournaments/${tournamentID}"; </script>`
			);
		} else {
			try {
				const response = await challonge.participants.create(
					tournamentID,
					username
				);
				console.log('Challonge participant created');
				const participantID = response.participant.id;
				let checkedIn = response.participant.checkedIn;
				checkedIn = checkedIn ? 'y' : 'n';
				await db.insertParticipant(
					memberID,
					tournamentID,
					participantID,
					checkedIn
				);
				console.log('Database participant created');
				res.send(
					`<script>alert("Success! You have been registered."); window.location.href = "/tournaments/${tournamentID}"; </script>`
				);
			} catch (error) {
				console.error(error);
				res.send(
					`<script>alert("Error attempting to register you to this tournament, please try again later."); window.location.href = "/tournaments/${req.params.id}"; </script>`
				);
			}
		}
	}
});

/***********************************************
Check In User to Tournament (SendStatus) - WIP
************************************************/
router.post('/:partID/checkIn', async (req, res) => {
	const tournamentID = req.params.id;
	const participantID = req.params.partID;
	try {
		await challonge.participants.checkIn(tournamentID, participantID);
		console.log('Challonge participant checked-in');
		await db.updateParticipantCheckedIn('y', participantID, tournamentID);
		console.log('Database participant checked-in');
		res.sendStatus(200);
	} catch (error) {
		console.error(error);
		res.sendStatus(422);
	}
});

/***********************************************
Check In User to Tournament
************************************************/
router.post('/:partID/check_in', async (req, res) => {
	// if user is not registered or not signed in, redirect to tournament page
	if (!req.session.username) {
		console.log(
			'[ERROR]',
			'Username is null or not registered:',
			req.session.username
		);
		return res.send(
			`<script>alert("User is not registered for this tournament."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	}
	const { id, partID } = req.params;
	let updateDB = false;
	try {
		await challonge.participants.checkIn(id, partID);
		updateDB = true;
	} catch (error) {
		console.error(error);
		return res.send(
			`<script>alert("Error! Unable to check-in with Challonge."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	}
	if (updateDB) {
		try {
			db.updateParticipantCheckedInByChallongeID('y', partID, req.params.id);
		} catch (error) {
			console.error(error);
			return res.send(
				`<script>alert("Error! Unable to check-in with database."); window.location.href = "/tournaments/${req.params.id}"; </script>`
			);
		}
		res.send(
			`<script>alert(" You have checked in for the tournament."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	} else {
		res.send(
			`<script>alert("Error! Unable to check-in, please try again later."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	}
});

/***********************************************************************
Delete Participant in Tournament (marks inactive if tournament is started)
************************************************************************/
router.post('/:partID', async (req, res) => {
	// if user is not registered or not signed in, redirect to tournament page
	if (!req.session.username) {
		console.log(
			'[ERROR]',
			'Username is null or not registered:',
			req.session.username
		);
		return res.send(
			`<script>alert("User is not registered for this tournament."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	}
	const { id, partID } = req.params;
	let updateDB = false;
	try {
		await challonge.participants.destroy(id, partID);
		updateDB = true;
	} catch (error) {
		console.error(error);
		return res.send(
			`<script>alert("Error! Unable to unregister with Challonge."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	}
	if (updateDB) {
		try {
			console.log(db.deleteParticipantByChallongeParticipantID(partID));
		} catch (error) {
			console.error(error);
			return res.send(
				`<script>alert("Error! Unable to unregister with database."); window.location.href = "/tournaments/${req.params.id}"; </script>`
			);
		}
		// success
		res.send(
			`<script>alert("You have been removed from registration."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	} else {
		// failed
		res.send(
			`<script>alert("Error! Unable to unregister, please try again later."); window.location.href = "/tournaments/${req.params.id}"; </script>`
		);
	}
});

module.exports = router;
