/// <reference types="node" />
export declare const maps: {
  arch: Record<NodeJS.Architecture, string>;
  vendor: Record<NodeJS.Platform, string>;
  os: Record<NodeJS.Platform, string>;
  lib?: 'musl' | 'gnu' | undefined;
};

export declare function prepare({
  remote,
  author,
  repository,
  remoteToken = process.env.REMOTE_TOKEN,
  binary,
  usePackageJson,
  orders,
  stableOnly,
  tagPrefix
}:
  | {
      remote: 'github';
      author: string;
      repository: string;
      remoteToken: string;
      binary: string;
      usePackageJson?: boolean;
      orders?: Array<'binary' | 'version' | 'vendor' | 'os' | 'arch'>;
      tagPrefix?: string;
    }
  | {
      remote: 'github';
      author: string;
      repository: string;
      remoteToken: string;
      binary: string;
      orders?: Array<'binary' | 'version' | 'vendor' | 'os' | 'arch'>;
      stableOnly?: boolean;
      tagPrefix?: string;
    }): Promise<boolean>;
