const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a review'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating'],
      min: [1, 'A review must have a rating above or equal to 1.0'],
      max: [5, 'A review must have a rating below or equal to 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // Parent referencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    // Child referencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  // Options object
  {
    // To make sure that virtual properties are also shown when outputting the document as JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
