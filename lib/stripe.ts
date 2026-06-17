import 'server-only'
import Stripe from 'stripe'

const KEY = process.env.STRIPE_SECRET_KEY

// Returns a configured Stripe client, or null when keys aren't set.
// Lets the billing flow work manually (mark-paid) without Stripe.
let _stripe: Stripe | null | undefined
export function getStripe(): Stripe | null {
  if (_stripe !== undefined) return _stripe
  _stripe = KEY ? new Stripe(KEY, { apiVersion: '2024-06-20' }) : null
  return _stripe
}

export const stripeEnabled = () => !!KEY
