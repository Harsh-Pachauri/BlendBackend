// api/index.ts
import serverless from 'serverless-http';
import { app } from '../src/app'; // Assuming your Express app is exported from here

export const handler = serverless(app);
