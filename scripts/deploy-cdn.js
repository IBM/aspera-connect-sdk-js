const { execSync } = require('child_process');
const args = require('minimist')(process.argv.slice(4));

const { folder, distId, bucketName, packageName, tagName } = args;
const bucketPath = `${bucketName}/${packageName}/${tagName}`;

// Sync to s3 and invalidate
const syncCommand = `aws s3 sync . s3://${bucketPath} --delete --acl public-read`
const invalidationCommand = `aws cloudfront create-invalidation --distribution-id ${distId} --paths /${packageName}/${tagName}/*`
execSync(syncCommand, { stdio: 'inherit', cwd: folder });
execSync(invalidationCommand, { stdio: 'inherit', cwd: folder });
