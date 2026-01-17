/**
 * Product Service
 * Manages product inventory and pricing
 */

class ProductService {
  constructor(database, cache) {
    this.db = database;
    this.cache = cache;
  }

  /**
   * Get all products with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Products list with metadata
   */
  async getProducts({ page = 1, limit = 20, category, sortBy = 'createdAt' } = {}) {
    const offset = (page - 1) * limit;

    const query = this.db.products.query();

    if (category) {
      query.where('category', '=', category);
    }

    query.orderBy(sortBy, 'DESC');
    query.limit(limit).offset(offset);

    const products = await query.execute();
    const total = await this.db.products.count(category ? { category } : {});

    return {
      products: products.map(p => this.formatProduct(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product details
   */
  async getProductById(productId) {
    const cacheKey = `product:${productId}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const product = await this.db.products.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const formatted = this.formatProduct(product);

    // Cache for 5 minutes
    await this.cache.set(cacheKey, JSON.stringify(formatted), 300);

    return formatted;
  }

  /**
   * Create new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    const {
      name,
      description,
      price,
      category,
      stock = 0,
      images = [],
      attributes = {}
    } = productData;

    // Validate required fields
    if (!name || !price || !category) {
      throw new Error('Name, price, and category are required');
    }

    if (price < 0) {
      throw new Error('Price cannot be negative');
    }

    const product = await this.db.products.create({
      name,
      description,
      price,
      category,
      stock,
      images,
      attributes,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return this.formatProduct(product);
  }

  /**
   * Update product
   * @param {string} productId - Product ID
   * @param {Object} updates - Product updates
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, updates) {
    const product = await this.db.products.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const allowedFields = ['name', 'description', 'price', 'stock', 'images', 'attributes'];
    const filteredUpdates = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    filteredUpdates.updatedAt = new Date();

    const updated = await this.db.products.update(productId, filteredUpdates);

    // Invalidate cache
    await this.cache.delete(`product:${productId}`);

    return this.formatProduct(updated);
  }

  /**
   * Update product stock
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity change (positive or negative)
   * @returns {Promise<Object>} Updated product
   */
  async updateStock(productId, quantity) {
    const product = await this.db.products.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.stock + quantity;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const updated = await this.db.products.update(productId, {
      stock: newStock,
      updatedAt: new Date()
    });

    await this.cache.delete(`product:${productId}`);

    return this.formatProduct(updated);
  }

  /**
   * Search products
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching products
   */
  async searchProducts(query, { limit = 20, category } = {}) {
    const searchQuery = this.db.products.query();

    searchQuery.where(builder => {
      builder.where('name', 'LIKE', `%${query}%`)
            .orWhere('description', 'LIKE', `%${query}%`);
    });

    if (category) {
      searchQuery.where('category', '=', category);
    }

    searchQuery.limit(limit);

    const products = await searchQuery.execute();

    return products.map(p => this.formatProduct(p));
  }

  /**
   * Get products by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Products in category
   */
  async getProductsByCategory(category) {
    const products = await this.db.products.findMany({ category });
    return products.map(p => this.formatProduct(p));
  }

  /**
   * Delete product
   * @param {string} productId - Product ID
   * @returns {Promise<void>}
   */
  async deleteProduct(productId) {
    await this.db.products.delete(productId);
    await this.cache.delete(`product:${productId}`);
  }

  /**
   * Format product for API response
   * @param {Object} product - Raw product
   * @returns {Object} Formatted product
   */
  formatProduct(product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      category: product.category,
      stock: product.stock,
      images: product.images || [],
      attributes: product.attributes || {},
      available: product.stock > 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }

  /**
   * Get low stock products
   * @param {number} threshold - Stock threshold
   * @returns {Promise<Array>} Low stock products
   */
  async getLowStockProducts(threshold = 10) {
    const products = await this.db.products.query()
      .where('stock', '<=', threshold)
      .orderBy('stock', 'ASC')
      .execute();

    return products.map(p => this.formatProduct(p));
  }
}

module.exports = ProductService;
