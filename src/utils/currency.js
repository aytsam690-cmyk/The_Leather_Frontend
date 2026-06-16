import useSettingsStore from '../store/settingsStore';

export const getCurrencySymbol = (currencyCode = 'USD') => {
  const code = currencyCode.toUpperCase();
  const map = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', PKR: 'Rs', INR: '₹', AUD: 'A$', CAD: 'C$', CNY: '¥'
  };
  return map[code] || `${code} `;
};

export const useCurrency = () => {
  const { settings } = useSettingsStore();
  const currencyCode = settings?.currency || 'USD';
  const symbol = getCurrencySymbol(currencyCode);
  
  const formatPrice = (price) => {
    if (price === undefined || price === null) return `${symbol}0.00`;
    return `${symbol}${Number(price).toFixed(2)}`;
  };
  
  return { formatPrice, symbol, currencyCode };
};
