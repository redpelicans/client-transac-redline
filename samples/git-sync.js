var transac = require('client-transac-redline')
  , async = require('async')
  , path = require('path')
  , glob = require('glob')
  , spawn = require('child_process').spawn;

//00 5  * * 0 cd /home/eric/works && ./updategit > /tmp/syncgit 2>&1

function update(transac){
  return function(dir, cb){
    process.chdir(dir);

    var cmd = spawn("git", ['pull'])
      , res = [ '<p><span style="font-weight: bold;"># ' + "cd " + dir + " && git pull"  + "</span></p>" ]
      , error = false;

    cmd.stdout.on('data', function(data){
      res.push(data.toString());
    });

    cmd.stderr.on('data', function(data){
      error = true;
      res.push(data.toString());
    });

    cmd.on('close', function(code){
      if(error) transac.error(path.basename(dir), res.join("\n"));
      else transac.info(path.basename(dir), res.join("\n"));
      cb();
    });

    cmd.on('error', function(data){
      transac.error(path.basename(dir), res.join("\n"));
      cb();
    });
  }
}

function run(transac, cb){
  var pwd = process.cwd();
  glob("/home/redpelicans/redline/git-sync/repos/*", function(err, files){
    async.mapSeries(files, update(transac), cb);
  });
}

transac.exec('git Sync', 'http://localhost:3002', run, {locked: false});
