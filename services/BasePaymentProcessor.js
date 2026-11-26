class BasePaymentProcessor {
    constructor() {
        if (new.target === BasePaymentProcessor) {
            throw new Error(
                'BasePaymentProcessor cannot be instantiated directly.'
            );
        }
    }

    async createCheckout(amount, referenceNumber) {
        throw new Error(
            'createCheckout() must be implemented by a subclass.'
        );
    }

    async getPaymentStatus(paymentReference) {
        throw new Error(
            'getPaymentStatus() must be implemented by a subclass.'
        );
    }
}

module.exports = BasePaymentProcessor;