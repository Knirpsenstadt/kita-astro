import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: '155d356d38f67503644ff90735b5b6c92d3dc6d6', queries,  });
export default client;
  