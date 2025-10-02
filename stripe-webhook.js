import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.metadata.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId && customerId && subscriptionId) {
          try {
            await db.collection('users').doc(userId).set({
              isPremium: true,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionPlan: session.mode === 'subscription' ? 'premium_monthly' : 'one_time_purchase', // Adjust based on your plans
              subscriptionEndDate: null, // For subscriptions, this will be managed by other webhooks or Stripe directly
            }, { merge: true });
            console.log(`User ${userId} updated with subscription info.`);
          } catch (error) {
            console.error('Error updating user subscription in Firestore:', error);
            return res.status(500).json({ received: true, error: 'Firestore update failed' });
          }
        }
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const userDoc = await db.collection('users').where('stripeCustomerId', '==', customer.id).limit(1).get();

        if (!userDoc.empty) {
          const userIdFromFirestore = userDoc.docs[0].id;
          const isSubscriptionActive = subscription.status === 'active' || subscription.status === 'trialing';
          const endDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;

          await db.collection('users').doc(userIdFromFirestore).set({
            isPremium: isSubscriptionActive,
            subscriptionEndDate: endDate,
            stripeSubscriptionId: isSubscriptionActive ? subscription.id : null,
            subscriptionPlan: isSubscriptionActive ? subscription.items.data[0].price.id : null, // Or a custom plan name
          }, { merge: true });
          console.log(`User ${userIdFromFirestore} subscription status updated to ${isSubscriptionActive}.`);
        }
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
