import  params from "./params";
import transac  from "../src";

const name = 'T10';
function run(transac, cb){
  console.log(`Transac ${name} is running`);
  transac.info('label', 'message, message');
  //throw new Error('dsqdqsdqsdqsdsq')
  ////cb('EEEEEEREUR');
  cb(null, 1, 2, 3);
}

function theEnd(err, id, a, b, c){
  if(err) throw err;
  console.log(id, a, b, c);
  console.log("End transac");
}

//transac('http://localhost:3004')(name, run, {locked: false}, theEnd);
transac('http://localhost:3004')(name, run, {locked: false}, theEnd);
