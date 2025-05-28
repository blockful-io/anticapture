import { createServer } from 'node:http';
import { writeFileSync } from 'fs';

import { printSchema } from 'graphql';
import { getMesh } from '@graphql-mesh/runtime';
import { createMeshHTTPHandler } from '@graphql-mesh/http';

import config from '../.meshrc';

const bootstrap = async () => {
  const mesh = await getMesh(await config)

  writeFileSync('schema.graphql', printSchema(mesh.schema));

  const handler = createMeshHTTPHandler({
    baseDir: __dirname,
    getBuiltMesh: () => Promise.resolve(mesh),
  });

  const server = createServer((req, res) => handler(req, res));
  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    console.log(`🚀 Mesh running at http://localhost:${port}/graphql`);
  });
};

bootstrap();
