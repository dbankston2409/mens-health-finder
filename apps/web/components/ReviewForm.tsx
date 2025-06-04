import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/contexts/authContext';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ReviewFormProps {
  clinicId?: number;
  reviewId?: string;
  initialRating?: number;
  initialText?: string;
  onSuccess?: () => void;
  isEdit?: boolean;
}

const ReviewForm = ({
  clinicId,
  reviewId,
  initialRating = 0,
  initialText = '',
  onSuccess,
  isEdit = false}: ReviewFormProps) => {
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If in edit mode and we have a review ID, fetch the review data
    const fetchReview = async () => {
      if (isEdit && reviewId) {
        try {
          const reviewDoc = await getDoc(doc(db, 'reviews', reviewId));
          if (reviewDoc.exists()) {
            const reviewData = reviewDoc.data();
            setRating(reviewData.rating);
            setText(reviewData.text);
          } else {
            setErrorMessage('Review not found');
          }
        } catch (error) {
          console.error('Error fetching review:', error);
          setErrorMessage('Error fetching review details');
        }
      }
    };

    fetchReview();
  }, [isEdit, reviewId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (rating === 0) {
      setErrorMessage('Please select a rating');
      return;
    }

    if (text.trim().length < 10) {
      setErrorMessage('Please enter at least 10 characters for your review');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      if (isEdit && reviewId) {
        // Update existing review
        await updateDoc(doc(db, 'reviews', reviewId), {
          rating,
          text,
          updatedAt: serverTimestamp()});
      } else if (clinicId) {
        // Create new review
        await addDoc(collection(db, 'reviews'), {
          clinicId,
          userId: currentUser.uid,
          rating,
          text,
          createdAt: serverTimestamp()});
      }

      setIsSubmitted(true);
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to dashboard reviews tab
        router.push('/dashboard?tab=reviews');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      setErrorMessage('Failed to save your review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-6">
      {isSubmitted ? (
        <div className="text-center py-6">
          <svg
            className="w-16 h-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-bold mb-2">Thank You!</h3>
          <p className="text-[#AAAAAA] mb-4">
            Your review has been successfully {isEdit ? 'updated' : 'submitted'}.
          </p>
          <button
            className="btn py-2 px-6"
            onClick={() => router.push('/dashboard?tab=reviews')}
          >
            Go to My Reviews
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-4">
              {isEdit ? 'Edit Your Review' : 'Write a Review'}
            </h3>

            {errorMessage && (
              <div className="bg-red-900/40 text-white p-4 rounded-lg mb-6">
                {errorMessage}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Rating <span className="text-primary">*</span>
              </label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="w-10 h-10 focus:outline-none"
                    onClick={() => setRating(star)}
                  >
                    <svg
                      className={`w-8 h-8 ${
                        star <= rating ? 'text-yellow-400' : 'text-[#444]'
                      }`}
                      fill={star <= rating ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-[#AAAAAA]">
                  {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select a rating'}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="review-text" className="block text-sm font-medium mb-2">
                Your Review <span className="text-primary">*</span>
              </label>
              <textarea
                id="review-text"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input w-full resize-none"
                placeholder="Share your experience with this clinic..."
                required
              ></textarea>
              <p className="mt-1 text-xs text-[#AAAAAA]">
                Minimum 10 characters
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="btn-secondary py-2 px-4"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn py-2 px-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEdit ? 'Updating...' : 'Submitting...'}
                  </span>
                ) : (
                  isEdit ? 'Update Review' : 'Submit Review'
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReviewForm;