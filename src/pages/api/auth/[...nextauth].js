// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcryptjs from "bcryptjs";
import { User } from "@/models/userModel";
import { Snowflake } from "@theinternetfolks/snowflake";
import connectDb from "@/utils/db";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID, // Removed NEXT_PUBLIC_ prefix
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Removed NEXT_PUBLIC_ prefix
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          await connectMongoose(); // Use the mongoose connection instead

          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const user = await User.findOne({ email: credentials.email }).select(
            "+password"
          );

          if (!user) {
            throw new Error("No user found with this email");
          }

          if (!user.password) {
            throw new Error(
              "This account was created with a social provider. Please sign in with that provider."
            );
          }

          const isPasswordValid = await bcryptjs.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            createdAt: user.created_at,
          };
        } catch (error) {
          console.error("Authorization error:", error.message);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          await connectDb();

          const existingUser = await User.findOne({
            $or: [{ email: profile.email }, { googleId: profile.sub }],
          });

          if (!existingUser) {
            const newUserId = Snowflake.generate();
            await User.create({
              _id: newUserId,
              name: profile.name,
              email: profile.email,
              password: await bcryptjs.hash(
                Math.random().toString(36).slice(-8),
                10
              ),
              provider: "google",
              googleId: profile.sub,
              created_at: new Date(),
            });
          } else if (!existingUser.googleId) {
            await User.updateOne(
              { _id: existingUser._id },
              {
                $set: {
                  googleId: profile.sub,
                  provider: "google",
                },
              }
            );
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.provider = account?.provider || "credentials";
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.provider = token.provider;
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Removed NEXT_PUBLIC_ prefix
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: "/auth",
    signOut: "/auth",
    error: "/auth", // Error code passed in query string as ?error=
    newUser: "/welcome", // New users will be directed here on first sign in
  },
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
};

export default NextAuth(authOptions);
