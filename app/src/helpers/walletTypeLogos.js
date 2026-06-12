import mpesaLogo from '../assets/logo/M-pesa-logo-removebg.png';
import emolaLogo from '../assets/logo/emola-logo-removebg.png';
import mkeshLogo from '../assets/logo/mkesh-logo-removebg.png';

const walletTypeLogoMap = {
  MPESA: mpesaLogo,
  EMOLA: emolaLogo,
  MKESH: mkeshLogo
};

export function getWalletTypeLogo({ imageUrl, code }) {
  const normalizedCode = code?.toString()?.toUpperCase();
  if (normalizedCode && walletTypeLogoMap[normalizedCode]) {
    return walletTypeLogoMap[normalizedCode];
  }

  if (imageUrl) {
    return imageUrl;
  }

  return null;
}
