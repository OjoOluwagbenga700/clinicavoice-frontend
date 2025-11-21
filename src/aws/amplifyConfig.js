import { Amplify } from "aws-amplify";

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_23cH8bX6E",
      userPoolClientId: "7hn7q4dffj72k97der2lqe37is"
    }
  }
};

Amplify.configure(awsConfig);

export default awsConfig;