import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LandingPage from '../LandingPage';
import { PrefsProvider } from '@/contexts/PrefsContext';

jest.mock('../LoginForm', () => ({
  __esModule: true,
  default: () => <h2>Sign in</h2>,
}));

jest.mock('../RegisterForm', () => ({
  __esModule: true,
  default: () => <h2>Create your organization</h2>,
}));

function renderLanding() {
  return render(
    <PrefsProvider>
      <LandingPage />
    </PrefsProvider>,
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the outbound email pitch and auth actions', () => {
    renderLanding();

    expect(
      screen.getByRole('heading', { name: /outbound email\./i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RelayHorizon home' })).toBeInTheDocument();
    expect(screen.getAllByText(/by nethorizon/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/resend-compatible https, smtp ingress/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/known api/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /deploy relayhorizon/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/legal/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/legal/privacy',
    );
    expect(screen.getByRole('link', { name: 'Imprint' })).toHaveAttribute(
      'href',
      '/legal/imprint',
    );
  });

  it('opens the login form', async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(
      screen.getByRole('heading', { name: /^sign in$/i }),
    ).toBeInTheDocument();
  });

  it('switches to German copy', async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.click(screen.getByRole('button', { name: /change language/i }));
    expect(
      screen.getByRole('heading', { name: /ausgehende e-mail\./i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument();
  });
});
