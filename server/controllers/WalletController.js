const { Op } = require('sequelize');
const { Wallet, WalletType, Notification, User, Role } = require('../models');
const { isAdmin, isOperator, isStaff } = require('../middleware/staffAccess');
const generateUniqueCode = require('../helpers/generateCode');
const { createAuditLog } = require('../helpers/auditLogger');
const { sanitizePrefix } = require('../helpers/mpesaPayment');
const { hasApprovedKyc } = require('../helpers/kycHelper');
const { hasActivePackage } = require('../helpers/subscriptionHelper');

class WalletController {

  // CREATE WALLET
  async create(req, res) {
    try {
      const userId = req.user.userId;

      if (!(await hasApprovedKyc(userId, req.user.roleId))) {
        return res.status(403).json({ error: 'KYC deve ser aprovado para criar novas carteiras' });
      }

      if (!(await hasActivePackage(userId, req.user.roleId))) {
        return res.status(403).json({ error: 'Deve subscrever um pacote para poder criar carteiras' });
      }

      const { walletName, walletTypeId, allowC2B, allowB2C, allowWithdraw } = req.body;

      // validar wallet type
      const walletType = await WalletType.findByPk(walletTypeId);

      if (!walletType || !walletType.status) {
        return res.status(400).json({
          error: 'Invalid wallet type'
        });
      }

      // Referência inicial opcional (até 8 caracteres alfanuméricos) associada à carteira
      let reference = null;
      if (typeof req.body.reference === 'string' && req.body.reference.trim()) {
        reference = sanitizePrefix(req.body.reference);
        if (!reference) {
          return res.status(400).json({
            error: 'A referência deve ter de 1 a 8 caracteres, apenas letras e números.'
          });
        }
      }

      // gerar wallet code único usando o helper
      let walletCode;
      try {
        walletCode = await generateUniqueCode();
      } catch (codeError) {
        return res.status(500).json({
          error: 'Unable to generate unique wallet code: ' + codeError.message
        });
      }

      const wallet = await Wallet.create({
        userId,
        walletTypeId,
        walletCode,
        walletName,
        reference,
        // A moeda é definida pelo tipo de carteira
        currency: walletType.currency || 'MZN',
        balance: 0.00,
        allowC2B: typeof allowC2B === 'boolean' ? allowC2B : true,
        allowB2C: typeof allowB2C === 'boolean' ? allowB2C : true,
        allowWithdraw: typeof allowWithdraw === 'boolean' ? allowWithdraw : true,
        status: 'ACTIVE'
      });

      await createAuditLog({
        userId,
        action: 'wallet_created',
        entity: 'Wallet',
        entityId: wallet.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(201).json({
        message: 'Wallet created successfully',
        wallet
      });

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // LIST USER WALLETS
  async getUserWallets(req, res) {
    try {
      const userId = req.user.userId;

      const wallets = await Wallet.findAll({
        where: {
          userId,
          status: { [Op.ne]: 'CLOSED' }
        },
        include: [
          {
            model: WalletType,
            attributes: ['id', 'code', 'name', 'provider', 'imageUrl']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.json(wallets);

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // GET WALLET BY CODE
  async getByCode(req, res) {
    try {
      const { code } = req.params;

      const wallet = await Wallet.findOne({
        where: {
          walletCode: code,
          status: { [Op.ne]: 'CLOSED' }
        },
        include: [
          {
            model: WalletType,
            attributes: ['id', 'code', 'name', 'provider', 'imageUrl']
          }
        ]
      });

      if (!wallet) {
        return res.status(404).json({
          error: 'Wallet not found'
        });
      }

      return res.json(wallet);

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }

  // GET WALLET BY ID
  async getById(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const wallet = await Wallet.findOne({
        where: { id },
        include: [
          {
            model: WalletType,
            attributes: ['id', 'code', 'name', 'provider', 'imageUrl']
          }
        ]
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      if (!isStaff(req.user) && wallet.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to view this wallet' });
      }

      return res.json(wallet);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // UPDATE WALLET DETAILS
  async update(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { walletName, walletTypeId, currency, status, isActive, allowC2B, allowB2C, allowWithdraw, reference } = req.body;

      const adminEditing = isAdmin(req.user);
      const where = adminEditing ? { id } : { id, userId };
      const wallet = await Wallet.findOne({ where });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const previousValues = {
        status: wallet.status,
        allowC2B: wallet.allowC2B,
        allowB2C: wallet.allowB2C,
        allowWithdraw: wallet.allowWithdraw
      };
      const changeMessages = [];

      if (walletName) wallet.walletName = walletName;
      // Referência inicial da carteira (até 8 caracteres alfanuméricos); texto vazio limpa
      if (typeof reference === 'string') {
        const trimmed = reference.trim();
        if (!trimmed) {
          wallet.reference = null;
        } else {
          const sanitized = sanitizePrefix(trimmed);
          if (!sanitized) {
            return res.status(400).json({
              error: 'A referência deve ter de 1 a 8 caracteres, apenas letras e números.'
            });
          }
          wallet.reference = sanitized;
        }
      }
      // Apenas administradores podem alterar moeda, tipo, permissões e estado;
      // o cliente pode mudar apenas o nome e a referência da própria carteira.
      if (currency && adminEditing) wallet.currency = currency;
      if (walletTypeId && adminEditing) wallet.walletTypeId = walletTypeId;
      if (adminEditing && typeof allowC2B !== 'undefined' && wallet.allowC2B !== !!allowC2B) {
        wallet.allowC2B = !!allowC2B;
        changeMessages.push(`C2B ${wallet.allowC2B ? 'ativada' : 'desativada'}`);
      }
      if (adminEditing && typeof allowB2C !== 'undefined' && wallet.allowB2C !== !!allowB2C) {
        wallet.allowB2C = !!allowB2C;
        changeMessages.push(`B2C ${wallet.allowB2C ? 'ativada' : 'desativada'}`);
      }
      if (adminEditing && typeof allowWithdraw !== 'undefined' && wallet.allowWithdraw !== !!allowWithdraw) {
        wallet.allowWithdraw = !!allowWithdraw;
        changeMessages.push(`Saque ${wallet.allowWithdraw ? 'ativado' : 'desativado'}`);
      }

      if (adminEditing && typeof isActive !== 'undefined') {
        const newStatus = isActive ? 'ACTIVE' : 'FROZEN';
        if (wallet.status !== newStatus) {
          wallet.status = newStatus;
          if (newStatus === 'FROZEN') {
            changeMessages.push('Carteira desativada');
          }
        }
      } else if (adminEditing && status) {
        const validStatuses = ['ACTIVE', 'FROZEN', 'CLOSED'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        if (wallet.status !== status) {
          wallet.status = status;
          if (status === 'FROZEN') {
            changeMessages.push('Carteira desativada');
          }
        }
      }

      await wallet.save();

      if (changeMessages.length > 0) {
        await Notification.create({
          userId: wallet.userId,
          title: 'Alterações na carteira',
          message: `A sua carteira ${wallet.walletCode} foi atualizada: ${changeMessages.join(', ')}.`,
          type: 'info'
        });
      }

      await createAuditLog({
        userId,
        action: 'wallet_updated',
        entity: 'Wallet',
        entityId: wallet.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'Wallet updated successfully',
        wallet
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async softDelete(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const wallet = await Wallet.findOne({ where: { id, userId } });

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      if (wallet.status === 'CLOSED') {
        return res.status(400).json({ error: 'Wallet is already closed' });
      }

      wallet.status = 'CLOSED';
      await wallet.save();

      await createAuditLog({
        userId,
        action: 'wallet_soft_deleted',
        entity: 'Wallet',
        entityId: wallet.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'Wallet closed successfully',
        wallet
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // UPDATE STATUS (admin/ops)
  async updateStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { status } = req.body;

      const wallet = await Wallet.findByPk(id);

      if (!wallet) {
        return res.status(404).json({
          error: 'Wallet not found'
        });
      }

      if (isOperator(req.user)) {
        const owner = await User.findByPk(wallet.userId, { include: [{ model: Role }] });
        if (owner?.Role?.name !== 'user' || !['ACTIVE', 'FROZEN'].includes(status) || wallet.status === 'CLOSED') {
          return res.status(403).json({ error: 'O operador só pode bloquear ou desbloquear carteiras de clientes não encerradas' });
        }
        if (Object.keys(req.body).some((key) => key !== 'status')) {
          return res.status(403).json({ error: 'O operador só pode alterar o estado da carteira' });
        }
      }
      if (!isStaff(req.user) && wallet.userId !== userId) {
        return res.status(403).json({
          error: 'Not authorized to update this wallet'
        });
      }

      // Validar status
      const validStatuses = ['ACTIVE', 'FROZEN', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status. Must be ACTIVE, FROZEN, or CLOSED'
        });
      }

      const previousStatus = wallet.status;
      wallet.status = status;
      await wallet.save();

      if (status === 'FROZEN' && previousStatus !== 'FROZEN') {
        await Notification.create({
          userId: wallet.userId,
          title: 'Carteira desativada',
          message: `A sua carteira ${wallet.walletCode} foi desativada pela equipa de assistência.`,
          type: 'warning'
        });
      }

      await createAuditLog({
        userId,
        action: 'wallet_status_updated',
        entity: 'Wallet',
        entityId: wallet.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        message: 'Wallet status updated',
        wallet
      });

    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
}

module.exports = new WalletController();