import transac  from "../";
import yargs  from "yargs";
import stream from 'stream';

let argv = yargs
  .demand('u')
  .alias('u', 'url')
  .describe('u', 'transacd URL')
  .demand('n')
  .alias('n', 'name')
  .describe('n', "transac's name")
  .argv;

class LineReader extends stream.Transform{
  constructor(options){
    super(options);
    this.last = '';
  }

  _transform(chunck, encoding, cb){
    let lines = chunck.toString("utf8").split("\n");
    this.push(this.last + lines.shift());
    this.last = lines.pop();
    for(let l of lines) this.push(l);
    cb();
  }

  _flush(cb){
    this.push(this.last)
    cb();
  }
}
function run(transac, cb){
  let lineReader = new LineReader();

  process.stdin.setEncoding('utf8');

  // process.stdin.on('data', data => {
  //   process.stdout.write("$:" + data);
  // });
  
  process.stdin.pipe(lineReader).pipe(transac);

  process.stderr.on('data', data => {
    transac.error(data);
  });

  transac.on('finish', () => cb());
}

transac(argv.url)(argv.name, run, err => {
  if(err) throw err
  process.exit();
});


