const colors = require('colors');

function displayHeader() {
  process.stdout.write('\x1Bc');
  console.log(colors.cyan('============================================='));
  console.log(colors.cyan('=             Vana datahero bot             ='));
  console.log(colors.cyan('=            Created by JasmineAF           ='));
  console.log(colors.cyan('=follow and give star my github for next bot='));
  console.log(colors.cyan('============================================='));
  console.log();
}

module.exports = displayHeader;
