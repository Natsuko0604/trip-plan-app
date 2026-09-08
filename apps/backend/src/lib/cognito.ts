import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

// Node.jsからAmazon Cognitoへ命令を送るためのクライアント
export const cognitoClient = new CognitoIdentityProviderClient({});
// Lambdaの環境変数からCognito User PoolのIDを取得
export const userPoolId = process.env.COGNITO_USER_POOL_ID;
