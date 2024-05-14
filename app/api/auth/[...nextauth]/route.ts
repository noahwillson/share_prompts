import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDb } from "@/utils/database";
import User from "@/models/user";

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id: string;
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  callbacks: {
    async session({ session }: { session: { user: SessionUser } }) {
      try {
        if (session?.user?.email) {
          await connectToDb();
          const sessionUser = await User.findOne({ email: session.user.email });
          if (sessionUser) {
            session.user.id = sessionUser._id.toString();
          }
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },

    async signIn({ profile }) {
      try {
        await connectToDb();

        const userExists = await User.findOne({ email: profile.email });

        if (!userExists) {
          await User.create({
            email: profile.email,
            username: profile.name.replace(/\s+/g, "").toLowerCase(),
            image: profile.picture,
          });
        }

        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
