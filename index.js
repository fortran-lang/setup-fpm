const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');
const exec = require('@actions/exec');
const path = require('path');
const github = require('@actions/github');
const os = require('os');

// Main entry function
//
async function main(){

  try {

    // Get inputs
    const token = core.getInput('github-token');

    var fpmVersion = core.getInput('fpm-version');
    console.log(`fpm-version: ${fpmVersion}`);

    const fpmRepo = core.getInput('fpm-repository');
    console.log(`fpm-repository: ${fpmRepo}`);

    // Get latest version if requested
    if (fpmVersion === 'latest'){

      if (token === 'none') {
        core.setFailed('To fetch the latest fpm version, please supply a github token. Alternatively you can specify the fpm release version manually.');
      }

      try {

        fpmVersion = await getLatestReleaseVersion(token);

      } catch (error) {

        core.setFailed('Error while querying the latest fpm release version - please check your github token.');

      }

    }

    // Detect architecture
    const arch = os.arch();
    console.log(`System architecture: ${arch}`);
    console.log(`This platform is ${process.platform}`);

    // Build download path
    const fetchPath = fpmRepo + '/releases/download/' + fpmVersion + '/';
    const filename = getFPMFilename(fpmVersion, process.platform, arch);

    console.log(`Fetching fpm from ${fetchPath}${filename}`);

    // Download release
    var fpmPath;
    try {

      // Try downloading the file without the compiler suffix
      const filename = getFPMFilename(fpmVersion, process.platform, arch);
      fpmPath = await tc.downloadTool(fetchPath + filename);

    } catch (error) {

      // If download fails, try adding compiler suffixes
      const compilers = ['gcc-10', 'gcc-11', 'gcc-12', 'gcc-13', 'gcc-14'];

      let success = false;

      for (const compiler of compilers) {

        // Generate the filename with the compiler suffix
        const filenameWithSuffix = getFPMFilename(fpmVersion, process.platform, arch, compiler);
        console.log(`Trying to fetch compiler-built fpm: ${filenameWithSuffix}`);

        try {
          fpmPath = await tc.downloadTool(fetchPath + filenameWithSuffix);
          success = true;
          break;  // If download is successful, break out of the loop
        } catch (error) {
          console.log(`  -> Failed to download ${filenameWithSuffix}`);
        }

      }

      if (!success) {
        // Not every platform and architecture has a pre-built binary: there is
        // no linux-arm64 release asset, so on those runners every download above
        // fails. install.sh makes no assumption about the platform beyond a
        // POSIX shell and a Fortran compiler, so the same fallback that serves
        // macOS ARM64 serves Linux ARM64 too. See issue #60.
        if ((process.platform === 'darwin' || process.platform === 'linux') && arch === 'arm64') {
          console.log(`No pre-built ${process.platform}-${arch} binary found, falling back to building from source`);

          // For older versions without working install.sh, we can't build from source
          const versionNum = fpmVersion.replace('v', '');
          const versionParts = versionNum.split('.').map(Number);
          const isOldVersion = versionParts[0] === 0 && versionParts[1] < 9;

          if (isOldVersion) {
            core.setFailed(
              `Building fpm ${fpmVersion} from source is not supported on ${process.platform} ${arch}.\n` +
              'Please use fpm v0.9.0 or later, which has a working install.sh script.\n' +
              'For example, set fpm-version to "v0.9.0", "v0.10.1" or "latest".'
            );
            return;
          }

          await installFromSource(fpmVersion, fpmRepo);
          return;
        }

        // Without this return, execution carried on to path.dirname(fpmPath)
        // with fpmPath still undefined, and the real reason was buried under a
        // second, unrelated error: 'The "path" argument must be of type string'.
        core.setFailed(`Error while trying to fetch fpm ${fpmVersion} for ${process.platform}-${arch} - no release asset was found for this platform and it could not be built from source.`);
        return;
      }
    }

    console.log(fpmPath);
    const downloadDir = path.dirname(fpmPath);

    // Add executable flag on unix
    if (process.platform === 'linux' || process.platform === 'darwin'){

      await exec.exec('chmod u+x '+fpmPath);

    }

    // Rename to 'fpm'
    if (process.platform === 'win32') {

      await io.mv(fpmPath, downloadDir + '/' + 'fpm.exe');

    } else {

      await io.mv(fpmPath, downloadDir + '/' + 'fpm');

    }

    // Add to path
    core.addPath( downloadDir );
    console.log(`fpm added to path at ${downloadDir}`);

  } catch (error) {

    core.setFailed(error.message);

  }
};

// Construct the filename for an fpm release
//
//  fpm-<version>-<os>-<arch>[-<compiler>][.exe]
//
//  <version> is a string of form X.Y.Z corresponding to a release of fpm
//  <os> is either 'linux', 'macos', or 'windows'
//  <arch> is 'x86_64' or 'arm64'
//  <compiler> is an optional string like '-gcc-12'
//
function getFPMFilename(fpmVersion, platform, arch, compiler = '') {
  var filename = 'fpm-';

  // Remove the leading 'v' if it exists if fpmVersion is not equal to 'current'
  if (fpmVersion != 'current') {
    filename += fpmVersion.replace('v', '') + '-';
  }

  // Map Node.js arch to FPM arch naming
  let fpmArch = 'x86_64';
  if (arch === 'arm64') {
    fpmArch = 'arm64';
  } else if (arch === 'x64') {
    fpmArch = 'x86_64';
  }

  // Add the platform and architecture
  if (platform === 'linux') {
    filename += `linux-${fpmArch}`;
  } else if (platform === 'darwin') {
    filename += `macos-${fpmArch}`;
  } else if (platform === 'win32') {
    filename += `windows-${fpmArch}`;
  } else {
    core.setFailed('Unknown platform');
  }

  // If a compiler is provided, append it as a suffix
  if (compiler) filename += `-${compiler}`;

  // Add the '.exe' suffix for Windows
  if (platform === 'win32') filename += '.exe';

  return filename;
}


// Query github API to find the tag for the latest release
//
async function getLatestReleaseVersion(token){

  const octokit = github.getOctokit(token);

  const {data: latest} = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
                            owner: 'fortran-lang',
                            repo: 'fpm'});

  return latest.tag_name;

}


// Install fpm from source using the install.sh script
// This is used on the platforms where pre-built binaries are not available,
// currently macOS ARM64 and Linux ARM64
//
async function installFromSource(fpmVersion, fpmRepo){

  try {

    // Find gfortran - it may be versioned (e.g., gfortran-13)
    // Use gcc <= 13 for compatibility with older fpm versions
    let gfortranCmd = 'gfortran';
    let foundGfortran = false;

    try {
      await exec.exec('which', ['gfortran'], { silent: true });
      foundGfortran = true;
    } catch (error) {
      // gfortran not found, try versioned
    }

    // If we found unversioned gfortran, check if it's gcc >= 14
    // If so, or if we didn't find unversioned gfortran, look for a versioned one <= 13
    // Always prefer versioned <= 13 for compatibility
    let foundVersioned = false;
    for (const ver of [13, 12, 11, 10]) {
      try {
        await exec.exec('which', [`gfortran-${ver}`], { silent: true });
        gfortranCmd = `gfortran-${ver}`;
        foundVersioned = true;
        console.log(`Found ${gfortranCmd}`);
        break;
      } catch (e) {
        // Continue searching
      }
    }

    if (!foundVersioned && !foundGfortran) {
      const installHint = process.platform === 'darwin'
        ? '    run: brew install gcc@13\n'
        : '    run: sudo apt-get install -y gfortran-13\n';
      core.setFailed(
        `gfortran is required to build fpm from source on ${process.platform} ${os.arch()}.\n` +
        'Please install gcc version 10-13 before running this action, for example:\n' +
        '  - name: Install gfortran\n' +
        installHint +
        'Or use fortran-lang/setup-fortran to install a Fortran compiler.'
      );
      return;
    }

    const versionNumber = fpmVersion.replace('v', '');

    // Download the full source tarball for the requested version
    const tarballUrl = `${fpmRepo}/archive/refs/tags/${fpmVersion}.tar.gz`;
    console.log(`Downloading fpm source from: ${tarballUrl}`);
    const tarballPath = await tc.downloadTool(tarballUrl);

    // Create a temporary directory for building
    const buildDir = path.join(process.env.RUNNER_TEMP || '/tmp', 'fpm-build');
    await io.mkdirP(buildDir);

    // Extract the tarball
    const extractDir = await tc.extractTar(tarballPath, buildDir);
    console.log(`Extracted to: ${extractDir}`);

    // The extracted directory will be named fpm-<version> (without the 'v')
    const fpmSourceDir = path.join(buildDir, `fpm-${versionNumber}`);

    console.log('Installing fpm from source using install.sh...');

    // Create installation directory
    const installPrefix = path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.local');
    const installDir = path.join(installPrefix, 'bin');
    await io.mkdirP(installDir);

    // Run the install.sh script with FC environment variable
    const installScript = path.join(fpmSourceDir, 'install.sh');
    await exec.exec('bash', [installScript, `--prefix=${installPrefix}`], {
      cwd: fpmSourceDir,
      env: {
        ...process.env,
        FC: gfortranCmd
      }
    });

    // Add to path
    core.addPath(installDir);
    console.log(`fpm installed and added to path at ${installDir}`);

    // Clean up build directory
    await io.rmRF(buildDir);

  } catch (error) {

    core.setFailed(`Failed to install fpm from source: ${error.message}`);

  }

}


// Call entry function
main();
