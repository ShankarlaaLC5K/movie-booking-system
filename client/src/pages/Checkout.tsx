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
  useParams,
} from "react-router-dom";

import {
  useBooking,
} from "../context/BookingContext";

import {
  cancelBooking,
  createBooking,
  getBookingById,
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
    bookingId: routeBookingId,
  } = useParams<{
    bookingId: string;
  }>();

  const {
    showId: contextShowId,
    selectedSeatIds: contextSeatIds,
    selectedSeatNames: contextSeatNames,
    expiresAt: contextExpiresAt,
    clearBooking,
  } = useBooking();

  const [pendingBooking, setPendingBooking] =
    useState<any>(null);

  const [loadingBooking, setLoadingBooking] =
    useState(Boolean(routeBookingId));

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

   useEffect(() => {
    if (!routeBookingId) {
      setPendingBooking(null);
      setLoadingBooking(false);

      return;
    }

    const loadPendingBooking =
      async () => {
        try {
          setLoadingBooking(true);
          setError("");

          const response =
            await getBookingById(
              routeBookingId
            );

          const booking =
            response.booking;

          if (
            booking.status.toLowerCase() !==
            "pending"
          ) {
            setError(
              "This booking is no longer pending."
            );

            return;
          }

          setPendingBooking(
            booking
          );
        } catch (error: any) {
          console.error(
            "Failed to load pending booking:",
            error
          );

          setError(
            error?.response?.data?.message ||
              "Failed to load pending booking."
          );
        } finally {
          setLoadingBooking(false);
        }
      };

    void loadPendingBooking();
  }, [routeBookingId]);

  

  const activeShowId =
    pendingBooking
      ? typeof pendingBooking.show ===
        "object"
        ? pendingBooking.show._id
        : pendingBooking.show
      : contextShowId;

  const activeSeatIds =
    pendingBooking
      ? Array.isArray(
          pendingBooking.seats
        )
        ? pendingBooking.seats.map(
            (seat: any) =>
              typeof seat === "string"
                ? seat
                : seat._id
          )
        : []
      : contextSeatIds;

  const activeSeatNames: string[] =
  pendingBooking
    ? Array.isArray(
        pendingBooking.seats
      )
        ? pendingBooking.seats.map(
            (seat: any): string => {
              if (
                typeof seat ===
                "string"
              ) {
                return seat;
              }

              if (
                seat.row &&
                seat.number !==
                  undefined
              ) {
                return `${seat.row}${seat.number}`;
              }

              return seat._id;
            }
          )
        : []
    : contextSeatNames;

  const activeExpiresAt =
    pendingBooking?.expiresAt
      ? new Date(
          pendingBooking.expiresAt
        ).getTime()
      : contextExpiresAt;

 
  useEffect(() => {
    if (!activeShowId) {
      setShowPrice(null);
      setPriceLoading(false);

      return;
    }

    const loadShowPrice =
      async () => {
        try {
          setPriceLoading(true);

          const response =
            await api.get<ShowPriceResponse>(
              `/shows/${activeShowId}`
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

         
          if (
            pendingBooking &&
            Number(
              pendingBooking.totalAmount
            ) > 0 &&
            activeSeatIds.length > 0
          ) {
            setShowPrice(
              Number(
                pendingBooking.totalAmount
              ) /
                activeSeatIds.length
            );
          } else {
            setShowPrice(null);
          }
        } finally {
          setPriceLoading(false);
        }
      };

    void loadShowPrice();
  }, [
    activeShowId,
    pendingBooking,
    activeSeatIds.length,
  ]);

  
  useEffect(() => {
    if (!activeExpiresAt) {
      setTimeLeft(null);

      return;
    }

    const updateTimer =
      () => {
        const remaining =
          Math.max(
            0,
            activeExpiresAt -
              Date.now()
          );

        setTimeLeft(
          remaining
        );
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
  }, [activeExpiresAt]);

 
  if (loadingBooking) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950 px-4 py-20 text-white">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <Ticket size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Loading Booking
          </h1>

          <p className="mt-2 text-slate-400">
            Loading your pending booking...
          </p>
        </div>
      </section>
    );
  }

 
  if (
    !activeShowId ||
    !activeSeatIds.length
  ) {
    return (
      <section className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-950 px-4 py-20 text-white">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <Ticket size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            No seats selected
          </h1>

          <p className="mt-2 text-slate-400">
            Please select seats before continuing.
          </p>

          {error && (
            <p className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              navigate("/movies")
            }
            className="mt-6 rounded-lg bg-red-600 px-5 py-3 font-semibold transition hover:bg-red-700"
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
    activeSeatIds.length;

  const totalAmount =
    pendingBooking
      ? Number(
          pendingBooking.totalAmount
        ) || 0
      : showPrice !== null
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
    ).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

 
  const handleBackToSeats =
    async () => {
      try {
        setBackLoading(true);
        setError("");

        if (pendingBooking) {
          await cancelBooking(
            pendingBooking._id
          );

          clearBooking();

          const pendingShowId =
            typeof pendingBooking.show ===
            "object"
              ? pendingBooking.show._id
              : pendingBooking.show;

          navigate(
            `/shows/${pendingShowId}/seats`
          );

          return;
        }

        await unlockSeats(
          activeShowId,
          activeSeatIds
        );

        clearBooking();

        navigate(
          `/shows/${activeShowId}/seats`
        );
      } catch (error: any) {
        console.error(
          "Failed to return to seat selection:",
          error
        );

        setError(
          error?.response?.data?.message ||
            "Unable to return to seat selection. Please try again."
        );
      } finally {
        setBackLoading(false);
      }
    };

 
  const checkReservation =
    () => {
      if (
        activeExpiresAt &&
        activeExpiresAt <=
          Date.now()
      ) {
        setError(
          "Your seat reservation has expired. Please select the seats again."
        );

        return false;
      }

      return true;
    };

 
  const getPaymentBooking =
    async () => {
      if (pendingBooking) {
        return pendingBooking;
      }

      const bookingResponse =
        await createBooking({
          showId: activeShowId,
          seatIds: activeSeatIds,
        });

      return bookingResponse.booking;
    };

  
  const handleMockPayment =
    async () => {
      if (!checkReservation()) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const booking =
          await getPaymentBooking();

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
          error?.response?.data?.message ||
            "Development payment failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };


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

          setLoading(false);

          return;
        }

        const booking =
          await getPaymentBooking();

        const paymentOrder =
          await createPaymentOrder(
            booking._id
          );

        const razorpay =
          new window.Razorpay({
            key:
              paymentOrder.keyId,

            amount:
              paymentOrder.order.amount,

            currency:
              paymentOrder.order.currency,

            name: "MovieBooking",

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
                  error?.response?.data?.message ||
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
          error?.response?.data?.message ||
            "Unable to process payment. Please try again."
        );

        setLoading(false);
      }
    };

  return (
    <section className="min-h-[calc(100vh-140px)] bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">

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
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft size={17} />

            {backLoading
              ? "Returning..."
              : "Back to Seats"}
          </button>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Booking Summary
          </h1>

          <p className="mt-2 text-slate-400">
            Review your seats and complete your payment.
          </p>

          {pendingBooking && (
            <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
              You are continuing an existing
              pending booking. Your selected
              seats are already reserved.
            </div>
          )}
        </div>

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
                    ? "text-red-400"
                    : "text-yellow-400"
                }
              />

              <div>
                <p className="text-sm text-slate-400">
                  Seat reservation
                </p>

                <p className="font-semibold">
                  {timerExpired
                    ? "Reservation expired"
                    : "Complete payment before the timer ends"}
                </p>
              </div>
            </div>

            <span
              className={`text-2xl font-bold tabular-nums ${
                timerExpired
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {formatTimer(
                timeLeft
              )}
            </span>
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">

          <div>
            <div className="flex items-center gap-2">
              <Ticket
                size={18}
                className="text-red-500"
              />

              <p className="text-sm text-slate-400">
                Selected Seats
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {activeSeatNames.map(
                (
                  seatName,
                  index
                ) => (
                  <span
                    key={`${seatName}-${index}`}
                    className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400"
                  >
                    {seatName}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="my-6 border-t border-slate-800" />

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-slate-400">
                Number of seats
              </span>

              <span className="font-semibold">
                {seatCount}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">
                Price per seat
              </span>

              <span className="font-semibold">
                {priceLoading
                  ? "Loading..."
                  : showPrice !== null
                  ? `₹${showPrice.toFixed(2)}`
                  : "Unavailable"}
              </span>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  Total Amount
                </span>

                <span className="text-2xl font-bold text-red-400">
                  {priceLoading &&
                  !pendingBooking
                    ? "..."
                    : totalAmount !==
                      null
                    ? `₹${totalAmount.toFixed(2)}`
                    : "Unavailable"}
                </span>
              </div>
            </div>

          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
                  <CreditCard size={20} />
                </div>

                <div>
                  <p className="font-semibold">
                    Payment
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Secure payment via Razorpay
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-md bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                <ShieldCheck size={14} />
                Secure
              </div>

            </div>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">

              <p className="text-sm font-semibold text-yellow-400">
                Development Test Payment
              </p>

              <p className="mt-1 text-xs text-yellow-300/80">
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

          <button
            type="button"
            disabled={
              loading ||
              backLoading ||
              timerExpired ||
              priceLoading ||
              totalAmount ===
                null
            }
            onClick={
              handleRazorpayPayment
            }
            className="mt-5 w-full rounded-lg bg-red-600 px-5 py-3.5 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing Payment..."
              : timerExpired
              ? "Reservation Expired"
              : priceLoading &&
                !pendingBooking
              ? "Loading Amount..."
              : `Pay ₹${
                  totalAmount?.toFixed(
                    2
                  ) ?? "0.00"
                } with Razorpay`}
          </button>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
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