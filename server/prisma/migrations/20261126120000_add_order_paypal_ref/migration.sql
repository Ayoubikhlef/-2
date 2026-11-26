-- Store the PayPal order id on a store order so the return route and webhook
-- can match a capture to the right order without trusting browser input.
ALTER TABLE "Order" ADD COLUMN "providerRef" TEXT;
ALTER TABLE "Order" ADD COLUMN "checkoutUrl" TEXT;
CREATE UNIQUE INDEX "Order_providerRef_key" ON "Order"("providerRef");
