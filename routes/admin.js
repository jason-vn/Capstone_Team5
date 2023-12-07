const router = require ('express').Router ({mergeParams: true});
const pool = require ('../config/database');

router.get ('/', (req, res) => {
    var role = req.session.role;
   
    var sql = 'SELECT * FROM member';

    if(req.session.role === 1 || typeof role === 'undefined'){
        res.redirect('./')
    }else{
        pool.query (sql, function (err, data) {
            if (err) throw err;
        
            res.render ('admin', {
                users: data,
                ID: req.session.userID,
                username: req.session.username,
                role: req.session.role,
            });

          });

    }
  });

  /*
    This grants selected member admin role access
  */
  router.post('/addadmin', (req, res) => {
    console.log(req.body.user)
    if(typeof req.body.user === 'undefined'){
        console.log('no user selected')
        res.redirect('back');
    }
      console.log("Adding new admin user"+ req.body.user);
        var sql = 'UPDATE member SET member_role = 0 WHERE member_username = ? ';

         pool.query (sql,req.body.user, (err, result) => {
        if (err) throw err;
        res.redirect ('back');
      });

  });

  /*
    This will remove admin role from selected member
  */

  router.post('/remove', (req, res) => {
      console.log(req.body.admin)
      if(typeof req.body.admin === 'undefined'){
          console.log('no user selected')
          res.redirect('back');
      }else{
         console.log("Removing admin user"+ req.body.admin);
      var sql = 'UPDATE member SET member_role = 1 WHERE member_username = ?';

     pool.query (sql,req.body.admin, (err, result) => {
      if (err) throw err;
      res.redirect ('back');
    });
}

});

  module.exports = router;