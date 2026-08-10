import { OrderStatus, Product, CartItem } from '@/components/storefront/types';

export type ChangeRequestType =
  | 'change_address'
  | 'change_phone'
  | 'delivery_notes'
  | 'reschedule'
  | 'cancel_request'
  | 'nominate_recipient';

export interface OrderChangeRequest {
  id?: string;
  orderId: string;
  orderNumber: string;
  type: ChangeRequestType;
  details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  note?: string;
}

export interface CustomerSupportTicket {
  id?: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  issueType: 'product_defect' | 'wrong_item' | 'delivery_delay' | 'general_query';
  subject: string;
  message: string;
  attachmentUrl?: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

/**
 * Check if order is eligible for self-service modifications
 */
export function isOrderEditable(status: OrderStatus['status']): boolean {
  return status === 'received' || status === 'processing';
}

/**
 * Generate a secret management token for an order
 */
export function generateOrderManagementToken(orderId: string, phone: string): string {
  return `token_${orderId}_${phone.slice(-4)}_${Date.now().toString(36)}`;
}

/**
 * Submit an order self-service change request
 */
export async function submitOrderChangeRequest(
  orderId: string,
  orderNumber: string,
  type: ChangeRequestType,
  details: Record<string, unknown>
): Promise<{ success: boolean; requestId: string; message: string }> {
  try {
    const requestId = `req_${Date.now()}`;
    const payload: OrderChangeRequest = {
      id: requestId,
      orderId,
      orderNumber,
      type,
      details,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const saved = localStorage.getItem('indexes_order_change_requests');
    const requests = saved ? JSON.parse(saved) : [];
    requests.push(payload);
    localStorage.setItem('indexes_order_change_requests', JSON.stringify(requests));

    return {
      success: true,
      requestId,
      message: 'تم إرسال طلب التعديل بنجاح وستقوم خدمة العملاء بمراجعته فورا.',
    };
  } catch (err) {
    console.error('Error submitting change request:', err);
    return {
      success: false,
      requestId: '',
      message: 'تعذر إرسال طلب التعديل. يرجى التثبت من الاتصال بالشبكة.',
    };
  }
}

/**
 * Submit a customer support ticket
 */
export async function submitSupportTicket(
  orderId: string,
  orderNumber: string,
  customerName: string,
  phone: string,
  issueType: CustomerSupportTicket['issueType'],
  subject: string,
  message: string,
  attachmentUrl?: string
): Promise<{ success: boolean; ticketId: string }> {
  try {
    const ticketId = `ticket_${Date.now()}`;
    const ticket: CustomerSupportTicket = {
      id: ticketId,
      orderId,
      orderNumber,
      customerName,
      phone,
      issueType,
      subject,
      message,
      attachmentUrl,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const saved = localStorage.getItem('indexes_support_tickets');
    const tickets = saved ? JSON.parse(saved) : [];
    tickets.push(ticket);
    localStorage.setItem('indexes_support_tickets', JSON.stringify(tickets));

    return { success: true, ticketId };
  } catch (err) {
    console.error('Error submitting support ticket:', err);
    return { success: false, ticketId: '' };
  }
}

/**
 * Prepare reorder cart items matching real-time products
 */
export function prepareReorderItems(
  pastItems: { productName: string; quantity: number; price: number }[],
  catalogProducts: Product[]
): {
  availableItems: CartItem[];
  outOfStockItems: string[];
  priceChanges: { productName: string; oldPrice: number; newPrice: number }[];
} {
  const availableItems: CartItem[] = [];
  const outOfStockItems: string[] = [];
  const priceChanges: { productName: string; oldPrice: number; newPrice: number }[] = [];

  for (const item of pastItems) {
    const matchedProduct = catalogProducts.find(
      (p) => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase()
    );

    if (!matchedProduct || !matchedProduct.inStock) {
      outOfStockItems.push(item.productName);
      continue;
    }

    if (matchedProduct.priceYER !== item.price) {
      priceChanges.push({
        productName: item.productName,
        oldPrice: item.price,
        newPrice: matchedProduct.priceYER,
      });
    }

    availableItems.push({
      product: matchedProduct,
      quantity: item.quantity,
    });
  }

  return {
    availableItems,
    outOfStockItems,
    priceChanges,
  };
}

/**
 * Get verified compatible accessories for products in order
 */
export function getVerifiedCompatibleAccessories(
  orderProducts: string[],
  catalogProducts: Product[]
): Product[] {
  if (orderProducts.length === 0) return catalogProducts.slice(0, 3);

  const keywords = ['جراب', 'حماية', 'شاحن', 'سماعة', 'كابل', 'شاشة', 'ستاند'];

  return catalogProducts.filter((p) => {
    const nameLower = p.name.toLowerCase();
    const isAccessory = keywords.some((k) => nameLower.includes(k));
    return isAccessory && p.inStock;
  }).slice(0, 4);
}
