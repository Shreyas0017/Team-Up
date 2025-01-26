# Hackathon Team Builder

## Overview
Hackathon Team Builder is a web application designed to help college students form effective teams for hackathons and group projects. The app enables skill-based matching, efficient scheduling, and seamless collaboration between team members, fostering a welcoming environment for both beginners and experienced individuals.

---

## Features
### 1. **Skill-Based Matching**
- Users create profiles highlighting their skills (e.g., web development, design, product management).
- Smart matching system suggests teammates with complementary skills.

### 2. **Scheduling Coordination**
- Shared calendar and availability indicators to align schedules.

### 3. **Networking Beyond Friend Circles**
- Discover teammates beyond immediate social circles using search and filter options.

### 4. **Role Guidance**
- Recommendations for team roles based on project requirements.
- Templates and resources for dividing responsibilities.

### 5. **Support for Beginners**
- Icebreakers and introduction templates.
- Opportunities to connect with experienced peers.

### 6. **Collaboration Tools**
- Real-time chat, project boards, and file-sharing features.

---

## Technical Features
### **Authentication**
- Google Login integration for seamless sign-up and login.

### **Database**
- Firebase Firestore for real-time data management.
- Firestore security rules for secure access control.

### **Hosting**
- Firebase Hosting for fast and reliable deployment.

### **AI Recommendations (Optional)**
- AI-powered teammate matching based on skills and availability.

---

---

## Installation

### Prerequisites
- Node.js (>= 16.0)
- Firebase account and project

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Sahnik0/hackathon-team-builder.git
   cd project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project.
   - Enable Firestore and Authentication (Google provider).
   - Add your Firebase configuration in `src/lib/firebase.ts`:
     ```typescript
     import { initializeApp } from 'firebase/app';
     import { getAuth, GoogleAuthProvider } from 'firebase/auth';
     import { getFirestore } from 'firebase/firestore';

     const firebaseConfig = {
       apiKey: "<YOUR_API_KEY>",
       authDomain: "<YOUR_AUTH_DOMAIN>",
       projectId: "<YOUR_PROJECT_ID>",
       storageBucket: "<YOUR_STORAGE_BUCKET>",
       messagingSenderId: "<YOUR_MESSAGING_SENDER_ID>",
       appId: "<YOUR_APP_ID>",
       measurementId: "<YOUR_MEASUREMENT_ID>"
     };

     const app = initializeApp(firebaseConfig);
     export const auth = getAuth(app);
     export const googleProvider = new GoogleAuthProvider();
     export const db = getFirestore(app);
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open the app in your browser at `http://localhost:5173`.

---

## Deployment
1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

---

## Firestore Security Rules
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /teams/{teamId} {
      allow read: if request.auth != null && resource.data.members.hasAny([request.auth.uid]);
      allow create: if request.auth != null && request.resource.data.members.hasAny([request.auth.uid]);
    }

    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        exists(/databases/$(database)/documents/teams/$(request.resource.data.teamId)) &&
        get(/databases/$(database)/documents/teams/$(request.resource.data.teamId)).data.members.hasAny([request.auth.uid]);
    }

    match /teamRequests/{requestId} {
      allow read: if request.auth != null && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid
      );
      allow create: if request.auth != null && request.resource.data.senderId == request.auth.uid;
      allow update: if request.auth != null && resource.data.receiverId == request.auth.uid;
    }
  }
}
```

---

## Contributors
https://github.com/sanks011

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.

---

## Contact
For queries or feedback, please reach out to:
- Name: Sahnik Biswas
- Email: biswassahnik@gmail.com
- GitHub: https://github.com/Sahnik0

