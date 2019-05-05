import {fetch} from "whatwg-fetch";
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';
import arrayBufferToBase64 from "./tools/arrayBufferToBase64";
import getLogger from "./tools/getLogger";
import ErrorWithCode from "./tools/errorWithCode";

const serializeError = require('serialize-error');

const logger = getLogger('tabUrlFetch');

!window.tabUrlFetch && (() => {
  window.tabUrlFetch = true;

  chrome.runtime.onMessage.addListener((message, sender, response) => {
    let promise = null;

    switch (message && message.action) {
      case 'fetchUrl': {
        promise = fetchUrl(message.url);
        break;
      }
      default: {
        promise = Promise.reject(new Error('Unknown request'));
      }
    }

    if (promise) {
      promise.then((result) => {
        response({result});
      }, (err) => {
        response({error: serializeError(err)});
      }).catch((err) => {
        logger.error('Send response error', err);
      });
      return true;
    }
  });

  function fetchUrl(url) {
    const controller = new AbortController();

    return fetch(url, {
      signal: controller.signal,
    }).then((response) => {
      if (!response.ok) {
        throw new ErrorWithCode(`${response.status}: ${response.statusText}`, `RESPONSE_IS_NOT_OK`);
      }

      if (response.headers.get('Content-Length') > 1024 * 1024 * 10) {
        throw new ErrorWithCode(`Size is more then 10mb`, 'FILE_SIZE_EXCEEDED');
      }

      const {headers, ...safeResponse} = response;
      safeResponse.headers = Array.from(headers.entries());

      return response.arrayBuffer().then((arrayBuffer) => {
        return {response: safeResponse, base64: arrayBufferToBase64(arrayBuffer)};
      });
    }).catch((err) => {
      controller.abort();
      throw err;
    });
  }
})();