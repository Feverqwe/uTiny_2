const storageSet = (data, area = 'local') => {
  return new Promise((resolve, reject) => chrome.storage[area].set(data, (result) => {
    const err = chrome.runtime.lastError;
    err ? reject(err) : resolve(result);
  }));
};

export default storageSet;