const isWorkspacePackage = (req) =>
  req.startsWith('@app/') || req.startsWith('@apps/');

module.exports = (options, { ContextReplacementPlugin, IgnorePlugin }) => {
  const unusedOptionalPackages = [
    // @nestjs/microservices transports we don't use
    '@grpc/grpc-js',
    '@grpc/proto-loader',
    'kafkajs',
    'mqtt',
    'nats',
    'ioredis',
    // @nestjs/terminus ORM health indicators (project uses Prisma)
    '@mikro-orm/core',
    '@nestjs/mongoose',
    '@nestjs/sequelize',
    '@nestjs/typeorm',
    'mongoose',
    'sequelize',
    'typeorm',
  ];

  return {
    ...options,
    // pnpm isolated mode puts packages in .pnpm/ virtual store, not root node_modules/,
    // so the default nodeExternals() (which scans node_modules/) misses them and webpack
    // bundles native addons and worker-thread packages — breaking them at runtime.
    // This function marks all non-workspace imports as external regardless of location.
    externals: [
      ({ request }, callback) => {
        if (
          request &&
          !request.startsWith('.') &&
          !request.startsWith('/') &&
          !isWorkspacePackage(request)
        ) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ],
    plugins: [
      ...options.plugins,
      new IgnorePlugin({
        checkResource: (resource) =>
          unusedOptionalPackages.some(
            (pkg) => resource === pkg || resource.startsWith(pkg + '/'),
          ),
      }),
      // @nestjs/terminus utils context module pulls in .d.ts and .js.map files
      new ContextReplacementPlugin(/@nestjs\/terminus\/dist\/utils/, /\.js$/),
    ],
  };
};
