import { useState, type FormEvent } from 'react';
import { Alert, Button, FormField, Input } from '@fuel-pass/ui';

import { isApiError } from '../../../services/httpClient';
import type { LoginRequest } from '../types/auth.types';

type LoginFormProps = {
  error?: unknown;
  isSubmitting: boolean;
  onSubmit: (request: LoginRequest) => Promise<void>;
};

type LoginFormErrors = Partial<Record<keyof LoginRequest, string>>;

const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) {
    return 'Email is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }

  return undefined;
};

const validateForm = (values: LoginRequest): LoginFormErrors => {
  const errors: LoginFormErrors = {};
  const emailError = validateEmail(values.email);

  if (emailError) {
    errors.email = emailError;
  }

  if (!values.password.trim()) {
    errors.password = 'Password is required.';
  }

  return errors;
};

const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }

  return 'Unable to sign in. Check your credentials and try again.';
};

export const LoginForm = ({ error, isSubmitting, onSubmit }: LoginFormProps) => {
  const [values, setValues] = useState<LoginRequest>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await onSubmit({
        email: values.email.trim(),
        password: values.password,
      });
    } catch {
      setValues((currentValues) => ({ ...currentValues, password: '' }));
    }
  };

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      {error ? (
        <Alert role="alert" variant="danger">
          {getErrorMessage(error)}
        </Alert>
      ) : null}

      <FormField error={errors.email} label="Email" required>
        <Input
          autoComplete="email"
          disabled={isSubmitting}
          error={Boolean(errors.email)}
          name="email"
          onChange={(event) => setValues((currentValues) => ({ ...currentValues, email: event.target.value }))}
          placeholder="name@company.com"
          type="email"
          value={values.email}
        />
      </FormField>

      <FormField error={errors.password} label="Password" required>
        <Input
          autoComplete="current-password"
          disabled={isSubmitting}
          error={Boolean(errors.password)}
          name="password"
          onChange={(event) => setValues((currentValues) => ({ ...currentValues, password: event.target.value }))}
          placeholder="Enter your password"
          type="password"
          value={values.password}
        />
      </FormField>

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
};
