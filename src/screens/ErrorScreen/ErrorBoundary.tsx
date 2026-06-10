/* eslint-disable react/destructuring-assignment */
import { recordError } from '@app/lib/sentry';
import { markSessionError } from '@app/utils/storeReview/sessionErrorFlag';
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

import { ErrorDetails, type ErrorDetailsProps } from './ErrorDetails';

interface Props {
  children: ReactNode;
  catchErrors: 'always' | 'dev' | 'prod' | 'never';
  onReset: () => void;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * This component handles whenever the user encounters a JS error in the
 * app. It follows the "error boundary" pattern in React. We're using a
 * class component because according to the documentation, only class
 * components can be error boundaries.
 * - [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: Omit<ErrorDetailsProps, 'onReset'> = {
    error: null,
    errorInfo: null,
  };

  override shouldComponentUpdate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextProps: Readonly<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextState: Readonly<any>,
  ): boolean {
    return nextState.error !== nextProps.error;
  }

  // if an error in a child is encountered, this will run
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // catch any errors in any components and re-render with error-message
    this.setState({
      error,
      errorInfo,
    });

    markSessionError();

    recordError({
      name: 'error_boundary_error',
      message: error.message || 'Unhandled error boundary exception',
      params: {
        category: 'ErrorBoundary',
        action: 'component_catch',
        componentStack: errorInfo.componentStack,
      },
      errorCause: error,
    });
  }

  // reset the error back to null
  resetError = () => {
    this.props.onReset();
    this.setState({ error: null, errorInfo: null });
  };

  // Only enable if we're catching errors in the right environment
  isEnabled(): boolean {
    return (
      this.props.catchErrors === 'always' ||
      (this.props.catchErrors === 'dev' && __DEV__) ||
      (this.props.catchErrors === 'prod' && !__DEV__)
    );
  }

  // render an error UI if there's an error; otherwise, render children
  override render(): ReactNode {
    return this.isEnabled() && this.state.error ? (
      <ErrorDetails
        onReset={this.resetError}
        error={this.state.error}
        errorInfo={this.state.errorInfo}
      />
    ) : (
      this.props.children
    );
  }
}
