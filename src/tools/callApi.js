const callApi = (message) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const err = chrome.runtime.lastError;
      err ? reject(err) : resolve(response);
    });
  }).then((response) => {
    if (!response) {
      throw new Error('Response is empty');
    }
    if (response.error) {
      throw Object.assign(new Error(), response.error);
    }
    return response.result;
  });
};

export default callApi;