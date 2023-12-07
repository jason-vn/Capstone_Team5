const pool = require('../config/database');

const execute = (sql, args) => {
	return new Promise((resolve, reject) => {
		pool.query(sql, args, (error, data) => {
			if (error) {
				reject(error);
			} else {
				resolve(data);
			}
		});
	});
};

const db = {
	getMemberByUsername: (name) => {
		const sql = 'SELECT * FROM member WHERE member_username = ?';
		return execute(sql, name);
	},
	getMemberAndFighterIDByChallongeParticipantID: (participantID) => {
		const sql =
			'SELECT m.member_id, member_fighter_id FROM member m JOIN participant p ON p.member_id = m.member_id WHERE p.challonge_participant_id = ?';
		return execute(sql, participantID);
	},
	getParticipant: (memberID, tournamentID) => {
		const sql =
			'SELECT * FROM participant WHERE member_id = ? AND challonge_tournament_id = ?';
		return execute(sql, [memberID, tournamentID]);
	},
	getParticipants: (tournamentID) => {
		const sql = 'SELECT * FROM participant WHERE challonge_tournament_id = ?';
		return execute(sql, tournamentID);
	},
	getParticipatingTournaments: (memberID) => {
		const sql =
			'SELECT * FROM participant p JOIN tournament t ON p.challonge_tournament_id = t.challonge_tournament_id WHERE p.member_id = ?';
		return execute(sql, memberID);
	},
	getMemberRank: (memberUsername) => {
		const sql = 'SELECT member_ranking FROM member WHERE member_username = ?';
		return execute(sql, memberUsername);
	},

	insertParticipant: (memberID, tournamentID, participantID, checkedIn) => {
		const sql =
			'INSERT INTO participant (member_id, challonge_tournament_id, challonge_participant_id, checked_in) VALUES (?,?,?,?)';
		return execute(sql, [memberID, tournamentID, participantID, checkedIn]);
	},
	updateParticipantCheckedIn: (checkedIn, memberID, tournamentID) => {
		const sql =
			'UPDATE participant SET checked_in = ? WHERE member_id = ? AND challonge_tournament_id = ?';
		return execute(sql, [checkedIn, memberID, tournamentID]);
	},
	updateParticipantCheckedInByChallongeID: (
		checkedIn,
		participantID,
		tournamentID
	) => {
		const sql =
			'UPDATE participant SET checked_in = ? WHERE challonge_participant_id = ? AND challonge_tournament_id = ?';
		return execute(sql, [checkedIn, participantID, tournamentID]);
	},
	getTournament: (tournamentID) => {
		const sql = 'SELECT * FROM tournament WHERE tournament_id = ?';
		return execute(sql, tournamentID);
	},
	getUpcomingTournaments: () => {
		const sql =
			'SELECT * FROM tournament WHERE DATE(tournament_start) >= CURRENT_DATE ORDER BY tournament_start';
		return execute(sql);
	},
	getTournamentByChallongeID: (tournamentID) => {
		const sql = 'SELECT * FROM tournament WHERE challonge_tournament_id = ?';
		return execute(sql, tournamentID);
	},
	getTournamentByName: (tournamentName) => {
		const sql = 'SELECT * FROM tournament WHERE tournament_name = ?';
		return execute(sql, tournamentName);
	},
	getHostingTournaments: (memberID) => {
		const sql = 'SELECT * FROM tournament WHERE tournament_host_id = ?';
		return execute(sql, memberID);
	},
	getCurrentSeason: () => {
		const sql =
			'SELECT * FROM season WHERE CURRENT_DATE >= season_start AND CURRENT_DATE <= season_end';
		return execute(sql);
	},
	insertTournament: (
		memberID,
		type,
		name,
		checkInDuration,
		state,
		start,
		seasonID,
		tournamentID
	) => {
		const sql =
			'INSERT INTO tournament (tournament_host_id, tournament_type, tournament_name, tournament_check_in_duration, tournament_state, tournament_start, season_id, challonge_tournament_id) VALUES(?,?,?,?,?,?,?,?)';
		return execute(sql, [
			memberID,
			type,
			name,
			checkInDuration,
			state,
			start,
			seasonID,
			tournamentID,
		]);
	},
	updateTournamentStateByChallongeID: (state, tournamentID) => {
		const sql =
			'UPDATE tournament SET tournament_state = ? WHERE challonge_tournament_id = ?';
		return execute(sql, [state, tournamentID]);
	},
	updateTournamentWinnerByChallongeID: (memberID, tournamentID) => {
		const sql =
			'UPDATE tournament SET tournament_winner = ? WHERE challonge_tournament_id = ?';
		return execute(sql, [memberID, tournamentID]);
	},
	updateTournamentsPlayedByUsername: (name) => {
		const sql =
			'UPDATE member SET member_tournaments_played = member_tournaments_played + 1 where member_username = ?;';
		return execute(sql, [name]);
	},
	updateTournamentWinsByUsername: (name) => {
		const sql =
			'UPDATE member SET member_tournament_wins = member_tournament_wins + 1 where member_username = ?;';
		return execute(sql, [name]);
	},
	deleteTournament: (tournamentID) => {
		const sql = 'DELETE FROM tournament WHERE tournament_id = ?';
		return execute(sql, tournamentID);
	},
	deleteTournamentByChallongeID: (tournamentID) => {
		const sql = 'DELETE FROM tournament WHERE challonge_tournament_id = ?';
		return execute(sql, tournamentID);
	},
	deleteParticipantByChallongeParticipantID: (participantID) => {
		const sql = 'DELETE FROM participant WHERE challonge_participant_id = ?';
		return execute(sql, participantID);
	},
	deleteParticipantsByChallongeTournamentID: (tournamentID) => {
		const sql = 'DELETE FROM participant WHERE challonge_tournament_id = ?';
		return execute(sql, tournamentID);
	},
	insertGame: (
		game_status,
		playera_id,
		playera_fighter_id,
		playerb_id,
		playerb_fighter_id,
		game_winner,
		game_loser,
		tournament_id
	) => {
		const sql =
			'INSERT INTO game (	game_status, playera_id, playera_fighter_id, playerb_id, playerb_fighter_id, game_winner, game_loser, tournament_id) VALUES (?,?,?,?,?,?,?,?)';
		return execute(sql, [
			game_status,
			playera_id,
			playera_fighter_id,
			playerb_id,
			playerb_fighter_id,
			game_winner,
			game_loser,
			tournament_id,
		]);
	},
	deleteGame: (gameID) => {
		const sql = 'DELETE FROM game WHERE game_id = ?';
		return execute(sql, gameID);
	},
	deleteGamesByTournamentID: (tournamentID) => {
		const sql = 'DELETE FROM game WHERE tournament_id = ?';
		return execute(sql, tournamentID);
	},
};

module.exports = db;
