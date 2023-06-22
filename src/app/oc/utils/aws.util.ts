
import { HmacSHA256 } from "crypto-js";
import * as Base64 from "crypto-js/enc-base64";
import { environment } from "environments/environment";
import { curry, defaultTo } from "ramda";
const DEFAULT_REGION = "eu-central-1";

const orDefaultRegion = defaultTo(DEFAULT_REGION);

const createClientForRegion = curry(
  (region: any, ClientConstructor: new (arg0: { region: any; }) => any) =>
    new ClientConstructor({ region: orDefaultRegion(region) })
);

const createClientForDefaultRegion = createClientForRegion(null);

const generateSecretHash = (username: string) => {
  return Base64.stringify(
    HmacSHA256(
      `${username}${environment.appData.awsSdk.ClientId}`,
      environment.appData.awsSdk.ClientSecret
    )
  );
}

const parseJwt =  (token) => {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}


export {
  DEFAULT_REGION,
  createClientForDefaultRegion,
  createClientForRegion,
  orDefaultRegion,
  generateSecretHash,
  parseJwt
};