export function getShortReview(review, maxWords = 3) {
  const text = String(review || '').trim();
  if (!text) return '';

  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

export function computeRatingHistogram(reviews = [], maxRating = 5) {
  const histogram = Array.from({ length: maxRating }, () => 0);
  let total = 0;
  let count = 0;

  reviews.forEach((review) => {
    const rating = Number(review?.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > maxRating) {
      return;
    }
    histogram[rating - 1] += 1;
    total += rating;
    count += 1;
  });

  return {
    histogram,
    averageScore: count > 0 ? (total / count).toFixed(1) : 0,
  };
}
