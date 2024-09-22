const LEVER_ATTR = 'data-shift-lever';
const TARGET_ATTR = 'data-target';
const LISTENED_ATTR = 'data-connected';

// levers:
const LEVER_SWAP = 'swap';
const LEVER_APPEND = 'append';
const LEVER_PREPEND = 'prepend';

// feedbacks:
const FEEDBACK_HEADER = 'X-Feedback-Message';

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
      console.warn('Unknown logic operation');
  }
};

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

// Function to handle GET and POST requests
const handleShifting = async (form) => {
  const formData = new FormData(form);
  const url = form.getAttribute('action');
  const method = form.getAttribute('method')?.toUpperCase() || 'POST';
  const logic = form.getAttribute(LEVER_ATTR);
  const targetSelector = form.getAttribute(TARGET_ATTR);
  const targetElement = document.querySelector(targetSelector);
  const inputsAndButtons = form.querySelectorAll('input, button');

  lockInputs(inputsAndButtons, true);

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

    if (response.ok) {
      const responseHtml = await response.text();
      handleResponseLogic(logic, targetElement, responseHtml);

      const feedbackMessage = response.headers.get(FEEDBACK_HEADER);

      if (feedbackMessage) {
        showSnackbar(feedbackMessage);
      }
      clearInputs(inputsAndButtons);

      // Re-attach form listeners:
      connectToDrivetrain();
    } else {
      const errorMessage = `Server response error: ${response.statusText}`
      showSnackbar(errorMessage);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    showSnackbar("an error has occured!")
  } finally {
    lockInputs(inputsAndButtons, false);
  }
};

const showSnackbar = (message) => {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.className = 'show';

  setTimeout(() => {
    snackbar.className = snackbar.className.replace('show', '');
  }, 3000);
}

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
