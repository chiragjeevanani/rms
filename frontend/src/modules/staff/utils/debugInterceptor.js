// Global storage for logs to survive hot-reloads and route switches
window.__debug_console_logs = window.__debug_console_logs || [];
window.__debug_network_logs = window.__debug_network_logs || [];

const MAX_LOGS = 300;

function safeStringify(val, space = 2) {
  const seen = new WeakSet();
  return JSON.stringify(val, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  }, space);
}

function serializeBody(body) {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      return body;
    }
  }
  if (body instanceof FormData) {
    const obj = {};
    try {
      for (const [key, value] of body.entries()) {
        if (value instanceof File) {
          obj[key] = `[File: ${value.name} (${value.size} bytes)]`;
        } else {
          obj[key] = value;
        }
      }
      return obj;
    } catch (e) {
      return '[FormData (unreadable)]';
    }
  }
  if (body instanceof URLSearchParams) {
    return Object.fromEntries(body.entries());
  }
  return '[Blob/Buffer/Unrecognized body]';
}

function addConsoleLog(type, args) {
  const message = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return safeStringify(arg, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  const newLog = {
    id: Math.random().toString(36).substring(2, 9),
    type,
    message,
    timestamp: new Date().toLocaleTimeString(),
    date: new Date().toISOString()
  };

  window.__debug_console_logs.push(newLog);
  if (window.__debug_console_logs.length > MAX_LOGS) {
    window.__debug_console_logs.shift();
  }

  // Dispatch custom event to notify listening components
  window.dispatchEvent(new CustomEvent('debug-new-console-log', { detail: newLog }));
}

function addNetworkLog(method, url, requestBody, status, responseBody, duration, isError = false) {
  const newLog = {
    id: Math.random().toString(36).substring(2, 9),
    method,
    url,
    requestBody,
    status,
    responseBody,
    duration,
    isError,
    timestamp: new Date().toLocaleTimeString(),
    date: new Date().toISOString()
  };

  window.__debug_network_logs.push(newLog);
  if (window.__debug_network_logs.length > MAX_LOGS) {
    window.__debug_network_logs.shift();
  }

  // Dispatch custom event to notify listening components
  window.dispatchEvent(new CustomEvent('debug-new-network-log', { detail: newLog }));
}

// Hook into console
const consoleTypes = ['log', 'info', 'warn', 'error'];
consoleTypes.forEach(type => {
  const original = console[type];
  console[type] = function (...args) {
    // Call the original browser console method so developers can still see them
    original.apply(console, args);
    // Add to our list
    addConsoleLog(type, args);
  };
});

// Hook into fetch
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const method = init?.method || 'GET';
  const url = typeof input === 'string' ? input : input?.url || '';
  
  // Skip external logging if it's hot-reload or websocket or anything unrelated if we want,
  // but keeping all logs is better.
  const requestBody = serializeBody(init?.body);
  const startTime = performance.now();

  try {
    const response = await originalFetch.apply(this, arguments);
    const duration = Math.round(performance.now() - startTime);

    // Clone the response to read body without consuming the stream
    const clonedResponse = response.clone();
    let responseBody = '';
    try {
      const contentType = clonedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await clonedResponse.json();
      } else {
        responseBody = await clonedResponse.text();
      }
    } catch (e) {
      responseBody = '[Unreadable Response Body]';
    }

    addNetworkLog(method, url, requestBody, response.status, responseBody, duration, !response.ok);
    return response;
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    addNetworkLog(method, url, requestBody, 'FAILED', err.message, duration, true);
    throw err;
  }
};
