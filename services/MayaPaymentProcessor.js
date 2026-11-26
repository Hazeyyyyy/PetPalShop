const BasePaymentProcessor = require('./BasePaymentProcessor');

class MayaPaymentProcessor extends BasePaymentProcessor {
    constructor() {
        super();

        this.checkoutUrl =
            'https://pg-sandbox.paymaya.com/checkout/v1/checkouts';

        this.paymentStatusUrl =
            'https://pg-sandbox.paymaya.com/payments/v1/payments';
    }

    async createCheckout(amount, referenceNumber) {
        const response = await fetch(this.checkoutUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization':
                    'Basic ' +
                    Buffer.from(
                        process.env.MAYA_PUBLIC_KEY + ':'
                    ).toString('base64')
            },
            body: JSON.stringify({
                totalAmount: {
                    value: Number(Number(amount).toFixed(2)),
                    currency: 'PHP'
                },
                requestReferenceNumber: referenceNumber
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error('Maya Checkout request failed.');
        }

        return data;
    }

    async getPaymentStatus(paymentReference) {
        const response = await fetch(
            `${this.paymentStatusUrl}/${encodeURIComponent(paymentReference)}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization':
                        'Basic ' +
                        Buffer.from(
                            process.env.MAYA_SECRET_KEY + ':'
                        ).toString('base64')
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                'Unable to retrieve payment status from Maya.'
            );
        }

        return data;
    }
}

module.exports = MayaPaymentProcessor;