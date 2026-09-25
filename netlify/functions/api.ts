import serverless from "serverless-http";

import app from "../../server/src/app";
import { connectDB } from "../../server/src/config/db";

const serverlessHandler = serverless(app);

export const handler = async (
  event: any,
  context: any
) => {
  await connectDB();

  return serverlessHandler(
    event,
    context
  );
};