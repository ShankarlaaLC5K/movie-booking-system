import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Clock,
  CreditCard,
  ShieldCheck,
  Ticket,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useBooking,
} from "../context/BookingContext";

import {
  createBooking,
} from "../services/bookingService";

import {
  createPaymentOrder,
  mockPaymentSuccess,
  verifyPayment,
} from "../services/paymentService";

import {
  unlockSeats,
} from "../services/seatService";

import api from "../services/api";

import "../types/razorpay";

interface ShowPriceResponse {
  success: boolean;
  show: {
    _id: string;
    price: number;
    language: string;
    format: string;
  };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(true)
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false)
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

function Checkout() {
  const navigate = useNavigate();

  const {
    showId,
    selectedSeatIds,
    selectedSeatNames,
    expiresAt,
    clearBooking,
  } = useBooking();

  const [loading, setLoading] =
    useState(false);

  const [backLoading, setBackLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showPrice, setShowPrice] =
    useState<number | null>(null);

  const [timeLeft, setTimeLeft] =
    useState<number | null>(null);

  const [priceLoading, setPriceLoading] =
    useState(true);

  // --------------------------------------------------
  // Load show price
  // --------------------------------------------------

  useEffect(() => {
    if (!showId) {
      setPriceLoading(false);
      return;
    }

    const loadShowPrice = async () => {
      try {
        setPriceLoading(true);

        const response =
          await api.get<ShowPriceResponse>(
            `/shows/${showId}`
          );

        setShowPrice(
          Number(
            response.data.show.price
          ) || 0
        );
      } catch (error) {
        console.error(
          "Failed to load show price:",
          error
        );

        setShowPrice(null);
      } finally {
        setPriceLoading(false);
      }
    };

    loadShowPrice();
  }, [showId]);

  // --------------------------------------------------
  // Reservation timer
  // --------------------------------------------------

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        expiresAt - Date.now()
      );

      setTimeLeft(remaining);
    };

    updateTimer();

    const interval =
      window.setInterval(
        updateTimer,
        1000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [expiresAt]);

  // --------------------------------------------------
  // Empty booking protection
  // --------------------------------------------------

  if (
    !showId ||
    !selectedSeatIds.length
  ) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-50 px-4 py-20 text-slate-900 dark:bg-slate-950 dark:text-white">

        <div className="text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <Ticket size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
            No seats selected
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Please select seats before continuing.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/movies")
            }
            className="mt-6 rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Browse Movies
          </button>

        </div>

      </section>
    );
  }

  const timerExpired =
    timeLeft !== null &&
    timeLeft <= 0;

  const seatCount =
    selectedSeatIds.length;

  const totalAmount =
    showPrice !== null
      ? showPrice * seatCount
      : null;

  const formatTimer = (
    milliseconds: number
  ) => {
    const totalSeconds =
      Math.ceil(
        milliseconds / 1000
      );

    const minutes =
      Math.floor(
        totalSeconds / 60
      );

    const seconds =
      totalSeconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      seconds
    ).padStart(
      2,
      "0"
    )}`;
  };

  // --------------------------------------------------
  // BACK TO SEATS
  // --------------------------------------------------

  const handleBackToSeats =
    async () => {
      try {
        setBackLoading(true);
        setError("");

        await unlockSeats(
          showId,
          selectedSeatIds
        );

        clearBooking();

        navigate(
          `/shows/${showId}/seats`
        );
      } catch (error: any) {
        console.error(
          "Failed to unlock seats:",
          error
        );

        setError(
          error?.response?.data
            ?.message ||
            "Unable to return to seat selection. Please try again."
        );
      } finally {
        setBackLoading(false);
      }
    };

  // --------------------------------------------------
  // COMMON EXPIRY CHECK
  // --------------------------------------------------

  const checkReservation =
    () => {
      if (
        expiresAt &&
        expiresAt <= Date.now()
      ) {
        setError(
          "Your seat reservation has expired. Please select the seats again."
        );

        return false;
      }

      return true;
    };

  // --------------------------------------------------
  // MOCK PAYMENT
  // --------------------------------------------------

  const handleMockPayment =
    async () => {
      if (!checkReservation()) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const bookingResponse =
          await createBooking({
            showId,
            seatIds:
              selectedSeatIds,
          });

        const booking =
          bookingResponse.booking;

        const paymentResponse =
          await mockPaymentSuccess(
            booking._id
          );

        clearBooking();

        navigate(
          `/booking-success/${paymentResponse.booking._id}`
        );
      } catch (error: any) {
        console.error(
          "Mock payment failed:",
          error
        );

        setError(
          error?.response?.data
            ?.message ||
            "Development payment failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  // --------------------------------------------------
  // REAL RAZORPAY PAYMENT
  // --------------------------------------------------

  const handleRazorpayPayment =
    async () => {
      if (!checkReservation()) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const razorpayLoaded =
          await loadRazorpayScript();

        if (!razorpayLoaded) {
          setError(
            "Unable to load Razorpay. Please check your internet connection and try again."
          );

          return;
        }

        const bookingResponse =
          await createBooking({
            showId,
            seatIds:
              selectedSeatIds,
          });

        const booking =
          bookingResponse.booking;

        const paymentOrder =
          await createPaymentOrder(
            booking._id
          );

        const razorpay =
          new window.Razorpay({
            key:
              paymentOrder.keyId,

            amount:
              paymentOrder.order
                .amount,

            currency:
              paymentOrder.order
                .currency,

            name:
              "MovieBooking",

            description:
              "Movie ticket booking",

            order_id:
              paymentOrder.order.id,

            handler: async (
              razorpayResponse
            ) => {
              try {
                setLoading(true);
                setError("");

                const verifyResponse =
                  await verifyPayment({
                    bookingId:
                      booking._id,

                    razorpay_order_id:
                      razorpayResponse.razorpay_order_id,

                    razorpay_payment_id:
                      razorpayResponse.razorpay_payment_id,

                    razorpay_signature:
                      razorpayResponse.razorpay_signature,
                  });

                clearBooking();

                navigate(
                  `/booking-success/${verifyResponse.booking._id}`
                );
              } catch (error: any) {
                console.error(
                  "Payment verification failed:",
                  error
                );

                setError(
                  error?.response
                    ?.data?.message ||
                    "Payment verification failed. Please contact support."
                );
              } finally {
                setLoading(false);
              }
            },

            theme: {
              color: "#dc2626",
            },

            modal: {
              ondismiss: () => {
                setLoading(false);

                setError(
                  "Payment was cancelled. Your seat reservation remains active until the timer expires."
                );
              },
            },
          });

        razorpay.open();
      } catch (error: any) {
        console.error(
          "Razorpay checkout failed:",
          error
        );

        setError(
          error?.response?.data
            ?.message ||
            "Unable to process payment. Please try again."
        );

        setLoading(false);
      }
    };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">

      <div className="mx-auto max-w-2xl">

        {/* Header */}

        <div className="mb-8">

          <button
            type="button"
            onClick={
              handleBackToSeats
            }
            disabled={
              loading ||
              backLoading
            }
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            <ArrowLeft size={17} />

            {backLoading
              ? "Returning..."
              : "Back to Seats"}
          </button>

          <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl dark:text-white">
            Booking Summary
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Review your seats and complete your payment.
          </p>

        </div>

        {/* Reservation Timer */}

        {timeLeft !== null && (
          <div
            className={`mb-6 flex items-center justify-between rounded-xl border p-4 ${
              timerExpired
                ? "border-red-500/30 bg-red-500/10"
                : "border-yellow-500/30 bg-yellow-500/10"
            }`}
          >

            <div className="flex items-center gap-3">

              <Clock
                size={21}
                className={
                  timerExpired
                    ? "text-red-500 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }
              />

              <div>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Seat reservation
                </p>

                <p className="font-semibold text-slate-900 dark:text-white">
                  {timerExpired
                    ? "Reservation expired"
                    : "Complete payment before the timer ends"}
                </p>

              </div>

            </div>

            <span
              className={`text-2xl font-bold tabular-nums ${
                timerExpired
                  ? "text-red-500 dark:text-red-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {formatTimer(
                timeLeft
              )}
            </span>

          </div>
        )}

        {/* Main Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">

          {/* Selected Seats */}

          <div>

            <div className="flex items-center gap-2">

              <Ticket
                size={18}
                className="text-red-500"
              />

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Selected Seats
              </p>

            </div>

            <div className="mt-3 flex flex-wrap gap-2">

              {selectedSeatNames.map(
                (
                  seatName,
                  index
                ) => (
                  <span
                    key={`${seatName}-${index}`}
                    className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400"
                  >
                    {seatName}
                  </span>
                )
              )}

            </div>

          </div>

          <div className="my-6 border-t border-slate-200 dark:border-slate-800" />

          {/* Booking Summary */}

          <div className="space-y-4">

            <div className="flex justify-between">

              <span className="text-slate-500 dark:text-slate-400">
                Number of seats
              </span>

              <span className="font-semibold text-slate-900 dark:text-white">
                {seatCount}
              </span>

            </div>

            <div className="flex justify-between">

              <span className="text-slate-500 dark:text-slate-400">
                Price per seat
              </span>

              <span className="font-semibold text-slate-900 dark:text-white">
                {priceLoading
                  ? "Loading..."
                  : showPrice !== null
                  ? `₹${showPrice.toFixed(2)}`
                  : "Unavailable"}
              </span>

            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">

              <div className="flex items-center justify-between">

                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                  Total Amount
                </span>

                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {priceLoading
                    ? "..."
                    : totalAmount !== null
                    ? `₹${totalAmount.toFixed(2)}`
                    : "Unavailable"}
                </span>

              </div>

            </div>

          </div>

          {/* Payment Information */}

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
                  <CreditCard size={20} />
                </div>

                <div>

                  <p className="font-semibold text-slate-900 dark:text-white">
                    Payment
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Secure payment via Razorpay
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-1 rounded-md bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                <ShieldCheck size={14} />
                Secure
              </div>

            </div>

          </div>

          {/* Development Payment */}

          {import.meta.env.DEV && (
            <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">

              <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                Development Test Payment
              </p>

              <p className="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80">
                Use this button to test the complete booking flow without a real payment.
              </p>

              <button
                type="button"
                disabled={
                  loading ||
                  backLoading ||
                  timerExpired
                }
                onClick={
                  handleMockPayment
                }
                className="mt-4 w-full rounded-lg bg-yellow-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Processing Test Payment..."
                  : timerExpired
                  ? "Reservation Expired"
                  : "Complete Test Payment"}
              </button>

            </div>
          )}

          {/* Real Razorpay */}

          <button
            type="button"
            disabled={
              loading ||
              backLoading ||
              timerExpired ||
              priceLoading ||
              showPrice === null
            }
            onClick={
              handleRazorpayPayment
            }
            className="mt-5 w-full rounded-lg bg-red-600 px-5 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing Payment..."
              : timerExpired
              ? "Reservation Expired"
              : priceLoading
              ? "Loading Amount..."
              : `Pay ₹${totalAmount?.toFixed(2) ?? "0.00"} with Razorpay`}
          </button>

          {/* Error */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-slate-500">
            Your selected seats remain reserved until the timer expires.
          </p>

        </div>
      </div>

    </section>
  );
}

export default Checkout;