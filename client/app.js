import { Router, setRoot } from "./miniframework.js";
import { renderComponent } from "./miniframework.js";
import { createVDOM } from "./miniframework.js";

setRoot("app")
const router = new Router(renderComponent)

function Home() {
  return createVDOM("h1", {}, "Home Page",
    backToHome("/about"))
}

function About() {
  return createVDOM("h1", {}, "About Page",
    backToHome("/"));
}


function backToHome(path) {
  return createVDOM("button", { onClick: () => router.link(path) }, `go to ${path}`)
}

router.add("/", Home)
  .add("/about", About)

router.setNotFound(() =>
  createVDOM("div", {},
    createVDOM("h1", {}, "custum page not fund"),
    backToHome("/")
  )
)