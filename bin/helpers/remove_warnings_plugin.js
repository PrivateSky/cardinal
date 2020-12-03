const warnString = '[ WARN  ]';
const warnCondition = "reserved public name";

module.exports = function () {
  //@ts-ignore
  if (process.argv.includes('--prod')) {
    let originalConsoleLog = console.log;

    console.log = function () {
      let params = arguments;
      if (params[0].includes(warnString)) {
        let warnings = params[0].split(warnString);
        warnings.forEach(warn => {
          if (!warn.includes(warnCondition)) {
            if (warn.length > 10) {
              originalConsoleLog('\n' + warnString + warn);
            }
          }
        })
      } else {
        originalConsoleLog(...params)
      }
    }
  }
}
