var fs = require('fs');
var resolve = require('path').resolve
var join = require('path').join
var cp = require('child_process')

// get library path
var packages = resolve(__dirname, '../packages')

fs.readdirSync(packages)
  .forEach(function (mod) {
    var modPath = join(packages, mod)

    // ensure path has package.json
    if (!fs.existsSync(join(modPath, 'package.json'))) return

    // install folder
    cp.spawn('npm', ['i'], { env: process.env, cwd: modPath, stdio: 'inherit' })
  })
