const { API_KEY } = process.env;
const client = require('challonge').createClient({ apiKey: API_KEY });
const axios = require('axios');

const challonge = {
	tournaments: {
		index() {},
		show(tournamentID) {},
		create(name, startAt, checkIn, format) {},
		destroy(tournamentID) {},
		start(tournamentID) {},
		finalize(tournamentID) {},
		processCheckIns(tournamentID) {},
		abortCheckIn(tournamentID) {},
	},
	participants: {
		index(tournamentID) {},
		show(tournamentID, participantID) {},
		create(tournamentID, participantName) {},
		destroy(tournamentID, participantID) {},
		checkIn(tournamentID, participantID) {},
		undoCheckIn(tournamentID, participantID) {},
	},
	matches: {
		index(tournamentID) {},
		show(tournamentID, matchID) {},
		update(tournamentID, matchID, scores, winnerID) {},
		reopen(tournamentID, matchID) {},
		markAsUnderway(tournamentID, matchID) {},
		unmarkAsUnderway(tournamentID, matchID) {},
	},
};

/***********************************************
TOURNAMENTS
***********************************************/

challonge.tournaments.index = () => {
	return new Promise((resolve, reject) => {
		client.tournaments.index({
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.tournaments.show = (tournamentID) => {
	return new Promise((resolve, reject) => {
		client.tournaments.show({
			id: tournamentID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.tournaments.create = (name, startAt, checkIn, format) => {
	return new Promise((resolve, reject) => {
		client.tournaments.create({
			tournament: {
				name: name,
				startAt: startAt,
				checkInDuration: checkIn,
				tournamentType: format,
				gameName: 'Super Smash Bros. Ultimate',
			},
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.tournaments.destroy = (tournamentID) => {
	return new Promise((resolve, reject) => {
		client.tournaments.destroy({
			id: tournamentID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.tournaments.start = (tournamentID) => {
	return new Promise((resolve, reject) => {
		client.tournaments.start({
			id: tournamentID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.tournaments.finalize = (tournamentID) => {
	return new Promise((resolve, reject) => {
		client.tournaments.finalize({
			id: tournamentID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.tournaments.processCheckIns = (tournamentID) => {
	return new Promise((resolve, reject) => {
		client.tournaments.processCheckIns({
			id: tournamentID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.tournaments.abortCheckIn = (tournamentID) => {
	return new Promise((resolve, reject) => {
		client.tournaments.abortCheckIn({
			id: tournamentID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

/***********************************************
PARTICIPANTS
***********************************************/

challonge.participants.index = (tournamentID) => {
	return new Promise((resolve, reject) => {
		client.participants.index({
			id: tournamentID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.participants.show = (tournamentID, participantID) => {
	return new Promise((resolve, reject) => {
		client.participants.show({
			id: tournamentID,
			participantId: participantID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.participants.create = (tournamentID, participantName) => {
	return new Promise((resolve, reject) => {
		client.participants.create({
			id: tournamentID,
			participant: {
				name: participantName,
			},
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.participants.destroy = (tournamentID, participantID) => {
	return new Promise((resolve, reject) => {
		client.participants.destroy({
			id: tournamentID,
			participantId: participantID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.participants.checkIn = (tournamentID, participantID) => {
	return axios.post(
		`https://api.challonge.com/v1/tournaments/${tournamentID}/participants/${participantID}/check_in.json`,
		{ api_key: API_KEY }
	);
};

challonge.participants.undoCheckIn = (tournamentID, participantID) => {
	return axios.post(
		`https://api.challonge.com/v1/tournaments/${tournamentID}/participants/${participantID}/undo_check_in.json`,
		{ api_key: API_KEY }
	);
};

/***********************************************
MATCHES
***********************************************/

challonge.matches.index = (tournamentID) => {
	return new Promise((resolve, reject) => {
		client.matches.index({
			id: tournamentID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.matches.show = (tournamentID, matchID) => {
	return new Promise((resolve, reject) => {
		client.matches.show({
			id: tournamentID,
			matchId: matchID,
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.matches.update = (tournamentID, matchID, scoresCsv, winnerID) => {
	return new Promise((resolve, reject) => {
		client.matches.update({
			id: tournamentID,
			matchId: matchID,
			match: {
				// Scores are comma delimited with Player 1 score first
				// e.g. "3-0" OR "1-3,3-0,3-2"
				scoresCsv: scoresCsv,
				winnerId: winnerID,
			},
			callback: (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			},
		});
	});
};

challonge.matches.reopen = (tournamentID, matchID) => {
	return axios.post(
		`https://api.challonge.com/v1/tournaments/${tournamentID}/matches/${matchID}/reopen.json`,
		{ api_key: API_KEY }
	);
};

challonge.matches.markAsUnderway = (tournamentID, matchID) => {
	return axios.post(
		`https://api.challonge.com/v1/tournaments/${tournamentID}/matches/${matchID}/mark_as_underway.json`,
		{ api_key: API_KEY }
	);
};

challonge.matches.unmarkAsUnderway = (tournamentID, matchID) => {
	return axios.post(
		`https://api.challonge.com/v1/tournaments/${tournamentID}/matches/${matchID}/unmark_as_underway.json`,
		{ api_key: API_KEY }
	);
};

module.exports = challonge;
