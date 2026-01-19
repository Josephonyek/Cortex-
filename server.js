const express = require('express');
const admin = require('firebase-admin');
const crypto = require('crypto');
const app = express();

// You will get this JSON file from Firebase Settings > Service Accounts
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cortex-gold-6c147-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.post('/paystack-webhook', express.json(), async (req, res) => {
    // 1. Verify that this message is actually from Paystack
    const secret = "pk_test_77e96f0549cd29e76ce2117f8adf00a5a96658ea"; // Get from Paystack Settings
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash == req.headers['x-paystack-signature']) {
        const event = req.body;
        
        if (event.event === 'charge.success') {
            const email = event.data.customer.email;
            const amount = event.data.amount / 100; // Convert Kobo to Naira
            
            // 2. Find user by email and update balance
            const usersRef = db.ref('users');
            const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
            
            if (snapshot.exists()) {
                const userId = Object.keys(snapshot.val())[0];
                db.ref(`users/${userId}/balance`).transaction(current => (current || 0) + amount);
                console.log(`Success: Added ₦${amount} to ${email}`);
            }
        }
    }
    res.sendStatus(200);
});

app.listen(10000, () => console.log('Listener Active on Port 10000'));