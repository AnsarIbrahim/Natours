/* eslint-disable no-undef */
import axios from 'axios';
import { showAlert } from './alert';

let stripe;

window.onload = () => {
  stripe = Stripe(
    'pk_test_51OU45dSCOGDIr8ryS7y8a7Gf3JBGL6VkxXiVHe3NS6i8z4J1GI8F3f29YLlU5duhXvqZ0Pu496HtVz2yp1abtMxT00g6tCxi1A',
  );
};

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
