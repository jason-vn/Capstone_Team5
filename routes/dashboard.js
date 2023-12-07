require ('dotenv').config ();

const router = require ('express').Router ({mergeParams: true});
const db = require ('../controllers/db');
const axios = require ('axios');
const challonge = require ('challonge');
const client = challonge.createClient ({
  apiKey: process.env.API_KEY,
});

router.get ('/', async (req, res) => {
  if (!req.session.userID) {
    res.redirect ('/login');
  } else {
    let hostingTournaments;
    let participatingTournaments;
    try {
      hostingTournaments = await db.getHostingTournaments (req.session.userID);
      hostingTournaments = Object.entries (hostingTournaments).map (t => t[1]);
      participatingTournaments = await db.getParticipatingTournaments (
        req.session.userID
      );
      participatingTournaments = Object.entries (participatingTournaments).map (
        t => t[1]
      );
    } catch (error) {
      console.log (error);
    }
    res.render ('dashboard', {
      ID: req.session.userID,
      username: req.session.username,
      role: req.session.role,
      hostingTournaments: hostingTournaments,
      participatingTournaments: participatingTournaments,
    });
  }
});

module.exports = router;
