const fs = require('fs');
const path = require('path');

const packageJsonPaths = ['package.json'];

packageJsonPaths.forEach(packageJsonPath => {
  const fullPath = path.join(__dirname, '..', packageJsonPath);

  fs.readFile(fullPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading ${fullPath}:`, err);
      return;
    }

    try {
      const packageJson = JSON.parse(data);

      if (packageJson.dependencies) {
        packageJson.dependencies = sortObjectKeys(packageJson.dependencies);
      }

      if (packageJson.devDependencies) {
        packageJson.devDependencies = sortObjectKeys(
          packageJson.devDependencies,
        );
      }

      fs.writeFile(
        fullPath,
        JSON.stringify(packageJson, null, 2),
        'utf8',
        e => {
          if (e) {
            console.error(`Error writing ${fullPath}:`, exports);
          } else {
            console.log(
              `Dependencies in ${fullPath} alphabetized successfully.`,
            );
          }
        },
      );
    } catch (parseError) {
      console.error(`Error parsing ${fullPath}:`, parseError);
    }
  });
});

function sortObjectKeys(object) {
  const sortedObject = {};
  const sortedKeys = Object.keys(object).sort();
  sortedKeys.forEach(key => {
    sortedObject[key] = object[key];
  });
  return sortedObject;
}
