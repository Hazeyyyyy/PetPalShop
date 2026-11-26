class PaymentService {
    constructor(paymentProcessor) {
        this.paymentProcessor = paymentProcessor;
    }

    async createCheckout(amount, referenceNumber) {
        return await this.paymentProcessor.createCheckout(
            amount,
            referenceNumber
        );
    }

    async getPaymentStatus(paymentReference) {
        return await this.paymentProcessor.getPaymentStatus(
            paymentReference
        );
    }
}

module.exports = PaymentService;