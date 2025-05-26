const admin = require('../config/firebase-admin');
const User = require('../models/User');

exports.syncUser = async (req, res) => {
  try {
    const { idToken } = req.body;
    // 1. Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // 2. Check if user exists in MongoDB
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      // 3. Create user in MongoDB
      user = await User.create({
        name: name || email,
        email,
        firebaseUid: uid,
        role: 'patient',
      });
    }
    // 4. Return user data
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: 'Invalid token or user creation failed' });
  }
}; 