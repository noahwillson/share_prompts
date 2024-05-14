import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDb } from "@/utils/database";
import User from "@/models/user";

// Define the structure of the profile object
interface Profile {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

// Explicitly define the structure of the user object
interface NextAuthUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id?: string | null; // id should also be optional initially
}

interface Session extends DefaultSession {
  user?: NextAuthUser;
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  callbacks: {
    async session({ session }: { session: Session }) {
      try {
        if (session.user && session.user.email) {
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

    async signIn({ profile }: { profile?: Profile }) {
      // Make profile optional
      try {
        if (!profile) {
          // Handle the case where profile is undefined
          throw new Error("Profile is undefined");
        }

        await connectToDb();

        const userExists = await User.findOne({ email: profile.email });

        if (!userExists) {
          // Use optional chaining to safely access profile?.picture
          const image = profile?.picture ?? "default-image-url";

          await User.create({
            email: profile.email,
            username: profile.name?.replace(/\s+/g, "").toLowerCase(),
            image: image,
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
