const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createBetaAnalytics() {
  const uid = "test123"; // Or generate a dynamic one
  const now = new Date();

  const data = {
    uid: uid,
    signupDate: now,
    onboardingCompleted: false,
    firstSessionMessageCount: 0,
    activatedUser: false,
    day1Active: false,
    day2Active: false,
    day7Active: false,
    usedChat: false,
    usedJournal: false,
    journalsCreatedCount: 0,
    checkinsCompletedCount: 0,
    crisisFlagTriggered: false,
    continuedAfterCrisis: false,
    fallbackResponsesCount: 0,
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now
  };

  try {
    await db.collection("betaAnalytics").doc(uid).set(data);
    console.log("✅ Document successfully written!");
  } catch (error) {
    console.error("Error writing document: ", error);
  }
}

createBetaAnalytics();