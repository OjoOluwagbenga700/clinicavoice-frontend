import { Amplify } from "aws-amplify";

const awsConfig = {
  Auth: {
    // Standard Amplify Auth configuration keys
    region: "us-east-1",
    userPoolId: "us-east-1_23cH8bX6E",
    userPoolWebClientId: "7hn7q4dffj72k97der2lqe37is",
    identityPoolId: "us-east-1:your-identity-pool-id",
    // Optional settings you can enable/adjust
    authenticationFlowType: "USER_PASSWORD_AUTH",
    // If you want email based signIn, set this in your app logic rather than here
  },
  API: {
    endpoints: [
      {
        name: "ClinicaVoiceAPI",
        endpoint: "https://lj0nce0o5e.execute-api.us-east-1.amazonaws.com",
        region: "us-east-1",
      },
    ],
  },
  Storage: {
    S3: {
      bucket: "terraform-20251121155459706200000001",
      region: "us-east-1",
    },
  },
};

Amplify.configure(awsConfig);



export default awsConfig;