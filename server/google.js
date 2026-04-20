import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { pool } from "./db.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;

      // 既存ユーザー検索
      let result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );

      let user = result.rows[0];

      // なければ作成
      if (!user) {
        const newUser = await pool.query(
          `INSERT INTO users (username, email)
           VALUES ($1, $2)
           RETURNING *`,
          [profile.displayName, email]
        );
        user = newUser.rows[0];
      }

      return done(null, user);
    }
  )
);