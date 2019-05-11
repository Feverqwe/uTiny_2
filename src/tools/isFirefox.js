const isFirefox = () => {
  return /Firefox\/\d/.test(navigator.userAgent);
};

export default isFirefox;