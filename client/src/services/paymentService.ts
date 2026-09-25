import api from "./api";

export interface CreatePaymentOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    amount: number;
    currency: string;
  };
  payment: {
    _id: string;
    booking: string;
    amount: number;
    provider: string;
    gatewayOrderId: string;
    status: string;
  };
  keyId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  booking: {
    _id: string;
    status: string;
    bookingReference?: string;
    totalAmount: number;
  };
  payment?: {
    _id: string;
    status: string;
    transactionId?: string;
  };
}

export interface MockPaymentResponse {
  success: boolean;
  message: string;
  booking: {
    _id: string;
    status: string;
    bookingReference?: string;
    totalAmount: number;
  };
  payment?: {
    _id: string;
    status: string;
    transactionId?: string;
  };
}

export async function createPaymentOrder(
  bookingId: string
): Promise<CreatePaymentOrderResponse> {
  const response =
    await api.post<CreatePaymentOrderResponse>(
      "/payments/create-order",
      {
        bookingId,
      }
    );

  return response.data;
}

export async function verifyPayment(
  data: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
): Promise<VerifyPaymentResponse> {
  const response =
    await api.post<VerifyPaymentResponse>(
      "/payments/verify",
      data
    );

  return response.data;
}

export async function mockPaymentSuccess(
  bookingId: string
): Promise<MockPaymentResponse> {
  const response =
    await api.post<MockPaymentResponse>(
      "/payments/mock-success",
      {
        bookingId,
      }
    );

  return response.data;
}
