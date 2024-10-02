const LEVER_ATTR = 'data-shift-lever';
const LEVER_SWAP = 'swap';
const LEVER_APPEND = 'append';
const LEVER_PREPEND = 'prepend';

const TARGET_ATTR_ID = 'data-shift-target';
const LOADING_ATTR_ID = 'data-shift-loading';
const HIDE_ONLOAD_ATTR_ID = 'data-loading-hide';
const LOCATION_HASH_ATTR_ID = 'data-shift-popup';

const RETAIN_INPUT_ATTR = 'data-retain-input';
const LISTENED_ATTR = 'data-connected';

const FEEDBACK_HEADER = 'X-Feedback-Message';
const SHOW_CLASSNAME = 'b-show';
const HIDE_CLASSNAME = 'b-hidden';

const handleResponseLogic = (logic, targetElement, responseHtml) => {
  if (!targetElement) return;

  switch (logic) {
    case LEVER_SWAP:
      targetElement.innerHTML = responseHtml;
      break;
    case LEVER_APPEND:
      targetElement.insertAdjacentHTML('beforeend', responseHtml);
      break;
    case LEVER_PREPEND:
      targetElement.insertAdjacentHTML('afterbegin', responseHtml);
      break;
    default:
      return;
  }
};

const lockInputs = (elements, state) => {
  elements.forEach(item => {
    item.disabled = state;
  });
};

const clearInputs = (elements) => {
  elements.forEach(item => {
    item.value = '';
  })
}

const showSnackbar = (message) => {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.className = SHOW_CLASSNAME;

  setTimeout(() => {
    snackbar.className = snackbar.className.replace(SHOW_CLASSNAME, '');
  }, 3000);
}

const showLoading = (loadingId, state) => {
  const loadingElement = document.querySelector(loadingId);
  if (!loadingElement) return;

  if (state === true) {
    loadingElement.className = `${loadingElement.className} ${SHOW_CLASSNAME}`
  } else if (state === false) {
    loadingElement.className = loadingElement.className.replace(SHOW_CLASSNAME, '').trim();
  }
}

const hideElementWhenLoading = (elementToHideId, state) => {
  const hideElement = document.querySelector(elementToHideId)

  if (!hideElement) return;
  if (state === true) {
    hideElement.className = `${hideElement.className} ${HIDE_CLASSNAME}`
  } else if (state === false) {
    hideElement.className = hideElement.className.replace(HIDE_CLASSNAME, '').trim();
  }
}

const buildUrlWithParams = (url, formData) => {
  const urlParams = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    urlParams.append(key, value);
  }
  return `${url}?${urlParams.toString()}`;
};

const baseService = async (url, method, body) => {
  const options = {
    method,
  };

  if (method === 'POST') {
    options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    options.body = body;
  }

  return await fetch(url, options);
};

const handleProgress = (loadingId, state, elementToHideId) => {
  loadingId && showLoading(loadingId, state);
  elementToHideId && hideElementWhenLoading(elementToHideId, state);
}

const handleShifting = async (form) => {
  const formData = new FormData(form);
  const url = form.getAttribute('action');
  const method = form.getAttribute('method')?.toUpperCase() || 'POST';
  const logic = form.getAttribute(LEVER_ATTR);
  const retainInput = form.getAttribute(RETAIN_INPUT_ATTR);
  const targetId = form.getAttribute(TARGET_ATTR_ID);
  const loadingId = form.getAttribute(LOADING_ATTR_ID);
  const elementToHideId = form.getAttribute(HIDE_ONLOAD_ATTR_ID);
  const inputsAndButtons = form.querySelectorAll('input, button');
  const locationHash = form.getAttribute(LOCATION_HASH_ATTR_ID);

  if (locationHash) {
    window.location.hash = locationHash;
  }

  const targetElement = document.querySelector(targetId);

  lockInputs(inputsAndButtons, true);
  handleProgress(loadingId, true, elementToHideId)

  try {
    let fetchUrl = url;
    let requestBody = null;

    if (method === 'GET') {
      fetchUrl = buildUrlWithParams(url, formData);
    } else {
      const urlEncodedData = new URLSearchParams(formData);
      requestBody = urlEncodedData.toString();
    }

    const response = await baseService(fetchUrl, method, requestBody);

    handleProgress(loadingId, false, elementToHideId)

    if (response.ok) {
      const responseHtml = await response.text();
      handleResponseLogic(logic, targetElement, responseHtml);

      const feedbackMessage = response.headers.get(FEEDBACK_HEADER);
      feedbackMessage && showSnackbar(feedbackMessage);

      !retainInput && clearInputs(inputsAndButtons);

      // Re-attach form listeners:
      connectToDrivetrain();
    } else {
      const errorMessage = `Server response error: ${response.statusText}`
      handleProgress(loadingId, false, elementToHideId)
      showSnackbar(errorMessage);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    showSnackbar("an error has occured!")
  } finally {
    lockInputs(inputsAndButtons, false);
  }
};

const connectToDrivetrain = () => {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    if (!form.hasAttribute(LISTENED_ATTR)) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        handleShifting(form);
      });
      form.setAttribute(LISTENED_ATTR, 'true');
    }
  });
};

document.addEventListener('DOMContentLoaded', connectToDrivetrain);
