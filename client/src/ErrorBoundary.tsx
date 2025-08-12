import React from "react";

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <h2>⚠️ Something broke on this page.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.error)}
          </pre>
          <p>Open the browser Console (F12 → Console) and paste errors to me.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
