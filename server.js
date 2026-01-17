const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

app.post('/bank-webhook', (req, res) => {
    const secret = process.env.SECRET_KEY; // From Paystack
    const signature = req.headers['x-paystack-signature'];
    
    // Check if the signal is actually from the bank
    const hash = crypto.createHmac('sha512', secret)
                       .update(JSON.stringify(req.body))
                       .digest('hex');

    if (hash === signature) {
        const data = req.body.data;
        if (req.body.event === 'charge.success') {
            const amount = data.amount / 100;
            const customer = data.customer.email;
            
            // This will show up in your Render Logs!
            console.log(`[PAYMENT VERIFIED] $${amount} received from ${customer}`);
        }
    }
    res.send(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on Port ${PORT}`);
});
