/**
 * Order Service
 * Manages order processing and fulfillment
 */

class OrderService {
  constructor(database, productService, emailService) {
    this.db = database;
    this.productService = productService;
    this.emailService = emailService;
  }

  /**
   * Create new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    const { userId, items, shippingAddress, paymentMethod } = orderData;

    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Validate and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await this.productService.getProductById(item.productId);

      if (!product.available) {
        throw new Error(`Product ${product.name} is not available`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }

    const tax = subtotal * 0.1; // 10% tax
    const shipping = this.calculateShipping(subtotal);
    const total = subtotal + tax + shipping;

    // Create order in transaction
    const order = await this.db.transaction(async (trx) => {
      // Create order
      const newOrder = await trx.orders.create({
        userId,
        items: orderItems,
        subtotal,
        tax,
        shipping,
        total,
        shippingAddress,
        paymentMethod,
        status: 'pending',
        createdAt: new Date()
      });

      // Update product stock
      for (const item of items) {
        await this.productService.updateStock(item.productId, -item.quantity);
      }

      return newOrder;
    });

    // Send confirmation email
    await this.emailService.sendOrderConfirmation(userId, order);

    return this.formatOrder(order);
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrder(orderId) {
    const order = await this.db.orders.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    return this.formatOrder(order);
  }

  /**
   * Get orders for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User orders
   */
  async getUserOrders(userId, { status, limit = 10 } = {}) {
    const query = this.db.orders.query()
      .where('userId', '=', userId)
      .orderBy('createdAt', 'DESC')
      .limit(limit);

    if (status) {
      query.where('status', '=', status);
    }

    const orders = await query.execute();

    return orders.map(order => this.formatOrder(order));
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const order = await this.db.orders.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    const updated = await this.db.orders.update(orderId, {
      status,
      updatedAt: new Date()
    });

    // Send status update email
    await this.emailService.sendOrderStatusUpdate(order.userId, updated);

    return this.formatOrder(updated);
  }

  /**
   * Cancel order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Cancelled order
   */
  async cancelOrder(orderId) {
    const order = await this.db.orders.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      throw new Error('Cannot cancel order that has been shipped or delivered');
    }

    // Restore product stock
    await this.db.transaction(async (trx) => {
      for (const item of order.items) {
        await this.productService.updateStock(item.productId, item.quantity);
      }

      await trx.orders.update(orderId, {
        status: 'cancelled',
        updatedAt: new Date()
      });
    });

    const cancelled = await this.db.orders.findById(orderId);

    return this.formatOrder(cancelled);
  }

  /**
   * Calculate shipping cost
   * @param {number} subtotal - Order subtotal
   * @returns {number} Shipping cost
   */
  calculateShipping(subtotal) {
    if (subtotal >= 100) {
      return 0; // Free shipping over $100
    } else if (subtotal >= 50) {
      return 5;
    } else {
      return 10;
    }
  }

  /**
   * Format order for API response
   * @param {Object} order - Raw order
   * @returns {Object} Formatted order
   */
  formatOrder(order) {
    return {
      id: order.id,
      userId: order.userId,
      items: order.items,
      subtotal: parseFloat(order.subtotal),
      tax: parseFloat(order.tax),
      shipping: parseFloat(order.shipping),
      total: parseFloat(order.total),
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  /**
   * Get order statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Order statistics
   */
  async getOrderStats(userId = null) {
    const query = this.db.orders.query();

    if (userId) {
      query.where('userId', '=', userId);
    }

    const orders = await query.execute();

    const stats = {
      total: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    for (const order of orders) {
      stats[order.status]++;
      if (order.status !== 'cancelled') {
        stats.totalRevenue += parseFloat(order.total);
      }
    }

    return stats;
  }
}

module.exports = OrderService;
