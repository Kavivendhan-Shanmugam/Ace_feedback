import { Theme } from '@supabase/auth-ui-shared';

export const customAuthTheme: Theme = {
  default: {
    colors: {
      brand: 'hsl(var(--primary))',
      brandAccent: 'hsl(var(--primary-foreground))',
      brandButtonText: 'hsl(var(--primary-foreground))',
      defaultButtonBackground: 'hsl(var(--secondary))',
      defaultButtonBackgroundHover: 'hsl(var(--secondary-foreground))',
      defaultButtonBorder: 'hsl(var(--border))',
      defaultButtonText: 'hsl(var(--secondary-foreground))',
      inputBackground: 'hsl(var(--input))',
      inputBorder: 'hsl(var(--border))',
      inputBorderHover: 'hsl(var(--ring))',
      inputBorderFocus: 'hsl(var(--ring))',
      inputText: 'hsl(var(--foreground))',
      inputLabelText: 'hsl(var(--muted-foreground))',
      inputPlaceholder: 'hsl(var(--muted-foreground))',
      messageText: 'hsl(var(--foreground))',
      messageBackground: 'hsl(var(--background))',
      messageBorder: 'hsl(var(--border))',
      dangerButtonBackground: 'hsl(var(--destructive))',
      dangerButtonBackgroundHover: 'hsl(var(--destructive-foreground))',
      dangerButtonText: 'hsl(var(--destructive-foreground))',
      anchorTextColor: 'hsl(var(--primary))',
      anchorTextHoverColor: 'hsl(var(--primary-foreground))',
    },
    space: {
      spaceSmall: '4px',
      spaceMedium: '8px',
      spaceLarge: '16px',
      spaceXLarge: '24px',
      spaceXXLarge: '32px',
    },
    fontSizes: {
      base: '16px',
      large: '18px',
      small: '14px',
      xsmall: '12px',
    },
    fonts: {
      body: 'inherit',
      button: 'inherit',
      input: 'inherit',
      label: 'inherit',
    },
    borderWidths: {
      small: '1px',
      medium: '2px',
      large: '3px',
    },
    radii: {
      borderRadius: 'var(--radius)',
      buttonBorderRadius: 'var(--radius)',
      inputBorderRadius: 'var(--radius)',
    },
  },
};