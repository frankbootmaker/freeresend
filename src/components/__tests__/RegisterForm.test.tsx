import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegisterForm from '../RegisterForm';
import { PrefsProvider } from '@/contexts/PrefsContext';
import { CURRENT_TERMS_VERSION } from '@/lib/legal';

const register = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    register,
  }),
}));

function renderRegister() {
  return render(
    <PrefsProvider>
      <RegisterForm />
    </PrefsProvider>,
  );
}

describe('RegisterForm', () => {
  beforeEach(() => {
    register.mockReset();
    window.localStorage.clear();
  });

  it('requires the current legal version before creating an account', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/your name/i), 'Mara Varga');
    await user.type(screen.getByLabelText(/work email/i), 'mara@company.test');
    await user.type(screen.getByLabelText(/^password$/i), 'long-enough');

    expect(
      screen.getByRole('link', { name: 'Terms' }),
    ).toHaveAttribute('href', '/legal/terms');
    expect(screen.getByText(new RegExp(`version ${CURRENT_TERMS_VERSION}`))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(register).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(register).toHaveBeenCalledWith({
      name: 'Mara Varga',
      email: 'mara@company.test',
      password: 'long-enough',
      acceptedTerms: true,
      acceptedTermsVersion: CURRENT_TERMS_VERSION,
    });
  });
});
