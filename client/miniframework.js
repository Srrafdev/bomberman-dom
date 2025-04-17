/**
 * @file vdom-framework.js
 * @description
 * A lightweight Virtual DOM framework for rendering and diffing DOM elements,
 * managing global state, handling routing, and managing event listeners.
 *
 * Main Features:
 * - createVDOM: Create a virtual DOM node.
 * - render: Convert virtual DOM to real DOM.
 * - diffing: Efficiently update the DOM using diffing.
 * - StateManagement: Global state storage with listener support and localStorage persistence.
 * - renderComponent: Handle rendering and re-rendering of VDOM-based components.
 * - Routing: Client-side route management via history API.
 * - EventSystem: Delegated event listener system with automatic cleanup.
 *
 * Exports:
 * - createVDOM
 * - route
 * - handleLocation
 * - setRoutes
 * - setRoot
 * - StateManagement
 * - EventSystem
 * - renderComponent
 */

// ------------------ Virtual DOM ------------------

/**
 * Creates a virtual DOM node.
 * @param {string} tag - HTML tag name (e.g., "div").
 * @param {Object} attrs - Attributes like id, class, onClick, etc.
 * @param {Array} children - Nested virtual DOM nodes or strings.
 * @returns {Object} A VDOM node.
 */
function vdm(tag, attrs, ...children) {
  if (typeof tag === "function") {
    return tag({ ...attrs, children });
  }
  return { tag, attrs: attrs || {}, children: children.flat() };
}

/**
* Converts a virtual DOM node to an actual DOM element.
* @param {Object|string} vDOM - Virtual DOM or string.
* @returns {Node} A DOM Node (HTMLElement or TextNode).
*/
function render(vDOM) {
  if (!vDOM) return document.createComment("Empty node");
  if (typeof vDOM === "string") return document.createTextNode(vDOM);
  if (!vDOM.tag) return document.createComment("Invalid VDOM node");

  const element = document.createElement(vDOM.tag);

  for (const key in vDOM.attrs) {
    if (key === "ref" && typeof vDOM.attrs[key] === "function") {
      setTimeout(() => vDOM.attrs[key](element), 0);
    } else if (key.startsWith("on")) {
      const event = key.toLowerCase().slice(2);
      EventSystem.add(element, event, vDOM.attrs[key]);
    } else if (key === "checked") {
      element.checked = vDOM.attrs[key];
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

/**
* Sets the root element where components will render.
* @param {string} elementId - ID of the root DOM element.
*/
function setRoot(elementId) {
  rootElement = document.getElementById(elementId);
}

let currentComponent = null;

/**
* Diffs two virtual DOM trees and updates the real DOM.
* @param {HTMLElement} root - Root DOM node.
* @param {Object|string} oldVDOM - Previous virtual DOM.
* @param {Object|string} newVDOM - New virtual DOM.
* @param {number} index - Child index in the parent node.
*/
function diffing(root, oldVDOM, newVDOM, index = 0) {
  const currentChild = root.childNodes[index];

  // over handling
  if (!newVDOM && !oldVDOM) return;

  if (!newVDOM) {
    if (currentChild) root.removeChild(currentChild);
    return;
  }
  if (!oldVDOM) {
    root.appendChild(render(newVDOM));
    return;
  }

  if (typeof newVDOM === "string" || typeof oldVDOM === "string") {
    if (typeof newVDOM === "string" && typeof oldVDOM === "string") {
      if (newVDOM !== oldVDOM && currentChild) currentChild.textContent = newVDOM;
    } else if (currentChild) {
      root.replaceChild(render(newVDOM), currentChild);
    } else {
      root.appendChild(render(newVDOM));
    }
    return;
  }

  if (newVDOM.tag !== oldVDOM.tag) {
    if (currentChild) root.replaceChild(render(newVDOM), currentChild);
    else root.appendChild(render(newVDOM));
    return;
  }

  if (currentChild) {
    for (const attr in newVDOM.attrs) {
      if (attr === "checked") {
        if (currentChild.checked !== newVDOM.attrs[attr]) {
          currentChild.checked = newVDOM.attrs[attr];
        }
      } else if (attr === "ref" && typeof newVDOM.attrs[attr] === "function") {
        try {
          newVDOM.attrs[attr](currentChild);
        } catch (e) {
          console.error("Ref callback error:", e);
        }
      } else if (newVDOM.attrs[attr] !== oldVDOM.attrs[attr]) {
        if (attr.startsWith("on")) {
          const event = attr.toLowerCase().slice(2);
          EventSystem.remove(currentChild, event, oldVDOM.attrs[attr]);
          EventSystem.add(currentChild, event, newVDOM.attrs[attr]);
        } else {
          currentChild.setAttribute(attr, newVDOM.attrs[attr]);
        }
      }
    }

    for (const attr in oldVDOM.attrs) {
      if (!newVDOM.attrs[attr] && attr !== "ref") currentChild.removeAttribute(attr);
    }
  }

  const oldChildren = oldVDOM.children || [];
  const newChildren = newVDOM.children || [];
  const maxLen = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLen; i++) {
    diffing(currentChild, oldChildren[i], newChildren[i], i);
  }

  // over handling
  if (oldChildren.length > newChildren.length && currentChild) {
    for (let i = oldChildren.length - 1; i >= newChildren.length; i--) {
      if (i < currentChild.childNodes.length) {
        currentChild.removeChild(currentChild.childNodes[i]);
      }
    }
  }
}

let haveNewState = false;

/**
* Renders a component and handles diffing if already rendered.
* @param {Function} component - A function returning a virtual DOM.
*/
function renderComponent(component, isNwPath = false) {
  if (haveNewState) {
    EventSystem.cleanAll();
    haveNewState = false;
  }

  if (!rootElement) {
    console.error("Root element is not set. Call setRoot(elementId).");
    return;
  }

  const newVDOM = component();

  if (currentComponent === null || isNwPath) {
    currentComponent = newVDOM;
    rootElement.innerHTML = "";
    rootElement.appendChild(render(newVDOM));
  } else {
    diffing(rootElement, currentComponent, newVDOM);
    currentComponent = newVDOM;
  }
}

let globalRoutes = {};
/**
* Sets available routes.
* @param {Object} routes - Object of path -> component mappings.
*/
function setRoutes(routes) {
  globalRoutes = routes;
}

// ------------------ Global State Management ------------------

const StateManagementLSG = {
  state: JSON.parse(localStorage.getItem("myState")) || {},
  listeners: [],

  notify() {
    localStorage.setItem("myState", JSON.stringify(this.state));
    this.listeners.forEach(listener => listener(this.state));
  },

  get() {
    return this.state;
  },

  set(newState) {
    if (newState !== this.state) haveNewState = true;
    this.state = { ...this.state, ...newState };
    this.notify();
  },

  delete(key) {
    if (this.state.hasOwnProperty(key)) {
      delete this.state[key];
      this.notify();
    }
  },

  reset() {
    localStorage.removeItem("myState");
    this.state = {};
    this.notify();
  },

  /**
   * Subscribes a listener to state changes.
   * @param {Function} listener - Function to call on state change.
   * @returns {Function} Unsubscribe function.
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};
const StateManagement = {
  state: {}, // Initial empty state
  component: null, // Store the component to re-render

  get() {
    return this.state;
  },

  set(newState) {
    if (newState !== this.state) {
      haveNewState = true;
    }
    this.state = { ...this.state, ...newState };

    // Re-render component if we have a state change
    if (haveNewState && this.component) {
      renderComponent(this.component);
    }
  },

  delete(key) {
    if (this.state.hasOwnProperty(key)) {
      delete this.state[key];
      haveNewState = true;

      // Re-render component if we have a state change
      if (this.component) {
        renderComponent(this.component);
      }
    }
  },

  reset() {
    this.state = {};
    haveNewState = true;

    // Re-render component if we have a state change
    if (this.component) {
      renderComponent(this.component);
    }
  },

  // Method to set the component that should be re-rendered on state changes
  setComponent(component) {
    this.component = component;
  }
};


// ------------------ Event System ------------------
const EventSystem = {
  events: {},
  eventListeners: {},

  add(element, eventType, handler, protect = false) {
    if (element === window || element === document) {
      if (!this.events[eventType]) {
        this.events[eventType] = [];
        element.addEventListener(eventType, handler);
      }
      this.events[eventType].push({ element, handler, protect });
      return;
    }

    if (!this.events[eventType]) {
      this.events[eventType] = [];
      this.eventListeners[eventType] = (e) => this.handle(eventType, e);
      document.body.addEventListener(eventType, this.eventListeners[eventType], true);
    }

    this.events[eventType].push({ element, handler, protect });
  },

  remove(element, eventType, handler) {
    if (this.events[eventType]) {
      this.events[eventType] = this.events[eventType].filter(
        evtObj => !(evtObj.element === element && evtObj.handler === handler)
      );
      if (this.events[eventType].length === 0) {
        document.body.removeEventListener(eventType, this.eventListeners[eventType]);
        delete this.events[eventType];
        delete this.eventListeners[eventType];
      }
    }
  },

  cleanAll() {
    for (const eventType in this.events) {
      const protectedEvents = this.events[eventType].filter(event => event.protect);
      if (protectedEvents.length === 0) {
        document.body.removeEventListener(eventType, this.eventListeners[eventType]);
        delete this.events[eventType];
        delete this.eventListeners[eventType];
      } else {
        this.events[eventType] = protectedEvents;
      }
    }
  },

  handle(eventType, event) {
    if (!this.events[eventType]) return;
    this.events[eventType].forEach(({ element, handler }) => {
      if (element === event.target || element.contains(event.target)) {
        handler(event);
      }
    });
  }
};


// //==================== rachid router
class Router {
  constructor(renderFunction) {
    this.routes = {};
    this.render = renderFunction;
    this.notFoundComponent = null;
    this.currentPath = window.location.pathname;

    EventSystem.add(window, 'popstate', () => this.handleNavigation(), true)
    EventSystem.add(window, 'DOMContentLoaded', () => this.handleNavigation(), true)
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

    this.render(component, true);
  }

  defaultNotFound() {
    return () => vdm("div", {},
      vdm("h1", {}, "404 - Page Not Found"),
      vdm("button", { onClick: () => this.link("/") }, "Go Home")
    );
  }
}

let state = [];
let stateIndex = 0;
let effects = [];
let effectIndex = 0;

function useState(initialValue) {
  const index = stateIndex
  if (!state[index]) {
    state[index] = initialValue
  }
  const setState = (newValue) => {
    state[index] = newValue
    console.log(currentComponent);
    console.log(newValue);
    renderComponent(() => currentComponent)
  };
  stateIndex++

  return [state[index], setState]
}

function useEffect(callback, dependencies) {
  const oldDependencies = effects[effectIndex]
  let hasChanged = true

  if (oldDependencies) {
    hasChanged = dependencies.some((dep, i) => !Object.is(dep, oldDependencies[i]));
  }
  if (hasChanged) {
    callback()
  }
  effects[effectIndex] = dependencies
  effectIndex++
}

export {
  vdm,
  setRoutes,
  setRoot,
  StateManagement,
  EventSystem,
  Router,
  renderComponent,
  useState,
  useEffect
};
