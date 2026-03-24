/**
 * blockchain.service.js — Bridge to Fabric Gateway
 * 
 * Location: app_backend/src/services/blockchain.service.js
 * 
 * This service No longer talks to Fabric directly. 
 * Instead, it forwards all requests to the Fabric Gateway (Port 4000).
 * 
 * Flow: 
 * Frontend (3000) → app_backend (5000) → fabric_gateway (4000) → Hyperledger (9090)
 */

const axios = require('axios');

class BlockchainService {
  constructor() {
    this.gatewayUrl = process.env.FABRIC_GATEWAY_URL || 'http://localhost:4000/api';
    this.api = axios.create({
      baseURL: this.gatewayUrl,
      timeout: 30000, // Fabric can be slow
    });
  }

  /**
   * Helper: Forward the user's JWT so the Gateway (4000)
   * can identify the Org and sign the transaction.
   */
  async _forward(method, endpoint, data = null, token) {
    try {
      if (!token) throw new Error('Authentication token required to call Fabric Gateway');
      
      const response = await this.api({
        method,
        url:     endpoint,
        data,
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data; // Return the actual ledger data
    } catch (error) {
      console.error(`❌ Fabric Gateway Bridge Error (${endpoint}):`, error.response?.data?.message || error.message);
      throw { 
        error: 'GATEWAY_ERROR', 
        message: error.response?.data?.message || `Gateway call failed: ${error.message}` 
      };
    }
  }

  // ─── Legacy Bridge ──────────────────────────────────────────

  _getSystemToken(org) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: 'system', email: 'system@parampara.in', role: 'system', org: org || 'NGOOrg', name: 'System Interop' },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
      { expiresIn: '15m' }
    );
  }

  async submitTransaction(org, fcn, ...args) {
    const res = await this._forward('POST', '/system/invoke', { fcn, args }, this._getSystemToken(org));
    // Legacy support: the app backend expects submitTransaction to return a string (txId)
    // If the chaincode payload returns an object (like {success:true}), we convert it or mock a TxId.
    if (res && res.txId) return res.txId;
    if (res && typeof res === 'object') return `tx-${Date.now()}`;
    return String(res || `tx-${Date.now()}`);
  }

  async evaluateTransaction(org, fcn, ...args) {
    return this._forward('POST', '/system/query', { fcn, args }, this._getSystemToken(org));
  }

  // ─── Products ──────────────────────────────────────────

  async registerProduct(productData, token) {
    return this._forward('POST', '/products', productData, token);
  }

  async getProduct(productId, token) {
    return this._forward('GET', `/products/${productId}`, null, token);
  }

  async getAllProducts(token) {
    return this._forward('GET', '/products', null, token);
  }

  async getHistory(productId, token) {
    return this._forward('GET', `/products/${productId}/history`, null, token);
  }

  async verifyProduct(productId, token) {
    return this._forward('GET', `/products/${productId}/verify`, null, token);
  }

  async addLifecycleEvent(productId, eventData, token) {
    return this._forward('POST', `/products/${productId}/lifecycle`, eventData, token);
  }

  async addMarginAndTransfer(productId, transferData, token) {
    // Note: Fabric Gateway has specialized routes for margin + transfer
    await this._forward('POST', `/products/${productId}/margin`, { marginValue: transferData.marginValue }, token);
    return this._forward('POST', `/products/${productId}/transfer`, { toOrg: transferData.toOrg }, token);
  }

  // ─── Artisans ──────────────────────────────────────────

  async registerArtisan(artisanData, token) {
    return this._forward('POST', '/artisans', artisanData, token);
  }

  async validateArtisan(artisanId, isValid, token) {
    return this._forward('POST', `/artisans/${artisanId}/validate`, { isValid }, token);
  }

  async getAllArtisans(token) {
    return this._forward('GET', '/artisans', null, token);
  }

  // ─── Tokens ───────────────────────────────────────────

  async getTokenBalance(token) {
    return this._forward('GET', '/tokens/balance', null, token);
  }

  async redeemTokens(amount, token) {
    return this._forward('POST', '/tokens/redeem', { amount }, token);
  }
}

module.exports = new BlockchainService();
