import  params from "./params";
import transac  from "../src";

const name = 'T9';

function run(transac, cb){
  console.log(`Transac ${name} is running`);
  transac.info('label', 'message, message');
  //throw new Error('dsqdqsdqsdqsdsq')
  ////cb('EEEEEEREUR');
  cb();
}

function theEnd(err){ console.log("End transac") }

transac('http://localhost:3004')(name, run, {locked: true})
  .then(theEnd)
  .catch(err => { console.log(err.message) });
