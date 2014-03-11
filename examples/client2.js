var transac = require('../');

function run(transac, cb){
  transac.info('COCOU1', 'Messages1');
  transac.error('COCOU1', 'Messages1');
  cb();
}

transac.exec('Locked', 'http://localhost:3002', run, { locked: true }, function(err){
  console.error(err);
}); 
