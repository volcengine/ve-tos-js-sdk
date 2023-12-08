function checkUmdExports() {
  const allExports = require('../');
  const TosClient = allExports.TosClient;

  const ignoreOutterExportKeys = ['default', 'TOS', 'TosClient'];
  const missingUmdKeys = [];

  Object.keys(allExports).forEach((key) => {
    if (ignoreOutterExportKeys.includes(key)) {
      return;
    }
    if (TosClient[key] !== allExports[key]) {
      missingUmdKeys.push(key);
    }
  });

  if (missingUmdKeys.length > 0) {
    throw Error(
      `export the following field in TosClient's static properties:\n\t${missingUmdKeys.join(
        ', '
      )}`
    );
  }
}

module.exports = {
  checkUmdExports,
};

if (require.main === module) {
  checkUmdExports();
}
