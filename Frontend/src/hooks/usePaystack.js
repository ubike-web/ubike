let scriptLoaded = false;
let scriptLoading = null;

function loadScript() {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });

  return scriptLoading;
}

export function usePaystack() {
  const pay = async ({ email, amount, onSuccess, onClose }) => {
    await loadScript();
    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email,
      amount: Math.round(amount * 100),
      currency: 'KES',
      callback: (response) => onSuccess(response.reference),
      onClose: onClose || (() => {}),
    });
    handler.openIframe();
  };

  return { pay };
}
