var transac = require('client-transac-redline')
  , async = require('async')
  , spawn = require('child_process').spawn;


function cmdMessage(transac, label, name, args){
  return function(cb){
    var cmd = spawn(name, args)
      , res = [ '<p><span style="font-weight: bold;"># ' + name + " " + args.join(" ") + "</span></p>" ]
      , error = false;

    cmd.stdout.on('data', function(data){
      res.push(data.toString());
    });

    cmd.stderr.on('data', function(data){
      error = true;
      res.push(data.toString());
    });

    cmd.on('close', function(code){
      if(error)transac.error(null, res.join("\n"));
      else transac.info(label,  res.join("\n"));
      cb();
    });

    cmd.on('error', function(data){
      cb(data.toString());
    });
  }
}

function run(transac, cb){
  async.series([ 
   cmdMessage(transac, "Dumping Database", "/usr/local/mongodb/bin/mongodump", ["--host", "host", "--db", "db", "--out", "/home/redpelicans/db/db_dump"]),
   cmdMessage(transac, "Restoring Database", "/usr/local/mongodb/bin/mongorestore", ["--drop", "/home/redpelicans/db/db_dump"])
  ], cb);
}

transac.exec('Mongo Sync', 'http://localhost:3002', run, {locked: false});
