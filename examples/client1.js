var transac = require('../');

function run(transac, cb){
  console.log('COUCOU');
  transac.info('label', 'message, message');
  //throw new Error('dsqdqsdqsdqsdsq')
  ////cb('EEEEEEREUR');
  cb();
}

transac.exec('T3', 'http://localhost:3002', run, {locked: false});
