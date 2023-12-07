const router = require ('express').Router ({mergeParams: true});
const pool = require ('../config/database');

var dt = new Date();

router.get ('/', (req, res) => {
    var sql = 
    'SELECT * , (SELECT COUNT(participant.member_id) FROM participant WHERE participant.member_id = member.member_id) AS TournPlayed, (SELECT COUNT(tournament.tournament_winner) FROM tournament WHERE tournament.tournament_winner = member.member_id) AS TournWon FROM member JOIN fighter ON member.member_fighter_id = fighter.fighter_id WHERE member.member_username = ?';
    pool.query (sql, req.query.username, (err, data) => {
      mem_id = data[0].member_id;
      if (err) throw err;
      var sqlnotes = 'SELECT * FROM notes WHERE member_id = ?';
      pool.query (sqlnotes, mem_id, (err, notedata) => {
        if (err) throw err;
  
        res.render ('profile', {
          title: 'User info',
          userData1: data,
          notes: notedata,
          ID: req.session.userID,
          username: req.session.username,
          role: req.session.role,
        });
      });
    });
  });
  
  router.get ('/search', (req, res) => {
    var usearch = req.query.usersearch;
    var sql = 'SELECT * , (SELECT COUNT(participant.member_id) FROM participant WHERE participant.member_id = member.member_id) AS TournPlayed, (SELECT COUNT(tournament.tournament_winner) FROM tournament WHERE tournament.tournament_winner = member.member_id) AS TournWon FROM member JOIN fighter ON member.member_fighter_id = fighter.fighter_id WHERE member.member_username = ?';

    pool.query (sql, usearch, (err, data) => {
       var mem_id = data[0].member_id;
        if (err) throw err;
        var sqlnotes = 'SELECT * FROM notes WHERE member_id = ?';
       pool.query (sqlnotes, mem_id, (err, notedata) => {
         if(err) throw err;

          if (data.length == 0) {
            res.redirect ('users');
          } else {
            res.render ('profile', {
              title: 'User info',
              userData1: data,
              notes: notedata,
              ID: req.session.userID,
              username: req.session.username,
              role: req.session.role,
        });
          }
      });
    });
  });

  router.post ('/addnote', (req, res) => {
    var mem_note_id = [member_note_id];
    var mem_note = req.body.newNote;
    
    var sql = 'INSERT INTO notes VALUES(default,?,?,?)';
  
    pool.query (sql, [mem_note_id, mem_note, dt], (err, result) => {
      if (err) throw err;
      res.redirect ('back');
    });
  });
  
  router.post ('/deletenote', (req, res) => {
    

    var sql = 'DELETE FROM notes WHERE note_id = ?';
  
    pool.query (sql, req.query.note_id, (err, result) => {
      if (err) throw err;
      res.redirect ('back');
    });
  });

  module.exports = router;