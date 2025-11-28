// src/scripts/makeAdmin.js
// Run this once to make a user admin
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

export async function makeUserAdmin(email) {
  try {
    // Find user by email
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USERS_PROFILE,
      [Query.equal('email', email)]
    );

    if (response.documents.length === 0) {
      console.error('User not found');
      return;
    }

    const user = response.documents[0];

    // Update role to admin
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USERS_PROFILE,
      user.$id,
      { role: 'admin' }
    );

    console.log(`User ${email} is now an admin!`);
  } catch (error) {
    console.error('Error making user admin:', error);
  }
}

// Usage: makeUserAdmin('your-email@example.com');