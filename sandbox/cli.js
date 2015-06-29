


//process.stdin.pipe(process.stdout);
process.stdin.setEncoding('utf8');
process.stdin.on('data', data => {
  process.stdout.write("$:" + data);
});
