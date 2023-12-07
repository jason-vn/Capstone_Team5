if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const pool = require('./config/database');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');
const ssl_ca = [fs.readFileSync('ssl/ca-cert.pem', 'utf8')];
const ssl_key = [fs.readFileSync('ssl/client-key.pem', 'utf8')];
const ssl_cert = [fs.readFileSync('ssl/client-cert.pem', 'utf8')];
const options = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PWD,
	database: process.env.DB_NAME,
	// Whether or not to automatically check for and clear expired sessions:
	clearExpired: true,
	// How frequently expired sessions will be cleared; milliseconds: (60000 = 1 minute)
	checkExpirationInterval: 60000,
	connectionLimit: 5,
	ssl: {
		ca: ssl_ca,
		cert: ssl_cert,
		key: ssl_key,
	},
};
const sessionStore = new MySQLStore(options);

const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const tournamentRouter = require('./routes/tournaments');
const participantsRouter = require('./routes/participants');
const matchesRouter = require('./routes/matches');
const kioskRouter = require('./routes/kiosk');
const profileRouter = require('./routes/profile');
const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(express.static(path.join(__dirname, 'static')));
app.use('/images', express.static(__dirname + '/views/images'));
app.use('/css', express.static(__dirname + '/views/css'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		store: sessionStore,
		resave: false,
		saveUninitialized: false,
		cookie: {
			// The maximum age of a valid session; milliseconds: (300000 = 5 Minutes)
			maxAge: 600000,
			httpOnly: false,
		},
	})
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', console.log(`${new Date(Date.now()).toLocaleTimeString()} : Server started on port ${PORT}`));

/************* ECONNRESET *************/
app.on('error', (error) => {
	console.log('error event:', error);
});

process.on('uncaughtException', function (error) {
	console.log('uncaughtException:', error);
});
/***************************************/

app.get('/', (req, res) => {
	if(req.session.userID) {
		res.redirect('dashboard');
	} else {
		res.render('index', {
			ID: req.session.userID,
			username: req.session.username,
			role: req.session.role,
			});
	}
	
});

app.get('/users', (req, res) => {
	var sql =
		'SELECT * FROM member JOIN fighter ON member.member_fighter_id = fighter.fighter_id';
	pool.query(sql, function (err, data) {
		if (err) throw err;
		res.render('users', {
			title: 'User List',
			userData: data,
			ID: req.session.userID,
			username: req.session.username,
			role: req.session.role,
		});
	});
});

app.get('/results', (req, res) => {
	var sql = 'SELECT tournament_name, tournament_winner, member_username, fighter_name FROM tournament LEFT JOIN member ON tournament.tournament_winner = member.member_id LEFT JOIN fighter ON member.member_fighter_id = fighter.fighter_id';
	pool.query(sql, function (err, data) {
		console.log(data);
		if (err) throw err;
		res.render('results', {
			title: 'Tournament Results',
			tournamentData: data,
			ID: req.session.userID,
			username: req.session.username,
			role: req.session.role,
		});
	});
});

app.get('/rankings', (req, res) => {
	var sql =
		'SELECT member.member_username, member_losses, member_wins, member_tournament_wins, member_ranking, fighter.fighter_name FROM member JOIN fighter ON member.member_fighter_id = fighter.fighter_id ORDER BY member_ranking DESC';
	pool.query(sql, function (err, data) {
		if (err) throw err;
		res.render('rankings', {
			title: 'Season Rankings',
			player1: data[0].member_username,
			player2: data[1].member_username,
			player3: data[2].member_username,
			userData: data,
			ID: req.session.userID,
			username: req.session.username,
			role: req.session.role,
		});
	});
});

app.get('/forgotpassword', (req, res) => {
	res.render('forgotpassword', {
		ID: req.session.userID,
		username: req.session.username,
		role: req.session.role,
	});
});

app.get('/passwordreset', function (req, res, next) {
	res.render('passwordreset', {
		title: 'Reset Password Page',
		token: req.query.token,
	});
});

app.get('/logout', (req, res) => {
	req.session.destroy(function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log(session.ID);
			res.redirect('/');
		}
	});
});

app.use('/admin', adminRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/tournaments', tournamentRouter);
app.use('/tournaments/:id/participants', participantsRouter);
app.use('/tournaments/:id/matches', matchesRouter);
app.use('/tournaments/:id/kiosk', kioskRouter);
app.use('/profile', profileRouter);
app.use('/dashboard', dashboardRouter);
