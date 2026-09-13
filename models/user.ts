export class User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  dob?: Date;

  createdAt: Date = new Date();

  bookmarks?: string[];
  collections?: string[];

  /** Email address confirmed with the emailed code. */
  verified?: boolean;
  /** App language, so account emails arrive in it. */
  language?: "en" | "hy" | "ru";
  /** How the person signs in: "local" (email + password) and/or "google". */
  providers?: string[];
  avatar?: string;
  lastLoginAt?: Date;
}
