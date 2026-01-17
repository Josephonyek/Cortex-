const express = require('express');
const app = express();
const crypto = require('crypto');

app.post('/bank-webhook', express.json(), (req, res) => {
    // 1. Verify this message actually came from the Bank/Paystack
    const hash = crypto.createHmac('sha512', 'YOUR_SECRET_KEY')
                       .update(JSON.stringify(req.body)).digest('hex');
    
    if (hash == req.headers['x-paystack-signature']) {
        const event = req.body;
        if (event.event === 'charge.success') {
            const userEmail = event.data.customer.email;
            const amount = event.data.amount / 100; // Convert from kobo/cents
            
            // 2. NOW update the database because the money is confirmed
            updateUserBalance(userEmail, amount);
            console.log(`Verified: Added ${amount} to ${userEmail}`);
        }
    }
    res.send(200);
});
