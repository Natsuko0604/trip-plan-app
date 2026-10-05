import { signIn } from "aws-amplify/auth";

export const loginPost = async () => {
  await signIn({
    username: "hello@mycompany.com",
    password: "hunter2",
  });
};
