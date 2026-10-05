import { Amplify } from "aws-amplify";

const COGNITOUSERPOOLID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const COGNITOUSERPOOLCLIENTID =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: `${COGNITOUSERPOOLID}`,
      userPoolClientId: `${COGNITOUSERPOOLCLIENTID}`,
      loginWith: {
        email: true,
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
});
