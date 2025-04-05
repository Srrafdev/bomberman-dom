function vdm(tag, attrs, ...children) {
  if (typeof tag === "function") {
    return tag({ ...attrs, children });
  }
  return { tag, attrs: attrs || {}, children: children.flat() };
}

function render(vDOM) {
  if (!vDOM) { // for IE
    console.warn("Skipping undefined VDOM node:", vDOM);
    return document.createComment("Empty node");
  }

  if (typeof vDOM === "string") {
    return document.createTextNode(vDOM);
  }

  if (!vDOM.tag) { // for IE
    console.warn("VDOM node missing 'tag' property:", vDOM);
    return document.createComment("Invalid VDOM node");
  }

  const element = document.createElement(vDOM.tag);

  for (const key in vDOM.attrs) {
    if (key.startsWith("on")) {
      const event = key.toLowerCase().slice(2)
      myEventSystem.addEvent(element, event, vDOM.attrs[key]);
    } else {
      element.setAttribute(key, vDOM.attrs[key]);
    }
  }

  vDOM.children.forEach(child => {
    element.appendChild(render(child));
  });

  return element;
}

let rootElement = null;

function setRoot(elementId) {
  rootElement = document.getElementById(elementId);
}

let currentComponent = null

function diffing(root, oldVDOM, newVDOM, index = 0) {
  const currentChild = root.childNodes[index];

  // Handle null/undefined cases
  if (!newVDOM && !oldVDOM) return;
  if (!newVDOM) {
    if (currentChild) {
      cleanAllEvents(currentChild, oldVDOM);
      root.removeChild(currentChild);
    }
    return;
  }
  if (!oldVDOM) {
    root.appendChild(render(newVDOM));
    return;
  }

  // Handle text nodes
  if (typeof newVDOM === "string" || typeof oldVDOM === "string") {
    if (typeof newVDOM === "string" && typeof oldVDOM === "string") {
      if (newVDOM !== oldVDOM && currentChild) {
        currentChild.textContent = newVDOM;
      }
    } else if (currentChild) {
      root.replaceChild(render(newVDOM), currentChild);
    }
    return;
  }

  // Handle tag changes
  if (newVDOM.tag !== oldVDOM.tag) {
    if (currentChild) {
      root.replaceChild(render(newVDOM), currentChild);
    } else {
      root.appendChild(render(newVDOM));
    }
    return;
  }

  // Update attributes (events already cleaned)
  if (currentChild) {
    // Set new attributes
    for (const attr in newVDOM.attrs) {
      if (newVDOM.attrs[attr] !== oldVDOM.attrs[attr]) {
        if (attr.startsWith("on")) {
          const event = attr.toLowerCase().slice(2)
          myEventSystem.addEvent(currentChild, event, newVDOM.attrs[attr]);
        } else {
          currentChild.setAttribute(attr, newVDOM.attrs[attr])
        }
      }
    }

    // Remove attributes that don't exist in newVDOM
    for (const attr in oldVDOM.attrs) {
      if (!newVDOM.attrs[attr]) {
        currentChild.removeAttribute(attr)
      }

      if (attr.startsWith("on")) {
        const event = attr.toLowerCase().slice(2)
        myEventSystem.removeEvent(currentChild, event, oldVDOM.attrs[attr]);
      }
    }
  }

  // Diff children (recursion)
  const oldChildren = oldVDOM.children || [];
  const newChildren = newVDOM.children || [];
  const maxLen = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLen; i++) {
    diffing(currentChild, oldChildren[i], newChildren[i], i);
  }

  // Remove excess old children
  if (oldChildren.length > newChildren.length) {
    for (let i = newChildren.length; i < oldChildren.length; i++) {
      if (currentChild?.childNodes[i]) {
        currentChild.removeChild(currentChild.childNodes[i]);
      }
    }
  }
}

// Helper function to clean all events
function cleanAllEvents(node, vdom) {
  if (!vdom.attrs) return;
  for (const attr in vdom.attrs) {
    if (attr.startsWith("on")) {
      const event = attr.toLowerCase().slice(2);
      myEventSystem.removeEvent(node, event, vdom.attrs[attr]);
    }
  }
}

function renderComponent(component) {
  if (!rootElement) {
    console.error("Root element is not set. Call setRoot(elementId) before rendering components.");
    return;
  }
  const newVDOM = component();

  if (currentComponent === null) {
    currentComponent = newVDOM;
    rootElement.innerHTML = "";
    rootElement.appendChild(render(newVDOM));
  } else {
    diffing(rootElement, currentComponent, newVDOM);
    currentComponent = newVDOM;
  }
}

let globalRoutes = {};

function route(event) {
  if (event.preventDefault) event.preventDefault();
  window.history.pushState({}, "", event.target.href);
  handleLocation();
}
// redirect : route({target: {href: "/result" } })

function handleLocation() {
  const path = window.location.pathname;
  if (!globalRoutes[path] && !globalRoutes[404]) {
    console.error("No route found, and no 404 handler is set.");
    return;
  }
  const component = globalRoutes[path] || globalRoutes[404];
  renderComponent(component);
}

function setRoutes(routes) {
  globalRoutes = routes;
}

const StateManagement = (function () {
  let state = JSON.parse(localStorage.getItem("myState")) || {};
  let listeners = [];

  function notify() {
    localStorage.setItem("myState", JSON.stringify(state));
    listeners.forEach(listener => listener(state));
  }

  return {
    getState: () => state,

    setState: (newState) => {
      state = { ...state, ...newState };
      notify();
    },

    deleteState: (key) => {
      if (state.hasOwnProperty(key)) {
        delete state[key];
        notify();
      }
    },

    subscribe: (listener) => {
      listeners.push(listener);
    }
  };
})();

const myEventSystem = {
  events: {},

  addEvent(element, eventType, handler) {
    if (!this.events[eventType]) {
      this.events[eventType] = [];
      document.body.addEventListener(eventType, (e) => this.handleEvent(eventType, e));
    }
    this.events[eventType].push({ element, handler });
  },

  removeEvent(element, eventType, handler) {
    if (this.events[eventType]) {
      this.events[eventType] = this.events[eventType].filter(
        (evtObj) => evtObj.element !== element || evtObj.handler !== handler
      );
      if (this.events[eventType].length === 0) {
        document.body.removeEventListener(eventType, (e) => this.handleEvent(eventType, e));
        delete this.events[eventType];
      }
    }
  },

  handleEvent(eventType, event) {
    if (!this.events[eventType]) return;
    this.events[eventType].forEach(({ element, handler }) => {
      if (element.contains(event.target)) {
        handler(event);
      }
    });
  }
};

export { vdm, route, handleLocation, setRoutes, setRoot, StateManagement, myEventSystem, renderComponent };

//==================== rachid router
export class Router {
  constructor(renderFunction) {
    this.routes = {};
    this.render = renderFunction;
    this.notFoundComponent = null;
    this.currentPath = window.location.pathname;

    window.addEventListener('popstate', () => this.handleNavigation());
    window.addEventListener('DOMContentLoaded', () => this.handleNavigation());
  }

  add(path, component) {
    this.routes[path] = component;
    return this;
  }

  link(path) {
    if (this.currentPath === path) return;

    window.history.pushState({}, '', path);
    this.currentPath = path;
    this.handleNavigation();
  }

  setNotFound(component) {
    this.notFoundComponent = component;
    return this;
  }

  handleNavigation() {
    const path = window.location.pathname;
    this.currentPath = path;

    const component = this.routes[path] || this.notFoundComponent || this.defaultNotFound();

    this.render(component);
  }

  defaultNotFound() {
    return () => vdm("div", {},
      vdm("h1", {}, "404 - Page Not Found"),
      vdm("button", { onClick: () => this.link("/") }, "Go Home")
    );
  }
}