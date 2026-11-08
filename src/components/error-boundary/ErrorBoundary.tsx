import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { logger } from '@app/utils/logger';
import { markSessionError } from '@app/utils/store-review/sessionErrorFlag';

import {
  ErrorDetails,
  type ErrorDetailsProps,
} from './components/ErrorDetails';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: Omit<ErrorDetailsProps, 'onReset'> = {
    error: null,
    errorInfo: null,
  };

  override shouldComponentUpdate(
    _nextProps: Readonly<Props>,
    nextState: Readonly<State>,
  ): boolean {
    return nextState.error !== this.state.error;
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    markSessionError();

    logger.main.error(error.message || 'Unhandled error boundary exception', {
      name: 'error_boundary_error',
      error,
      category: 'ErrorBoundary',
      action: 'component_catch',
      componentStack: errorInfo.componentStack,
    });
  }

  resetError = () => {
    this.setState({ error: null, errorInfo: null });
  };

  override render(): ReactNode {
    return this.state.error ? (
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
