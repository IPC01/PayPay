const fs = require('fs');
const path = require('path');
const { Kyc, KycDocument, User, Notification } = require('../models');
const { Op } = require('sequelize');
const { Role } = require('../models');
const { getUploadsDir } = require('../config/uploadStorage');
const {
  KYC_MAX_FILE_BYTES,
  KYC_MIME_EXTENSIONS,
  shortenKycFileName,
  createKycInternalName
} = require('../helpers/kycFiles');

class KycFileError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

async function saveKycFile(base64, filename) {
  const matches = typeof base64 === 'string'
    ? base64.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/)
    : null;
  if (!matches) throw new KycFileError('Arquivo inválido');

  const mimeType = matches[1].toLowerCase();
  const extension = KYC_MIME_EXTENSIONS[mimeType];
  if (!extension) throw new KycFileError('Formato de arquivo não suportado.');

  // Rejeita antes de descodificar (base64 ocupa ~4/3 do tamanho real)
  if (Math.floor(matches[2].length * 3 / 4) > KYC_MAX_FILE_BYTES + 2) {
    throw new KycFileError('O arquivo excede o limite de 10 MB.', 413);
  }
  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.length === 0) throw new KycFileError('Arquivo vazio.');
  if (buffer.length > KYC_MAX_FILE_BYTES) {
    throw new KycFileError('O arquivo excede o limite de 10 MB.', 413);
  }

  const uploadsDir = path.join(getUploadsDir(), 'kyc');
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const internalName = createKycInternalName(extension);
  await fs.promises.writeFile(path.join(uploadsDir, internalName), buffer);
  return {
    url: `/api/uploads/kyc/${internalName}`,
    internalName,
    originalName: shortenKycFileName(filename, extension),
    extension,
    mimeType,
    size: buffer.length
  };
}

function normalizeDateOnly(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return null;
  }

  const isoDate = stringValue.split('T')[0];
  const date = new Date(isoDate);

  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }

  return null;
}

class KycController {
  async streamDocument(req, res, isAdmin) {
    try {
      const document = await KycDocument.findByPk(req.params.id);
      if (!document) return res.status(404).json({ error: 'Documento não encontrado' });

      const kyc = await Kyc.findByPk(document.kycId);
      if (!kyc) return res.status(404).json({ error: 'KYC não encontrado' });
      if (!isAdmin && kyc.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Não autorizado' });
      }

      const internalName = document.internalName;
      if (
        !internalName ||
        !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(internalName) ||
        path.basename(internalName) !== internalName
      ) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      const filepath = path.join(getUploadsDir(), 'kyc', internalName);
      let stat;
      try {
        stat = await fs.promises.stat(filepath);
      } catch (error) {
        if (error.code === 'ENOENT') return res.status(404).json({ error: 'Arquivo não encontrado' });
        throw error;
      }
      if (!stat.isFile()) return res.status(404).json({ error: 'Arquivo não encontrado' });

      const allowedMimeTypes = new Set([
        'application/pdf',
        'image/avif',
        'image/jpeg',
        'image/png',
        'image/webp'
      ]);
      const mimeType = allowedMimeTypes.has(document.mimeType) ? document.mimeType : 'application/octet-stream';

      res.set({
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'inline; filename="kyc-document"',
        'Content-Length': stat.size,
        'Content-Type': mimeType,
        'X-Content-Type-Options': 'nosniff'
      });

      const stream = fs.createReadStream(filepath);
      stream.on('error', (error) => {
        console.error('KYC document read failed:', error.message);
        if (!res.headersSent) res.status(500).json({ error: 'Não foi possível abrir o documento.' });
        else res.destroy(error);
      });
      return stream.pipe(res);
    } catch (error) {
      console.error('KYC document access failed:', error.message);
      return res.status(500).json({ error: 'Não foi possível abrir o documento.' });
    }
  }

  async getMyDocument(req, res) {
    return this.streamDocument(req, res, false);
  }

  async getAdminDocument(req, res) {
    return this.streamDocument(req, res, true);
  }

  async getMyKyc(req, res) {
    try {
      const userId = req.user.userId;
      const kyc = await Kyc.findOne({
        where: { userId },
        include: [{ model: KycDocument }]
      });
      return res.json({ kyc });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async upsertKyc(req, res) {
    try {
      const userId = req.user.userId;
      const payload = req.body;
      const safeFields = {
        type: payload.type,
        phonePrimary: payload.phonePrimary,
        phoneSecondary: payload.phoneSecondary,
        contactEmail: payload.contactEmail,
        address: payload.address,
        country: payload.country,
        province: payload.province,
        district: payload.district,
        city: payload.city,
        neighborhood: payload.neighborhood,
        street: payload.street,
        houseNumber: payload.houseNumber,
        postalCode: payload.postalCode,
        sourceOfFunds: payload.sourceOfFunds,
        accountPurpose: payload.accountPurpose,
        monthlyVolume: payload.monthlyVolume,
        annualVolume: payload.annualVolume,
        originOfFunds: payload.originOfFunds,
        mainOperationCountry: payload.mainOperationCountry,
        termsAccepted: payload.termsAccepted,
        firstName: payload.firstName,
        lastName: payload.lastName,
        otherNames: payload.otherNames,
        gender: payload.gender,
        dateOfBirth: normalizeDateOnly(payload.dateOfBirth),
        nationality: payload.nationality,
        documentType: payload.documentType,
        documentNumber: payload.documentNumber,
        documentIssuedAt: normalizeDateOnly(payload.documentIssuedAt),
        documentExpiresAt: normalizeDateOnly(payload.documentExpiresAt),
        documentIssuer: payload.documentIssuer,
        nuit: payload.nuit,
        occupation: payload.occupation,
        employer: payload.employer,
        jobTitle: payload.jobTitle,
        businessName: payload.businessName,
        tradeName: payload.tradeName,
        companyNuit: payload.companyNuit,
        registrationNumber: payload.registrationNumber,
        registrationDate: normalizeDateOnly(payload.registrationDate),
        legalForm: payload.legalForm,
        economicSector: payload.economicSector,
        activityDescription: payload.activityDescription,
        website: payload.website,
        socialLinks: payload.socialLinks,
        businessEmail: payload.businessEmail,
        businessPhone: payload.businessPhone,
        bankName: payload.bankName,
        iban: payload.iban,
        companyMonthlyVolume: payload.companyMonthlyVolume,
        companyAnnualVolume: payload.companyAnnualVolume,
        beneficialOwnerName: payload.beneficialOwnerName,
        beneficialOwnerNationality: payload.beneficialOwnerNationality,
        beneficialOwnerDob: normalizeDateOnly(payload.beneficialOwnerDob),
        beneficialOwnerDocumentNumber: payload.beneficialOwnerDocumentNumber,
        beneficialOwnerShare: payload.beneficialOwnerShare
      };
      let kyc = await Kyc.findOne({ where: { userId } });

      if (kyc) {
        await kyc.update(safeFields);
      } else {
        kyc = await Kyc.create({
          userId,
          ...safeFields
        });
      }

      return res.json({ message: 'KYC updated', kyc });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async submitKyc(req, res) {
    try {
      const userId = req.user.userId;
      const kyc = await Kyc.findOne({ where: { userId } });

      if (!kyc) {
        return res.status(404).json({ error: 'KYC não encontrado' });
      }

      if (!kyc.termsAccepted) {
        return res.status(400).json({ error: 'É necessário aceitar os termos KYC para submeter.' });
      }

      await kyc.update({
        status: 'PENDING',
        submittedAt: new Date(),
        rejectionReason: null
      });

      const admins = await User.findAll({ include: [{ model: Role, where: { name: { [Op.in]: ['admin', 'operator', 'support'] } } }] });
      await Promise.all(admins.map((admin) =>
        Notification.create({
          userId: admin.id,
          title: 'Novo pedido KYC',
          message: `O utilizador ${req.user.email || 'sem email'} submeteu um pedido KYC para revisão.`,
          type: 'info'
        })
      ));

      return res.json({ message: 'KYC submetido para aprovação', kyc });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async uploadDocument(req, res) {
    try {
      const userId = req.user.userId;
      const { kycId, type, file, fileName } = req.body;
      if (!type || !file || !fileName) {
        return res.status(400).json({ error: 'type, file and fileName are required' });
      }

      const kyc = await Kyc.findOne({ where: { userId, id: kycId } });
      if (!kyc) {
        return res.status(404).json({ error: 'KYC não encontrado' });
      }

      const fileData = await saveKycFile(file, fileName);

      const document = await KycDocument.create({
        kycId,
        type,
        originalName: fileData.originalName,
        internalName: fileData.internalName,
        url: fileData.url,
        extension: fileData.extension,
        mimeType: fileData.mimeType,
        size: fileData.size,
        status: 'pending'
      });

      return res.status(201).json({ document });
    } catch (error) {
      return res.status(error instanceof KycFileError ? error.status : 500).json({ error: error.message });
    }
  }

  async listDocuments(req, res) {
    try {
      const userId = req.user.userId;
      const kyc = await Kyc.findOne({ where: { userId } });
      if (!kyc) return res.json({ documents: [] });

      const documents = await KycDocument.findAll({ where: { kycId: kyc.id } });
      return res.json({ documents });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteDocument(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const document = await KycDocument.findByPk(id);
      if (!document) return res.status(404).json({ error: 'Documento não encontrado' });

      const kyc = await Kyc.findByPk(document.kycId);
      if (!kyc || kyc.userId !== userId) {
        return res.status(403).json({ error: 'Não autorizado' });
      }

      await document.destroy();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAdminKycs(req, res) {
    try {
      const kycs = await Kyc.findAll({
        order: [['updatedAt', 'DESC']],
        include: [{ model: User, attributes: ['id', 'name', 'email'] }, { model: KycDocument }]
      });
      return res.json({ kycs });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAdminKycById(req, res) {
    try {
      const { id } = req.params;
      const kyc = await Kyc.findByPk(id, {
        include: [{ model: User, attributes: ['id', 'name', 'email'] }, { model: KycDocument }]
      });
      if (!kyc) return res.status(404).json({ error: 'KYC não encontrado' });
      return res.json({ kyc });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async reviewKyc(req, res) {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      const kyc = await Kyc.findByPk(id);
      if (!kyc) return res.status(404).json({ error: 'KYC não encontrado' });

      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      await kyc.update({
        status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        reviewer: req.user.name || `${req.user.roleName}-${req.user.userId}`,
        rejectionReason: status === 'REJECTED' ? rejectionReason || null : null
      });

      const user = await User.findByPk(kyc.userId);
      if (user) {
        const title = status === 'APPROVED' ? 'KYC aprovado' : status === 'REJECTED' ? 'KYC rejeitado' : 'KYC atualizado';
        const message = status === 'APPROVED'
          ? 'Seu pedido KYC foi aprovado. Obrigado por enviar os documentos.'
          : status === 'REJECTED'
            ? `Seu pedido KYC foi rejeitado. Motivo: ${rejectionReason || 'não informado'}.`
            : 'O status do seu KYC foi atualizado.';

        await Notification.create({
          userId: user.id,
          title,
          message,
          type: status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'info'
        });
      }

      return res.json({ kyc });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new KycController();
