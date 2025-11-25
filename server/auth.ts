import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// CSRF Protection: Verify origin for state-changing requests
export const csrfProtection: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // Only check POST, PUT, DELETE requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    const host = req.get('Host');
    
    // Allow requests without Origin/Referer (same-origin requests from some browsers)
    if (!origin && !referer) {
      return next();
    }
    
    // Validate origin matches the host
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      // Allow Replit dev domains
      process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '',
      process.env.REPLIT_DEPLOYMENT_DOMAIN ? `https://${process.env.REPLIT_DEPLOYMENT_DOMAIN}` : '',
    ].filter(Boolean);
    
    // Safely parse referer URL to extract origin
    let requestOrigin = origin || '';
    if (!requestOrigin && referer) {
      try {
        requestOrigin = new URL(referer).origin;
      } catch (e) {
        // Malformed Referer header - reject the request
        console.warn(`[security] CSRF check failed: malformed Referer header`);
        return res.status(403).json({ message: 'Forbidden: Invalid referer' });
      }
    }
    
    if (requestOrigin && !allowedOrigins.some(allowed => requestOrigin.startsWith(allowed))) {
      console.warn(`[security] CSRF check failed: origin ${requestOrigin} not in allowed list`);
      return res.status(403).json({ message: 'Forbidden: Invalid origin' });
    }
  }
  next();
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: '__Host-session', // Security: Use __Host- prefix for secure cookies
    cookie: {
      httpOnly: true, // Prevent JavaScript access to cookies
      secure: true, // Always use secure in Replit (HTTPS)
      sameSite: 'lax', // CSRF protection - prevents cross-site request forgery
      maxAge: sessionTtl,
      path: '/', // Cookie is valid for all paths
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Use dev domain in development, production domain when deployed
    // This ensures the callback matches the domain user is accessing from
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction 
      ? (process.env.REPLIT_DEPLOYMENT_DOMAIN || process.env.REPLIT_DEV_DOMAIN || 'localhost:5000')
      : (process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DEPLOYMENT_DOMAIN || 'localhost:5000');
    const protocol = 'https';
    const callbackURL = `${protocol}://${domain}/api/auth/google/callback`;
    
    console.log(`[auth] Google OAuth callback URL: ${callbackURL}`);
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      state: true // Enable automatic CSRF state parameter generation and validation
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user information from Google profile
        const userData = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos?.[0]?.value || '',
        };

        // Upsert user to database
        await storage.upsertUser(userData);
        return done(null, userData);
      } catch (error) {
        return done(error, false);
      }
    }));
  }

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Authentication routes - only setup Google routes if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google",
      passport.authenticate("google", { 
        scope: ["profile", "email"]
      })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { 
        failureRedirect: "/"
      }),
      (req, res) => {
        // Security: Regenerate session after successful authentication
        // This prevents session fixation attacks
        const user = req.user;
        req.session.regenerate((err) => {
          if (err) {
            console.error('[auth] Session regeneration error:', err);
            return res.redirect('/');
          }
          // Re-establish the user after session regeneration
          req.login(user as Express.User, (loginErr) => {
            if (loginErr) {
              console.error('[auth] Re-login error:', loginErr);
              return res.redirect('/');
            }
            // Successful authentication, redirect home
            res.redirect("/");
          });
        });
      }
    );
  }

  // User info route - returns only non-sensitive user data
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      // Return only public user information, exclude email for privacy
      const publicUserData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };
      res.json(publicUserData);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Logout route - properly destroy session for security
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('[auth] Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      // Security: Destroy the session completely to prevent session hijacking
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('[auth] Session destroy error:', destroyErr);
        }
        // Clear the session cookie (must match the cookie name set in getSession)
        res.clearCookie('__Host-session', { 
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        });
        res.json({ message: "Logged out successfully" });
      });
    });
  });
}

// Helper function to get user ID from either Google OAuth or Replit Auth
export function getUserId(req: any): string | undefined {
  if (!req.user) return undefined;
  
  // Google OAuth format: { id, email, firstName, ... }
  if (req.user.id && !req.user.claims) {
    return req.user.id;
  }
  
  // Replit Auth format: { claims: { sub, ... }, ... }
  if (req.user.claims?.sub) {
    return req.user.claims.sub;
  }
  
  return undefined;
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};