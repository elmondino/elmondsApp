import NextAuth from "next-auth";
import Providers from "next-auth/providers";

import { verifyPassword } from "../../../lib/auth";
import { connectToDatabase } from "../../../lib/db";

export default NextAuth({
  session: {
    jwt: true,
  },
  providers: [
    // !------- Remove Google authentication for the moment. -------!
    // Providers.Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
    Providers.Credentials({
      name: "Email and Password",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "Please enter your email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Please enter your password",
        },
      },
      async authorize(credentials) {
        const client = await connectToDatabase();

        const usersCollection = client.db().collection("users");

        const user = await usersCollection.findOne({
          email: credentials.email,
        });

        if (!user) {
          client.close();
          throw new Error("User not found!");
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          client.close();
          throw new Error("Incorrect password!");
        }

        if (user && isValid) {
          client.close();
          return { email: user.email };
        }
      },
    }),
  ],
});
