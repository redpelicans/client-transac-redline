var transac = require('../');

function run(transac, cb){
  transac.info('COCOU1', 'Messages1');
  transac.warning('COCOU2', 'Messages2');
  transac.error('COCOU3', 'Messages3');
  console.log('COUCOU');
  //cb(new Error());
  throw new Error();
}

transac.exec('TOTO', 'http://localhost:3002', run, {locked: false}, function(err){
  console.error(err);
}); 
