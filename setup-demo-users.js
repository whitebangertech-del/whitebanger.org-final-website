#!/usr/bin/env node

console.log(`
White Banger now uses Firebase only.

Demo users should be created in Firebase Authentication, then given a matching
document in Firestore:

Collection: users
Document ID: Firebase Auth user uid

Example fields:
{
  "name": "Demo Admin",
  "email": "admin@whitebanger.org",
  "role": "admin",
  "phone": "+91-9876543210",
  "avatar": "DA"
}

Supported roles: admin, teacher, student.

The browser login at /erp/login.html reads Firebase Auth plus this Firestore
users document. No separate backend setup is required beyond Firebase.
`);
