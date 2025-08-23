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
      anchorTextColor: 'hsl(var(--primary))',
      anchorTextHoverColor: 'hsl(var(--primary-foreground))',
    },
    space: {
      spaceSmall: '4px',
      spaceMedium: '8px',
      spaceLarge: '16px',
    },
    fontSizes: {
      baseBodySize: '16px',
      baseInputSize: '14px',
      baseLabelSize: '14px',
      baseButtonSize: '16px',
    },
    fonts: {
      bodyFontFamily: 'inherit',
      buttonFontFamily: 'inherit',
      inputFontFamily: 'inherit',
      labelFontFamily: 'inherit',
    },
    borderWidths: {
      buttonBorderWidth: '1px',
      inputBorderWidth: '1px',
    },
    radii: {
      borderRadiusButton: 'var(--radius)',
      buttonBorderRadius: 'var(--radius)',
      inputBorderRadius: 'var(--radius)',
    },
  },
};