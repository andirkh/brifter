const LEVER_ATTR = 'data-shift-lever';
const TARGET_ATTR = 'data-shift-target-id';

const LOADING_ATTR = 'data-shift-loading-id';
const HIDE_ONLOAD_ATTR = 'data-loading-hide-id';
const RETAIN_INPUT_ATTR = 'data-retain-input';

const LISTENED_ATTR = 'data-connected';

// Levers variant:
const LEVER_SWAP = 'swap';
const LEVER_APPEND = 'append';
const LEVER_PREPEND = 'prepend';

// Feedback from response header :
const FEEDBACK_HEADER = 'X-Feedback-Message';

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
  snackbar.className = 'show';

  setTimeout(() => {
    snackbar.className = snackbar.className.replace('show', '');
  }, 3000);
}

const showLoading = (loadingId, state) => {
  const loadingElement = document.querySelector(loadingId);
  if (!loadingElement) return;

  if (state === true) {
    loadingElement.className = `${loadingElement.className} show`
  } else if (state === false) {
    loadingElement.className = loadingElement.className.replace('show', '').trim();
  }
}

const hideElementWhenLoading = (elementToHideId, state) => {
  const hideElement = document.querySelector(elementToHideId)

  if (!hideElement) return;
  if (state === true) {
    hideElement.className = `${hideElement.className} hidden`
  } else if (state === false) {
    hideElement.className = hideElement.className.replace('hidden', '').trim();
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

const handleCablePull = async (form) => {
  const formData = new FormData(form);
  const url = form.getAttribute('action');
  const method = form.getAttribute('method')?.toUpperCase() || 'POST';
  const logic = form.getAttribute(LEVER_ATTR);
  const retainInput = form.getAttribute(RETAIN_INPUT_ATTR);
  const targetId = form.getAttribute(TARGET_ATTR);

  const targetElement = document.querySelector(targetId);

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
}

const handleShifting = async (form) => {
  const inputsAndButtons = form.querySelectorAll('input, button');
  const loadingId = form.getAttribute(LOADING_ATTR);
  const elementToHideId = form.getAttribute(HIDE_ONLOAD_ATTR);

  lockInputs(inputsAndButtons, true);
  handleProgress(loadingId, true, elementToHideId)

  try {
    await handleCablePull(form);
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
