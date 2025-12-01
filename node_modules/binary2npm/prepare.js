import { familySync, MUSL } from 'detect-libc';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { finished } from 'node:stream/promises';

const __filename = process.argv[1];
const __dirname = dirname(__filename);
const linuxLib = process.platform === 'linux' ? familySync() === MUSL ? 'musl' : 'gnu' : undefined;

const noop = () => {};
const win32path = (path) => path.replace('//', '/');

export const maps = {
  arch: {
    arm64: 'aarch64',
    x86: 'x86_64',
    x64: 'x86_64'
  },
  vendor: {
    darwin: 'apple',
    win32: 'pc',
    linux: 'unknown'
  },
  os: {
    darwin: 'darwin',
    win32: 'windows-msvc',
    linux: 'linux'
  },
  lib: linuxLib
};

// This is valid extensions for GitHub release assets
const validExtensions = ['tar.gz', 'zip'];

/**
 *
 * @param options Prepare options
 * @param options.remote Remote hosting (e.g. `github`)
 * @returns
 */
export const prepare = async ({
  remote,
  author,
  repository,
  remoteToken = process.env.REMOTE_TOKEN,
  binary,
  usePackageJson = false,
  orders = ['binary', 'version', 'arch', 'vendor', 'os'],
  stableOnly = true,
  tagPrefix = 'v'
}) => {
  const FETCH_REPO = `${author}/${repository}`;
  let FETCH_REPO_URL;
  let FETCH_REPO_FALLBACK_URL;
  let FETCH_REPO_OPTIONS;

  switch (remote) {
    case 'github': {
      if (usePackageJson) {
        const pkgPath =  join(__dirname, 'package.json');

        const pkgRaw = await fs.readFile(win32path(pkgPath));
        const pkg = JSON.parse(pkgRaw);
        FETCH_REPO_URL = `https://api.github.com/repos/${FETCH_REPO}/releases/tags/${tagPrefix}${pkg.version}`;
        FETCH_REPO_FALLBACK_URL = `https://api.github.com/repos/${FETCH_REPO}/releases/tags/${pkg.version}`;
      } else {
        FETCH_REPO_URL = `https://api.github.com/repos/${FETCH_REPO}/releases`;
      }
      FETCH_REPO_OPTIONS = {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(remoteToken ? { Authorization: `Bearer ${remoteToken}` } : {})
        }
      };
      break;
    }
    default: {
      throw new Error('Invalid remote');
    }
  }

  let release = await fetch(FETCH_REPO_URL, FETCH_REPO_OPTIONS);

  // Fallback URL for some projects which uses without `v` prefix
  if (!release.ok && release.status === 404) {
    release = await fetch(FETCH_REPO_FALLBACK_URL, FETCH_REPO_OPTIONS);
  }

  if (!release.ok || release.status !== 200) {
    if (!remoteToken) {
      console.error({
        status: release.status,
        body: 'Authorization failed. Provide `REMOTE_TOKEN` environment variable',
        error: (await release.json()).message
      });
    } else {
      console.error({
        status: release.status,
        body: (await release.json()).message
      });
    }
    process.exit(1);
    return false;
  } else if (usePackageJson) {
    release = await release.json();
  } else {
    const releases = await release.json();
    [release] = (stableOnly
      ? releases.filter(({ prerelease }) => prerelease !== stableOnly)
      : releases).filter(({assets}) => assets.length > 0);
  }

  if (!release) {
    console.error({
      status: 404,
      body: 'Project has no releases'
    });
    process.exit(1);
  }

  // Prepare constants
  const arch = maps.arch[process.arch];
  const vendor = maps.vendor[process.platform];
  const _os = maps.os[process.platform];
  const { assets: _, tag_name } = release;
  const version = tag_name.startsWith(tagPrefix)
    ? tag_name.slice(tagPrefix.length)
    : tag_name;
  let extension;

  const mapOrder = {
    binary,
    version,
    vendor,
    os: _os,
    arch,
    linux_lib: maps.lib
  };

  if (linuxLib !== undefined) {
    orders.push('linux_lib');
  }

  const asset = release.assets.find(({ name }) => {
    let assetName = name?.trim();

    for (const order of orders) {
      const content = mapOrder[order];

      if (!content) {
        continue;
      }

      if (!assetName.includes(content)) {
        return false;
      }

      assetName = assetName.slice(assetName.indexOf(content) + content.length);
    }

    // Currently does not support installer
    if (assetName.includes('install')) {
      return false;
    }

    // Trim for additional checks
    assetName = assetName?.trim();

    if (assetName && !validExtensions.includes(assetName.slice(1))) {
      return false;
    }

    extension = assetName;
    return true;
  });

  if (!asset) {
    console.error({
      status: 'error',
      body: 'Asset not found'
    });
    process.exit(1);
  }

  // Preparing
  const suffix = !extension.endsWith('.exe') && vendor === 'pc' ? '.exe' : '';
  const localURL = join(__dirname, binary);

  if (extension) {
    await Promise.all([
      fs.unlink(localURL + suffix).catch(noop),
      fs.unlink(localURL + extension).catch(noop)
    ]);
  }

  // Processing
  const response = await fetch(asset.browser_download_url, FETCH_REPO_OPTIONS);
  const { status, ok, headers } = response;
  const contentLength = +headers.get('content-length');

  if (!ok || status !== 200) {
    console.error({
      status,
      body: await response.text()
    });
    process.exit(1);
  }

  // Check if has no extension
  if (!extension && contentLength > 100 && existsSync(localURL + extension)) {
    const { size } = await fs.stat(localURL + extension);

    if (size === contentLength) {
      console.log({
        status: 'success',
        body: 'Skip, already exists'
      });
      process.exit(0);
    }
  }

  await fs.writeFile(
    localURL + extension,
    Buffer.from(await response.arrayBuffer())
  );

  await finished(
    spawn(extension === '.zip' ? `unzip ${localURL + extension}` : `tar -xzvf ${localURL + extension}`, {
      shell: true,
      detached: true,
      cwd: __dirname
    }).stdout
  );
  // Disallow file deletion bug where `extension` does not exist
  if (extension) {
    await fs.unlink(localURL + extension);
  }

  if (process.platform !== 'win32') {
    await fs.chmod(localURL, '755');
  }

  // If exists `.exe` binary
  if (
    process.platform === 'win32' &&
    existsSync(`${__dirname}/${binary}${suffix}`)
  ) {
    const pkgPath = win32path(join(__dirname, 'package.json'));
    const pkg = await fs.readFile(pkgPath, {
      encoding: 'utf-8'
    });
    await fs.writeFile(
      pkgPath,
      pkg.replace(`: "${binary}"`, `: "${binary}${suffix}"`)
    );
  }

  return true;
};
