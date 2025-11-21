import { Amplify } from "aws-amplify";

// Real AWS Amplify Configuration
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_7fvXVi5oM",
      userPoolClientId: "2o666u62o03djnouag1fsu8hi1", 
      signUpVerificationMethod: "code",
      loginWith: { 
        email: true 
      },
    },
  },
  API: {
    endpoints: [
      {
        name: "ClinicaVoiceAPI",
        endpoint: "https://r7le6kf535.execute-api.us-east-1.amazonaws.com",
        region: "us-east-1",
      },
    ],
  },
  Storage: {
    S3: {
      bucket: "terraform-20251121023049872500000001",
      region: "us-east-1",
    },
  },
};

Amplify.configure(awsConfig);

console.log("✅ Real Amplify configured successfully");

export default awsConfig;