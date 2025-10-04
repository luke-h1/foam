/* eslint-disable react/destructuring-assignment */
import { sentryService } from '@app/services';
import { Component, type ErrorInfo, type ReactNode } from 'react';
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
  state: Omit<ErrorDetailsProps, 'onReset'> = { error: null, errorInfo: null };

  shouldComponentUpdate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextProps: Readonly<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nextState: Readonly<any>,
  ): boolean {
    return nextState.error !== nextProps.error;
  }

  // if an error in a child is encountered, this will run
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // catch any errors in any components and re-render with error-message
    this.setState({
      error,
      errorInfo,
    });

    sentryService.captureException(error);
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
  render(): ReactNode {
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
