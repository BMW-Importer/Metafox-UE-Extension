/*
 * <license header>
 */

import React from "react";
import ErrorBoundary from "react-error-boundary";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ExtensionRegistration from "./ExtensionRegistration";
import MetadataEditor from "./MetadataEditor";
import PreconEditor from "./PreconEditor";
import TypeRenderer from "./TypeRenderer";
import ShopByLookEditor from "./ShopByLookEditor";
import Techdatacustomfield from "./Techdatacustomfield"

function App() {
  return (
    <Router>
      <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
        <Routes>
          <Route index element={<ExtensionRegistration />} />
          <Route
            exact path="index.html"
            element={<ExtensionRegistration />}
          />
          <Route
            exact path="metadata-editor"
            element={<MetadataEditor />}
          />
          <Route
            exact path="precon-editor"
            element={<PreconEditor />}
          />
          <Route
            exact path="shopbylook-editor"
            element={<ShopByLookEditor />}
          />
           <Route
            exact path="techdata-editor"
            element={<Techdatacustomfield />}
          />
           <Route
                exact path="renderer/:rendererId"
                element={<TypeRenderer/>}
            />
          {/* @todo YOUR CUSTOM ROUTES SHOULD BE HERE */}
        </Routes>
      </ErrorBoundary>
    </Router>
  )

  // Methods

  // error handler on UI rendering failure
  function onError(e, componentStack) {}

  // component to show if UI fails rendering
  function fallbackComponent({ componentStack, error }) {
    return (
      <React.Fragment>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>
          Phly, phly... Something went wrong :(
        </h1>
        <pre>{componentStack + "\n" + error.message}</pre>
      </React.Fragment>
    );
  }
}

export default App;
